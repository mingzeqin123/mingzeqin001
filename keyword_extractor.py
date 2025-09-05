#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
关键字提取模块
负责从邮件内容中提取和匹配关键字
"""

import re
import jieba
import logging
from typing import Dict, List, Set, Tuple
from collections import defaultdict, Counter


class KeywordExtractor:
    """关键字提取器类"""
    
    def __init__(self, keywords_config: Dict[str, List[str]]):
        """
        初始化关键字提取器
        
        Args:
            keywords_config: 关键字配置字典，格式为 {category: [keywords]}
        """
        self.keywords_config = keywords_config
        self.logger = logging.getLogger(__name__)
        
        # 预处理关键字 - 转换为小写并创建快速查找集合
        self.keyword_sets = {}
        self.all_keywords = set()
        
        for category, keywords in keywords_config.items():
            # 转换为小写并去重
            processed_keywords = set()
            for keyword in keywords:
                processed_keywords.add(keyword.lower())
                # 如果是中文，也添加jieba分词后的结果
                if self._contains_chinese(keyword):
                    words = jieba.lcut(keyword.lower())
                    processed_keywords.update(words)
                    
            self.keyword_sets[category] = processed_keywords
            self.all_keywords.update(processed_keywords)
            
        self.logger.info(f"已加载 {len(self.all_keywords)} 个关键字，分为 {len(self.keyword_sets)} 个类别")
    
    def extract_keywords_from_email(self, email_info: Dict) -> Dict:
        """
        从邮件中提取关键字
        
        Args:
            email_info: 邮件信息字典
            
        Returns:
            Dict: 关键字提取结果
        """
        # 合并邮件的所有文本内容
        text_content = self._combine_email_text(email_info)
        
        # 提取关键字
        keyword_matches = self._extract_keywords_from_text(text_content)
        
        # 计算关键字统计
        keyword_stats = self._calculate_keyword_stats(keyword_matches)
        
        # 确定邮件主要类别
        primary_category = self._determine_primary_category(keyword_stats)
        
        # 提取其他有用信息
        email_metadata = self._extract_email_metadata(email_info)
        
        result = {
            'email_id': email_info.get('id', ''),
            'subject': email_info.get('subject', ''),
            'from': email_info.get('from', ''),
            'date': email_info.get('date'),
            'primary_category': primary_category,
            'keyword_matches': keyword_matches,
            'keyword_stats': keyword_stats,
            'metadata': email_metadata,
            'total_keywords_found': sum(len(matches) for matches in keyword_matches.values())
        }
        
        return result
    
    def extract_keywords_from_multiple_emails(self, emails: List[Dict]) -> List[Dict]:
        """
        从多封邮件中提取关键字
        
        Args:
            emails: 邮件信息列表
            
        Returns:
            List[Dict]: 关键字提取结果列表
        """
        results = []
        
        for email_info in emails:
            try:
                result = self.extract_keywords_from_email(email_info)
                results.append(result)
            except Exception as e:
                self.logger.error(f"处理邮件时出错 (ID: {email_info.get('id', 'unknown')}): {str(e)}")
                
        return results
    
    def _combine_email_text(self, email_info: Dict) -> str:
        """合并邮件的所有文本内容"""
        text_parts = []
        
        # 主题
        subject = email_info.get('subject', '')
        if subject:
            text_parts.append(subject)
            
        # 发件人
        from_addr = email_info.get('from', '')
        if from_addr:
            text_parts.append(from_addr)
            
        # 正文
        body = email_info.get('body', '')
        if body:
            text_parts.append(body)
            
        # 附件名称
        attachments = email_info.get('attachments', [])
        for attachment in attachments:
            filename = attachment.get('filename', '')
            if filename:
                text_parts.append(filename)
                
        return ' '.join(text_parts)
    
    def _extract_keywords_from_text(self, text: str) -> Dict[str, List[Dict]]:
        """从文本中提取关键字"""
        keyword_matches = defaultdict(list)
        
        if not text:
            return dict(keyword_matches)
            
        # 预处理文本
        text_lower = text.lower()
        
        # 中文分词
        chinese_words = set()
        if self._contains_chinese(text):
            chinese_words = set(jieba.lcut(text_lower))
            
        # 英文单词分割
        english_words = set(re.findall(r'\b[a-zA-Z]+\b', text_lower))
        
        # 合并所有单词
        all_words = chinese_words | english_words
        
        # 同时检查完整文本和分词结果
        text_to_check = text_lower + ' ' + ' '.join(all_words)
        
        # 在每个类别中查找关键字
        for category, keywords in self.keyword_sets.items():
            for keyword in keywords:
                # 查找关键字在文本中的位置
                positions = self._find_keyword_positions(text_to_check, keyword)
                
                for position in positions:
                    # 获取关键字上下文
                    context = self._get_context(text, position, keyword)
                    
                    match_info = {
                        'keyword': keyword,
                        'position': position,
                        'context': context,
                        'match_type': self._determine_match_type(keyword, text_lower)
                    }
                    
                    keyword_matches[category].append(match_info)
                    
        return dict(keyword_matches)
    
    def _find_keyword_positions(self, text: str, keyword: str) -> List[int]:
        """查找关键字在文本中的所有位置"""
        positions = []
        start = 0
        
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
                
            # 检查是否为完整单词匹配（对英文关键字）
            if self._is_word_boundary(text, pos, keyword):
                positions.append(pos)
                
            start = pos + 1
            
        return positions
    
    def _is_word_boundary(self, text: str, pos: int, keyword: str) -> bool:
        """检查是否为完整单词边界"""
        # 对中文关键字不进行边界检查
        if self._contains_chinese(keyword):
            return True
            
        # 检查前后字符
        before = pos == 0 or not text[pos - 1].isalnum()
        after = pos + len(keyword) >= len(text) or not text[pos + len(keyword)].isalnum()
        
        return before and after
    
    def _get_context(self, text: str, position: int, keyword: str, context_length: int = 50) -> str:
        """获取关键字的上下文"""
        start = max(0, position - context_length)
        end = min(len(text), position + len(keyword) + context_length)
        
        context = text[start:end].strip()
        
        # 在关键字周围添加标记
        keyword_start = position - start
        keyword_end = keyword_start + len(keyword)
        
        if keyword_start >= 0 and keyword_end <= len(context):
            context = (context[:keyword_start] + 
                      f"**{context[keyword_start:keyword_end]}**" + 
                      context[keyword_end:])
                      
        return context
    
    def _determine_match_type(self, keyword: str, text: str) -> str:
        """确定匹配类型"""
        if self._contains_chinese(keyword):
            return "chinese"
        elif keyword.isalpha():
            return "english_word"
        else:
            return "mixed"
    
    def _contains_chinese(self, text: str) -> bool:
        """检查文本是否包含中文字符"""
        return bool(re.search(r'[\u4e00-\u9fff]', text))
    
    def _calculate_keyword_stats(self, keyword_matches: Dict[str, List[Dict]]) -> Dict[str, Dict]:
        """计算关键字统计信息"""
        stats = {}
        
        for category, matches in keyword_matches.items():
            if not matches:
                stats[category] = {
                    'count': 0,
                    'keywords': [],
                    'top_keywords': []
                }
                continue
                
            # 统计每个关键字的出现次数
            keyword_counts = Counter([match['keyword'] for match in matches])
            
            stats[category] = {
                'count': len(matches),
                'unique_keywords': len(keyword_counts),
                'keywords': list(keyword_counts.keys()),
                'top_keywords': keyword_counts.most_common(5),
                'keyword_counts': dict(keyword_counts)
            }
            
        return stats
    
    def _determine_primary_category(self, keyword_stats: Dict[str, Dict]) -> str:
        """确定邮件的主要类别"""
        if not keyword_stats:
            return "unknown"
            
        # 根据关键字数量确定主要类别
        category_scores = {}
        
        for category, stats in keyword_stats.items():
            count = stats.get('count', 0)
            unique_count = stats.get('unique_keywords', 0)
            
            # 综合考虑总数量和唯一关键字数量
            score = count + unique_count * 2
            category_scores[category] = score
            
        if not category_scores:
            return "unknown"
            
        # 返回得分最高的类别
        primary_category = max(category_scores, key=category_scores.get)
        
        # 如果最高分为0，返回unknown
        if category_scores[primary_category] == 0:
            return "unknown"
            
        return primary_category
    
    def _extract_email_metadata(self, email_info: Dict) -> Dict:
        """提取邮件元数据"""
        metadata = {
            'has_attachments': len(email_info.get('attachments', [])) > 0,
            'attachment_count': len(email_info.get('attachments', [])),
            'body_length': len(email_info.get('body', '')),
            'subject_length': len(email_info.get('subject', '')),
            'is_reply': 'Re:' in email_info.get('subject', '').upper() or 'RE:' in email_info.get('subject', ''),
            'is_forward': 'Fwd:' in email_info.get('subject', '') or 'FW:' in email_info.get('subject', '').upper()
        }
        
        # 分析发件人域名
        from_addr = email_info.get('from', '')
        if '@' in from_addr:
            domain = from_addr.split('@')[-1].lower()
            metadata['sender_domain'] = domain
            metadata['is_internal'] = self._is_internal_domain(domain)
        else:
            metadata['sender_domain'] = 'unknown'
            metadata['is_internal'] = False
            
        return metadata
    
    def _is_internal_domain(self, domain: str) -> bool:
        """判断是否为内部域名（可根据实际情况配置）"""
        # 这里可以配置公司内部域名列表
        internal_domains = [
            'company.com',  # 示例：替换为实际的公司域名
            'internal.com'
        ]
        
        return any(domain.endswith(internal) for internal in internal_domains)
    
    def generate_summary_report(self, extraction_results: List[Dict]) -> Dict:
        """
        生成关键字提取的汇总报告
        
        Args:
            extraction_results: 关键字提取结果列表
            
        Returns:
            Dict: 汇总报告
        """
        if not extraction_results:
            return {
                'total_emails': 0,
                'summary': 'No emails processed'
            }
            
        # 统计总体信息
        total_emails = len(extraction_results)
        total_keywords = sum(result['total_keywords_found'] for result in extraction_results)
        
        # 按类别统计
        category_stats = defaultdict(lambda: {'count': 0, 'emails': 0})
        all_keywords = defaultdict(int)
        primary_categories = defaultdict(int)
        
        for result in extraction_results:
            # 主要类别统计
            primary_cat = result.get('primary_category', 'unknown')
            primary_categories[primary_cat] += 1
            
            # 关键字统计
            for category, stats in result.get('keyword_stats', {}).items():
                if stats.get('count', 0) > 0:
                    category_stats[category]['emails'] += 1
                    category_stats[category]['count'] += stats['count']
                    
                    # 统计具体关键字
                    for keyword, count in stats.get('keyword_counts', {}).items():
                        all_keywords[keyword] += count
        
        # 生成报告
        report = {
            'total_emails': total_emails,
            'total_keywords_found': total_keywords,
            'average_keywords_per_email': round(total_keywords / total_emails, 2) if total_emails > 0 else 0,
            'primary_categories': dict(primary_categories),
            'category_statistics': dict(category_stats),
            'top_keywords': dict(Counter(all_keywords).most_common(20)),
            'processing_summary': {
                'emails_with_keywords': sum(1 for result in extraction_results if result['total_keywords_found'] > 0),
                'emails_without_keywords': sum(1 for result in extraction_results if result['total_keywords_found'] == 0)
            }
        }
        
        return report