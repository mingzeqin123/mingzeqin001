#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI评论分类器
对用户评论进行智能分类，识别灌水、正常评论、广告等类型
"""

import re
import json
import jieba
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CommentClassification:
    """评论分类结果"""
    category: str  # 分类类别
    confidence: float  # 置信度 (0-1)
    reasons: List[str]  # 分类原因
    keywords: List[str]  # 关键词
    timestamp: str  # 分类时间

class CommentClassifier:
    """AI评论分类器"""
    
    # 评论类别定义
    CATEGORIES = {
        'normal': '正常评论',
        'spam': '灌水评论', 
        'advertisement': '广告评论',
        'offensive': '恶意评论',
        'duplicate': '重复评论',
        'meaningless': '无意义评论'
    }
    
    def __init__(self):
        """初始化分类器"""
        self.load_keywords()
        self.load_patterns()
        self.previous_comments = []  # 用于检测重复评论
        
    def load_keywords(self):
        """加载关键词词典"""
        # 广告关键词
        self.ad_keywords = {
            '联系方式': ['微信', 'QQ', '电话', '手机', '联系', '加我', '私聊', '咨询'],
            '商品推销': ['代购', '批发', '零售', '优惠', '打折', '促销', '特价', '包邮'],
            '服务推广': ['加盟', '代理', '招商', '合作', '兼职', '赚钱', '投资', '理财'],
            '网址链接': ['www', 'http', '.com', '.cn', '点击', '链接', '网址', '官网']
        }
        
        # 灌水关键词
        self.spam_keywords = {
            '无意义字符': ['哈哈哈', '呵呵呵', '嘿嘿嘿', '嗯嗯嗯', '额额额'],
            '简单回复': ['顶', '沙发', '板凳', '路过', '支持', '赞', '好的', '嗯'],
            '表情符号': ['😂', '😄', '😊', '👍', '💪', '🔥', '❤️', '😍']
        }
        
        # 恶意关键词
        self.offensive_keywords = {
            '脏话': ['傻逼', '白痴', '智障', '垃圾', '废物', '滚蛋'],
            '攻击性': ['死', '杀', '打', '揍', '骂', '恨'],
            '歧视性': ['歧视', '仇恨', '种族', '性别', '地域']
        }
        
    def load_patterns(self):
        """加载正则表达式模式"""
        # 联系方式模式
        self.contact_patterns = [
            r'微信[：:]\s*[a-zA-Z0-9_-]+',
            r'QQ[：:]\s*\d{5,12}',
            r'电话[：:]?\s*1[3-9]\d{9}',
            r'手机[：:]?\s*1[3-9]\d{9}',
            r'加我.*[a-zA-Z0-9_-]{6,}'
        ]
        
        # 网址模式
        self.url_patterns = [
            r'https?://[^\s]+',
            r'www\.[^\s]+',
            r'[a-zA-Z0-9-]+\.(com|cn|net|org)[^\s]*'
        ]
        
        # 重复字符模式
        self.repeat_patterns = [
            r'(.)\1{4,}',  # 同一字符重复5次以上
            r'([哈呵嘿嗯额])\1{2,}',  # 语气词重复
            r'[！!]{3,}',  # 多个感叹号
            r'[？?]{3,}'   # 多个问号
        ]
        
    def extract_features(self, comment: str) -> Dict:
        """提取评论特征"""
        features = {
            'length': len(comment),
            'word_count': len(jieba.lcut(comment)),
            'has_contact': False,
            'has_url': False,
            'has_repeat': False,
            'ad_score': 0,
            'spam_score': 0,
            'offensive_score': 0,
            'punctuation_ratio': 0,
            'number_ratio': 0,
            'english_ratio': 0
        }
        
        # 检测联系方式
        for pattern in self.contact_patterns:
            if re.search(pattern, comment):
                features['has_contact'] = True
                break
                
        # 检测网址
        for pattern in self.url_patterns:
            if re.search(pattern, comment):
                features['has_url'] = True
                break
                
        # 检测重复字符
        for pattern in self.repeat_patterns:
            if re.search(pattern, comment):
                features['has_repeat'] = True
                break
                
        # 计算广告得分
        for category, keywords in self.ad_keywords.items():
            for keyword in keywords:
                if keyword in comment:
                    features['ad_score'] += 1
                    
        # 计算灌水得分
        for category, keywords in self.spam_keywords.items():
            for keyword in keywords:
                if keyword in comment:
                    features['spam_score'] += 1
                    
        # 计算恶意得分
        for category, keywords in self.offensive_keywords.items():
            for keyword in keywords:
                if keyword in comment:
                    features['offensive_score'] += 1
                    
        # 计算字符比例
        if features['length'] > 0:
            punctuation_count = len(re.findall(r'[^\w\s]', comment))
            number_count = len(re.findall(r'\d', comment))
            english_count = len(re.findall(r'[a-zA-Z]', comment))
            
            features['punctuation_ratio'] = punctuation_count / features['length']
            features['number_ratio'] = number_count / features['length']
            features['english_ratio'] = english_count / features['length']
            
        return features
        
    def check_duplicate(self, comment: str) -> Tuple[bool, float]:
        """检查重复评论"""
        if not self.previous_comments:
            return False, 0.0
            
        # 计算与历史评论的相似度
        max_similarity = 0.0
        for prev_comment in self.previous_comments[-100:]:  # 只检查最近100条
            similarity = self.calculate_similarity(comment, prev_comment)
            max_similarity = max(max_similarity, similarity)
            
        # 相似度超过0.8认为是重复
        is_duplicate = max_similarity > 0.8
        return is_duplicate, max_similarity
        
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """计算文本相似度"""
        if text1 == text2:
            return 1.0
            
        # 简单的字符级相似度计算
        len1, len2 = len(text1), len(text2)
        if len1 == 0 or len2 == 0:
            return 0.0
            
        # 计算编辑距离
        dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]
        
        for i in range(len1 + 1):
            dp[i][0] = i
        for j in range(len2 + 1):
            dp[0][j] = j
            
        for i in range(1, len1 + 1):
            for j in range(1, len2 + 1):
                if text1[i-1] == text2[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1
                    
        edit_distance = dp[len1][len2]
        max_len = max(len1, len2)
        similarity = 1 - edit_distance / max_len
        
        return max(0.0, similarity)
        
    def classify_comment(self, comment: str, user_id: Optional[str] = None) -> CommentClassification:
        """分类评论"""
        if not comment or not comment.strip():
            return CommentClassification(
                category='meaningless',
                confidence=1.0,
                reasons=['评论为空'],
                keywords=[],
                timestamp=datetime.now().isoformat()
            )
            
        comment = comment.strip()
        features = self.extract_features(comment)
        reasons = []
        keywords = []
        
        # 检查重复评论
        is_duplicate, similarity = self.check_duplicate(comment)
        if is_duplicate:
            return CommentClassification(
                category='duplicate',
                confidence=similarity,
                reasons=[f'与历史评论相似度: {similarity:.2f}'],
                keywords=[],
                timestamp=datetime.now().isoformat()
            )
            
        # 恶意评论检测
        if features['offensive_score'] > 0:
            offensive_keywords = []
            for category, keywords_list in self.offensive_keywords.items():
                for keyword in keywords_list:
                    if keyword in comment:
                        offensive_keywords.append(keyword)
                        reasons.append(f'包含恶意词汇: {keyword}')
                        
            return CommentClassification(
                category='offensive',
                confidence=min(1.0, features['offensive_score'] * 0.3),
                reasons=reasons,
                keywords=offensive_keywords,
                timestamp=datetime.now().isoformat()
            )
            
        # 广告评论检测
        ad_confidence = 0.0
        if features['has_contact']:
            ad_confidence += 0.4
            reasons.append('包含联系方式')
            
        if features['has_url']:
            ad_confidence += 0.3
            reasons.append('包含网址链接')
            
        if features['ad_score'] > 0:
            ad_confidence += features['ad_score'] * 0.1
            ad_keywords = []
            for category, keywords_list in self.ad_keywords.items():
                for keyword in keywords_list:
                    if keyword in comment:
                        ad_keywords.append(keyword)
                        reasons.append(f'包含广告词汇: {keyword}')
            keywords.extend(ad_keywords)
            
        if ad_confidence > 0.5:
            return CommentClassification(
                category='advertisement',
                confidence=min(1.0, ad_confidence),
                reasons=reasons,
                keywords=keywords,
                timestamp=datetime.now().isoformat()
            )
            
        # 灌水评论检测
        spam_confidence = 0.0
        
        # 长度过短
        if features['length'] < 5:
            spam_confidence += 0.3
            reasons.append('评论过短')
            
        # 重复字符
        if features['has_repeat']:
            spam_confidence += 0.2
            reasons.append('包含重复字符')
            
        # 灌水关键词
        if features['spam_score'] > 0:
            spam_confidence += features['spam_score'] * 0.1
            spam_keywords = []
            for category, keywords_list in self.spam_keywords.items():
                for keyword in keywords_list:
                    if keyword in comment:
                        spam_keywords.append(keyword)
                        reasons.append(f'包含灌水词汇: {keyword}')
            keywords.extend(spam_keywords)
            
        # 标点符号比例过高
        if features['punctuation_ratio'] > 0.3:
            spam_confidence += 0.2
            reasons.append('标点符号过多')
            
        if spam_confidence > 0.4:
            return CommentClassification(
                category='spam',
                confidence=min(1.0, spam_confidence),
                reasons=reasons,
                keywords=keywords,
                timestamp=datetime.now().isoformat()
            )
            
        # 无意义评论检测
        meaningless_confidence = 0.0
        
        # 词汇量过少
        if features['word_count'] < 2:
            meaningless_confidence += 0.4
            reasons.append('词汇量过少')
            
        # 全是数字或英文
        if features['number_ratio'] > 0.8 or features['english_ratio'] > 0.8:
            meaningless_confidence += 0.3
            reasons.append('内容单一')
            
        if meaningless_confidence > 0.5:
            return CommentClassification(
                category='meaningless',
                confidence=min(1.0, meaningless_confidence),
                reasons=reasons,
                keywords=keywords,
                timestamp=datetime.now().isoformat()
            )
            
        # 添加到历史记录
        self.previous_comments.append(comment)
        
        # 默认为正常评论
        return CommentClassification(
            category='normal',
            confidence=0.8,
            reasons=['未发现异常特征'],
            keywords=[],
            timestamp=datetime.now().isoformat()
        )
        
    def batch_classify(self, comments: List[str]) -> List[CommentClassification]:
        """批量分类评论"""
        results = []
        for comment in comments:
            result = self.classify_comment(comment)
            results.append(result)
            logger.info(f"分类结果: {comment[:20]}... -> {result.category} ({result.confidence:.2f})")
        return results
        
    def get_statistics(self, classifications: List[CommentClassification]) -> Dict:
        """获取分类统计信息"""
        stats = {category: 0 for category in self.CATEGORIES.keys()}
        total = len(classifications)
        
        for classification in classifications:
            stats[classification.category] += 1
            
        # 计算百分比
        percentages = {}
        for category, count in stats.items():
            percentages[category] = (count / total * 100) if total > 0 else 0
            
        return {
            'total_comments': total,
            'category_counts': stats,
            'category_percentages': percentages,
            'category_names': self.CATEGORIES
        }

def main():
    """主函数 - 演示使用"""
    classifier = CommentClassifier()
    
    # 测试评论
    test_comments = [
        "这个产品真的很不错，推荐大家购买！",
        "哈哈哈哈哈哈哈哈哈哈",
        "微信：abc123，有需要的联系我",
        "顶顶顶顶顶",
        "www.example.com 点击查看详情",
        "你这个傻逼，滚蛋！",
        "感谢分享，学到了很多东西，对我很有帮助。",
        "111111111",
        "代购正品，价格优惠，欢迎咨询",
        "支持！！！！！",
        "这篇文章写得很好，分析得很透彻，给我很多启发。"
    ]
    
    print("=" * 50)
    print("AI评论分类器 - 测试结果")
    print("=" * 50)
    
    # 批量分类
    results = classifier.batch_classify(test_comments)
    
    # 显示结果
    for i, (comment, result) in enumerate(zip(test_comments, results)):
        print(f"\n评论 {i+1}: {comment}")
        print(f"分类: {classifier.CATEGORIES[result.category]}")
        print(f"置信度: {result.confidence:.2f}")
        print(f"原因: {', '.join(result.reasons)}")
        if result.keywords:
            print(f"关键词: {', '.join(result.keywords)}")
            
    # 统计信息
    stats = classifier.get_statistics(results)
    print("\n" + "=" * 50)
    print("统计信息")
    print("=" * 50)
    print(f"总评论数: {stats['total_comments']}")
    for category, count in stats['category_counts'].items():
        category_name = stats['category_names'][category]
        percentage = stats['category_percentages'][category]
        print(f"{category_name}: {count} 条 ({percentage:.1f}%)")

if __name__ == "__main__":
    main()