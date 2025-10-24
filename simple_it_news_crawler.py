#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版IT新闻爬虫 - 爬取每日IT行业最新新闻并筛选热度最高的10条
"""

import requests
import json
import time
import re
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import logging
from typing import List, Dict, Optional

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleITNewsCrawler:
    """简化版IT新闻爬虫类"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        })
        
        # 关键词权重配置
        self.keyword_weights = {
            'AI': 10, '人工智能': 10, '机器学习': 8, '深度学习': 8,
            '区块链': 7, '比特币': 6, '加密货币': 6,
            '5G': 8, '物联网': 7, 'IoT': 7,
            '云计算': 6, '云服务': 6, 'AWS': 5, '阿里云': 5,
            '大数据': 6, '数据挖掘': 5,
            '移动互联网': 5, 'APP': 4,
            '网络安全': 7, '黑客': 6, '漏洞': 5,
            '开源': 5, 'GitHub': 4,
            '创业': 4, '融资': 4, 'IPO': 6,
            '苹果': 5, 'iPhone': 5, 'iOS': 4,
            '谷歌': 5, 'Google': 5, 'Android': 4,
            '微软': 4, 'Microsoft': 4, 'Windows': 3,
            '特斯拉': 6, '马斯克': 6, '电动车': 5,
            '芯片': 7, '半导体': 7, '台积电': 6,
            '元宇宙': 8, 'VR': 6, 'AR': 6,
            '自动驾驶': 7, '无人驾驶': 7,
            '量子计算': 8, '量子': 7,
            'ChatGPT': 9, 'GPT': 8, 'OpenAI': 8,
            '人工智能': 10, 'AI': 10
        }
    
    def fetch_page(self, url: str, timeout: int = 10) -> Optional[BeautifulSoup]:
        """获取页面内容"""
        try:
            response = self.session.get(url, timeout=timeout)
            response.raise_for_status()
            response.encoding = response.apparent_encoding
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            logger.error(f"获取页面失败 {url}: {e}")
            return None
    
    def crawl_36kr(self) -> List[Dict]:
        """爬取36氪新闻"""
        logger.info("正在爬取36氪...")
        news_list = []
        
        try:
            # 使用36氪的API接口
            api_url = "https://gateway.36kr.com/api/mis/v1/newsflash/list"
            params = {
                'bizId': 1,
                'lastId': 0,
                'size': 20
            }
            
            response = self.session.get(api_url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 0:
                    items = data.get('data', {}).get('items', [])
                    for item in items:
                        news_list.append({
                            'title': item.get('title', ''),
                            'link': f"https://36kr.com/p/{item.get('id', '')}",
                            'publish_time': item.get('publishTime', ''),
                            'summary': item.get('summary', ''),
                            'source': '36氪'
                        })
        except Exception as e:
            logger.error(f"爬取36氪失败: {e}")
        
        logger.info(f"36氪爬取到 {len(news_list)} 条新闻")
        return news_list
    
    def crawl_techcrunch(self) -> List[Dict]:
        """爬取TechCrunch新闻（英文）"""
        logger.info("正在爬取TechCrunch...")
        news_list = []
        
        try:
            url = "https://techcrunch.com/"
            soup = self.fetch_page(url)
            if soup:
                articles = soup.select('article')
                for article in articles[:15]:
                    try:
                        title_elem = article.select_one('h2 a, h3 a, .post-block__title a')
                        if title_elem:
                            title = title_elem.get_text(strip=True)
                            link = urljoin(url, title_elem.get('href', ''))
                            
                            time_elem = article.select_one('time, .post-block__meta time')
                            publish_time = time_elem.get_text(strip=True) if time_elem else ''
                            
                            summary_elem = article.select_one('.post-block__content, .excerpt')
                            summary = summary_elem.get_text(strip=True) if summary_elem else ''
                            
                            news_list.append({
                                'title': title,
                                'link': link,
                                'publish_time': publish_time,
                                'summary': summary,
                                'source': 'TechCrunch'
                            })
                    except Exception as e:
                        continue
        except Exception as e:
            logger.error(f"爬取TechCrunch失败: {e}")
        
        logger.info(f"TechCrunch爬取到 {len(news_list)} 条新闻")
        return news_list
    
    def crawl_hackernews(self) -> List[Dict]:
        """爬取Hacker News"""
        logger.info("正在爬取Hacker News...")
        news_list = []
        
        try:
            url = "https://news.ycombinator.com/"
            soup = self.fetch_page(url)
            if soup:
                rows = soup.select('.athing')
                for row in rows[:20]:
                    try:
                        title_elem = row.select_one('.titleline a')
                        if title_elem:
                            title = title_elem.get_text(strip=True)
                            link = title_elem.get('href', '')
                            if not link.startswith('http'):
                                link = urljoin(url, link)
                            
                            # 获取分数和评论数
                            score_elem = row.find_next_sibling('tr').select_one('.score')
                            score = score_elem.get_text(strip=True) if score_elem else '0'
                            
                            news_list.append({
                                'title': title,
                                'link': link,
                                'publish_time': '',
                                'summary': f"Score: {score}",
                                'source': 'Hacker News'
                            })
                    except Exception as e:
                        continue
        except Exception as e:
            logger.error(f"爬取Hacker News失败: {e}")
        
        logger.info(f"Hacker News爬取到 {len(news_list)} 条新闻")
        return news_list
    
    def create_mock_news(self) -> List[Dict]:
        """创建模拟新闻数据用于测试"""
        mock_news = [
            {
                'title': 'OpenAI发布GPT-4 Turbo，性能提升显著',
                'link': 'https://example.com/gpt4-turbo',
                'publish_time': '今天 10:30',
                'summary': 'OpenAI宣布推出GPT-4 Turbo版本，在保持高质量输出的同时大幅提升了处理速度',
                'source': '模拟数据'
            },
            {
                'title': '苹果发布M3芯片，AI性能提升60%',
                'link': 'https://example.com/apple-m3',
                'publish_time': '今天 09:15',
                'summary': '苹果在最新发布会上推出M3芯片，专为AI和机器学习任务优化',
                'source': '模拟数据'
            },
            {
                'title': '特斯拉FSD Beta 12版本开始推送',
                'link': 'https://example.com/tesla-fsd',
                'publish_time': '今天 08:45',
                'summary': '特斯拉开始向部分用户推送完全自动驾驶Beta 12版本',
                'source': '模拟数据'
            },
            {
                'title': '微软Copilot正式商用，企业AI助手时代来临',
                'link': 'https://example.com/microsoft-copilot',
                'publish_time': '昨天 16:20',
                'summary': '微软宣布Copilot AI助手正式商用，将改变企业办公方式',
                'source': '模拟数据'
            },
            {
                'title': '量子计算突破：IBM展示1000量子比特处理器',
                'link': 'https://example.com/ibm-quantum',
                'publish_time': '昨天 14:30',
                'summary': 'IBM在量子计算领域取得重大突破，展示了1000量子比特处理器',
                'source': '模拟数据'
            },
            {
                'title': 'ChatGPT用户突破1亿，AI应用进入爆发期',
                'link': 'https://example.com/chatgpt-users',
                'publish_time': '昨天 11:00',
                'summary': 'ChatGPT月活用户突破1亿，标志着AI应用进入大规模普及阶段',
                'source': '模拟数据'
            },
            {
                'title': '英伟达H200 GPU发布，AI训练速度提升2倍',
                'link': 'https://example.com/nvidia-h200',
                'publish_time': '2天前 15:30',
                'summary': '英伟达发布H200 GPU，专为AI训练和推理优化',
                'source': '模拟数据'
            },
            {
                'title': 'Meta发布Quest 3，混合现实体验升级',
                'link': 'https://example.com/meta-quest3',
                'publish_time': '2天前 13:45',
                'summary': 'Meta发布Quest 3头显，带来更沉浸的混合现实体验',
                'source': '模拟数据'
            },
            {
                'title': '谷歌Bard升级，支持多模态AI交互',
                'link': 'https://example.com/google-bard',
                'publish_time': '3天前 10:20',
                'summary': '谷歌Bard AI助手升级，新增图像和语音交互功能',
                'source': '模拟数据'
            },
            {
                'title': '字节跳动推出AI编程助手CodeWhisperer',
                'link': 'https://example.com/bytedance-ai',
                'publish_time': '3天前 09:15',
                'summary': '字节跳动发布AI编程助手，帮助开发者提高编码效率',
                'source': '模拟数据'
            },
            {
                'title': '亚马逊AWS推出Bedrock AI服务',
                'link': 'https://example.com/aws-bedrock',
                'publish_time': '4天前 16:00',
                'summary': '亚马逊AWS推出Bedrock AI服务，提供多种大语言模型选择',
                'source': '模拟数据'
            },
            {
                'title': '百度文心一言4.0发布，中文AI能力领先',
                'link': 'https://example.com/baidu-wenxin',
                'publish_time': '4天前 14:30',
                'summary': '百度发布文心一言4.0，在中文理解和生成方面表现优异',
                'source': '模拟数据'
            }
        ]
        
        logger.info(f"创建了 {len(mock_news)} 条模拟新闻")
        return mock_news
    
    def calculate_heat_score(self, news: Dict) -> float:
        """计算新闻热度分数"""
        title = news.get('title', '').lower()
        summary = news.get('summary', '').lower()
        content = f"{title} {summary}"
        
        # 基础分数
        base_score = 1.0
        
        # 关键词匹配分数
        keyword_score = 0
        for keyword, weight in self.keyword_weights.items():
            if keyword.lower() in content:
                keyword_score += weight
        
        # 时间新鲜度分数
        time_score = 1.0
        publish_time = news.get('publish_time', '')
        if '今天' in publish_time or '刚刚' in publish_time:
            time_score = 2.0
        elif '昨天' in publish_time:
            time_score = 1.5
        elif '小时前' in publish_time:
            time_score = 1.8
        elif '分钟前' in publish_time:
            time_score = 2.0
        elif '天前' in publish_time:
            time_score = 1.2
        
        # 标题长度分数
        title_length = len(news.get('title', ''))
        if 10 <= title_length <= 50:
            length_score = 1.2
        elif 5 <= title_length < 10 or 50 < title_length <= 80:
            length_score = 1.0
        else:
            length_score = 0.8
        
        # 来源权重
        source_weights = {
            '36氪': 1.2,
            'TechCrunch': 1.1,
            'Hacker News': 1.0,
            '模拟数据': 1.0
        }
        source_score = source_weights.get(news.get('source', ''), 1.0)
        
        # 计算最终分数
        final_score = base_score * (1 + keyword_score * 0.1) * time_score * length_score * source_score
        
        return round(final_score, 2)
    
    def crawl_all_news(self) -> List[Dict]:
        """爬取所有新闻源的新闻"""
        all_news = []
        
        # 先添加模拟数据用于演示
        all_news.extend(self.create_mock_news())
        
        # 尝试爬取真实新闻源
        try:
            all_news.extend(self.crawl_36kr())
        except Exception as e:
            logger.warning(f"36氪爬取失败: {e}")
        
        try:
            all_news.extend(self.crawl_techcrunch())
        except Exception as e:
            logger.warning(f"TechCrunch爬取失败: {e}")
        
        try:
            all_news.extend(self.crawl_hackernews())
        except Exception as e:
            logger.warning(f"Hacker News爬取失败: {e}")
        
        return all_news
    
    def get_top_news(self, limit: int = 10) -> List[Dict]:
        """获取热度最高的新闻"""
        logger.info("开始爬取IT新闻...")
        
        # 爬取所有新闻
        all_news = self.crawl_all_news()
        
        if not all_news:
            logger.warning("未爬取到任何新闻")
            return []
        
        # 去重（基于标题）
        seen_titles = set()
        unique_news = []
        for news in all_news:
            title = news.get('title', '')
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique_news.append(news)
        
        logger.info(f"去重后共有 {len(unique_news)} 条新闻")
        
        # 计算热度分数并排序
        for news in unique_news:
            news['heat_score'] = self.calculate_heat_score(news)
        
        # 按热度分数排序
        top_news = sorted(unique_news, key=lambda x: x['heat_score'], reverse=True)
        
        return top_news[:limit]
    
    def save_to_json(self, news_list: List[Dict], filename: str = None):
        """保存新闻到JSON文件"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'it_news_top10_{timestamp}.json'
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(news_list, f, ensure_ascii=False, indent=2)
            logger.info(f"新闻已保存到 {filename}")
        except Exception as e:
            logger.error(f"保存文件失败: {e}")
    
    def print_news(self, news_list: List[Dict]):
        """打印新闻列表"""
        print(f"\n🔥 今日IT新闻热度排行榜 (Top {len(news_list)})\n")
        print("=" * 100)
        
        for i, news in enumerate(news_list, 1):
            print(f"\n{i}. 【{news['source']}】{news['title']}")
            print(f"   🔥 热度分数: {news['heat_score']}")
            print(f"   ⏰ 发布时间: {news['publish_time']}")
            if news['summary']:
                print(f"   📝 摘要: {news['summary']}")
            print(f"   🔗 链接: {news['link']}")
            print("-" * 100)

def main():
    """主函数"""
    crawler = SimpleITNewsCrawler()
    
    try:
        # 获取热度最高的10条新闻
        top_news = crawler.get_top_news(10)
        
        if top_news:
            # 打印结果
            crawler.print_news(top_news)
            
            # 保存到文件
            crawler.save_to_json(top_news)
            
            # 保存到Excel（如果pandas可用）
            try:
                import pandas as pd
                df = pd.DataFrame(top_news)
                excel_filename = f'it_news_top10_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
                df.to_excel(excel_filename, index=False)
                logger.info(f"新闻已保存到Excel文件: {excel_filename}")
            except ImportError:
                logger.info("pandas未安装，跳过Excel导出")
        else:
            logger.warning("未获取到任何新闻")
    
    except Exception as e:
        logger.error(f"程序执行失败: {e}")

if __name__ == "__main__":
    main()