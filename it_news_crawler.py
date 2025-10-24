#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IT新闻爬虫 - 爬取每日IT行业最新新闻并筛选热度最高的10条
"""

import requests
import json
import time
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import logging
from typing import List, Dict, Optional
import hashlib

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('it_news_crawler.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ITNewsCrawler:
    """IT新闻爬虫类"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        # 新闻源配置
        self.news_sources = [
            {
                'name': '36氪',
                'url': 'https://36kr.com/newsflashes',
                'type': 'html',
                'selectors': {
                    'title': '.newsflash-item .title',
                    'link': '.newsflash-item a',
                    'time': '.newsflash-item .time',
                    'summary': '.newsflash-item .summary'
                }
            },
            {
                'name': '虎嗅网',
                'url': 'https://www.huxiu.com/channel/104.html',
                'type': 'html',
                'selectors': {
                    'title': '.article-item .article-title',
                    'link': '.article-item .article-title a',
                    'time': '.article-item .article-time',
                    'summary': '.article-item .article-summary'
                }
            },
            {
                'name': '钛媒体',
                'url': 'https://www.tmtpost.com/',
                'type': 'html',
                'selectors': {
                    'title': '.article-item .title',
                    'link': '.article-item .title a',
                    'time': '.article-item .time',
                    'summary': '.article-item .summary'
                }
            },
            {
                'name': 'InfoQ',
                'url': 'https://www.infoq.cn/',
                'type': 'html',
                'selectors': {
                    'title': '.article-item .title',
                    'link': '.article-item .title a',
                    'time': '.article-item .time',
                    'summary': '.article-item .summary'
                }
            }
        ]
        
        # 关键词权重配置（用于热度计算）
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
            '量子计算': 8, '量子': 7
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
    
    def extract_news_from_source(self, source: Dict) -> List[Dict]:
        """从单个新闻源提取新闻"""
        logger.info(f"正在爬取 {source['name']}...")
        
        soup = self.fetch_page(source['url'])
        if not soup:
            return []
        
        news_list = []
        selectors = source['selectors']
        
        try:
            # 根据不同的新闻源结构提取新闻
            if source['name'] == '36氪':
                news_items = soup.select('.newsflash-item')
                for item in news_items[:20]:  # 限制数量
                    try:
                        title_elem = item.select_one(selectors['title'])
                        link_elem = item.select_one(selectors['link'])
                        time_elem = item.select_one(selectors['time'])
                        summary_elem = item.select_one(selectors['summary'])
                        
                        if title_elem and link_elem:
                            title = title_elem.get_text(strip=True)
                            link = urljoin(source['url'], link_elem.get('href', ''))
                            publish_time = time_elem.get_text(strip=True) if time_elem else ''
                            summary = summary_elem.get_text(strip=True) if summary_elem else ''
                            
                            news_list.append({
                                'title': title,
                                'link': link,
                                'publish_time': publish_time,
                                'summary': summary,
                                'source': source['name']
                            })
                    except Exception as e:
                        logger.warning(f"解析新闻项失败: {e}")
                        continue
            
            elif source['name'] == '虎嗅网':
                news_items = soup.select('.article-item')
                for item in news_items[:20]:
                    try:
                        title_elem = item.select_one(selectors['title'])
                        link_elem = item.select_one(selectors['link'])
                        time_elem = item.select_one(selectors['time'])
                        summary_elem = item.select_one(selectors['summary'])
                        
                        if title_elem and link_elem:
                            title = title_elem.get_text(strip=True)
                            link = urljoin(source['url'], link_elem.get('href', ''))
                            publish_time = time_elem.get_text(strip=True) if time_elem else ''
                            summary = summary_elem.get_text(strip=True) if summary_elem else ''
                            
                            news_list.append({
                                'title': title,
                                'link': link,
                                'publish_time': publish_time,
                                'summary': summary,
                                'source': source['name']
                            })
                    except Exception as e:
                        logger.warning(f"解析新闻项失败: {e}")
                        continue
            
            # 其他新闻源的处理逻辑类似...
            else:
                # 通用处理逻辑
                news_items = soup.select('.article-item, .news-item, .post-item')
                for item in news_items[:20]:
                    try:
                        title_elem = item.select_one('a, .title, h1, h2, h3')
                        if title_elem:
                            title = title_elem.get_text(strip=True)
                            link = urljoin(source['url'], title_elem.get('href', ''))
                            
                            news_list.append({
                                'title': title,
                                'link': link,
                                'publish_time': '',
                                'summary': '',
                                'source': source['name']
                            })
                    except Exception as e:
                        logger.warning(f"解析新闻项失败: {e}")
                        continue
        
        except Exception as e:
            logger.error(f"解析 {source['name']} 失败: {e}")
        
        logger.info(f"{source['name']} 爬取到 {len(news_list)} 条新闻")
        return news_list
    
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
        
        # 时间新鲜度分数（假设今天发布的新闻分数更高）
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
        
        # 标题长度分数（适中的标题长度得分更高）
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
            '虎嗅网': 1.1,
            '钛媒体': 1.0,
            'InfoQ': 1.0
        }
        source_score = source_weights.get(news.get('source', ''), 1.0)
        
        # 计算最终分数
        final_score = base_score * (1 + keyword_score * 0.1) * time_score * length_score * source_score
        
        return round(final_score, 2)
    
    def crawl_all_news(self) -> List[Dict]:
        """爬取所有新闻源的新闻"""
        all_news = []
        
        for source in self.news_sources:
            try:
                news_list = self.extract_news_from_source(source)
                all_news.extend(news_list)
                time.sleep(2)  # 避免请求过于频繁
            except Exception as e:
                logger.error(f"爬取 {source['name']} 失败: {e}")
                continue
        
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
        print("=" * 80)
        
        for i, news in enumerate(news_list, 1):
            print(f"\n{i}. 【{news['source']}】{news['title']}")
            print(f"   热度分数: {news['heat_score']}")
            print(f"   发布时间: {news['publish_time']}")
            if news['summary']:
                print(f"   摘要: {news['summary']}")
            print(f"   链接: {news['link']}")
            print("-" * 80)

def main():
    """主函数"""
    crawler = ITNewsCrawler()
    
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
                df.to_excel(excel_filename, index=False, encoding='utf-8')
                logger.info(f"新闻已保存到Excel文件: {excel_filename}")
            except ImportError:
                logger.info("pandas未安装，跳过Excel导出")
        else:
            logger.warning("未获取到任何新闻")
    
    except Exception as e:
        logger.error(f"程序执行失败: {e}")

if __name__ == "__main__":
    main()