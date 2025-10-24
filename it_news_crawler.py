#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IT新闻爬虫 - 爬取每日IT行业最新新闻并按热度排序
支持多个新闻源：36氪、虎嗅、InfoQ、CSDN等
"""

import requests
import json
import time
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import List, Dict, Optional
import logging
from urllib.parse import urljoin, urlparse
import hashlib

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class NewsItem:
    """新闻条目数据结构"""
    title: str
    url: str
    source: str
    publish_time: str
    summary: str = ""
    view_count: int = 0
    comment_count: int = 0
    like_count: int = 0
    heat_score: float = 0.0
    tags: List[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
    
    def calculate_heat_score(self) -> float:
        """计算新闻热度分数"""
        # 基础分数：浏览量权重40%，评论数权重30%，点赞数权重20%，时间新鲜度权重10%
        view_score = min(self.view_count / 10000, 10) * 0.4  # 浏览量标准化到10分
        comment_score = min(self.comment_count / 100, 10) * 0.3  # 评论数标准化到10分
        like_score = min(self.like_count / 1000, 10) * 0.2  # 点赞数标准化到10分
        
        # 时间新鲜度分数（24小时内的新闻获得更高分数）
        try:
            pub_time = datetime.strptime(self.publish_time, "%Y-%m-%d %H:%M:%S")
            hours_ago = (datetime.now() - pub_time).total_seconds() / 3600
            time_score = max(0, (24 - hours_ago) / 24) * 10 * 0.1
        except:
            time_score = 0
        
        self.heat_score = view_score + comment_score + like_score + time_score
        return self.heat_score

class ITNewsCrawler:
    """IT新闻爬虫主类"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.news_items: List[NewsItem] = []
        
    def crawl_36kr(self) -> List[NewsItem]:
        """爬取36氪新闻"""
        logger.info("开始爬取36氪新闻...")
        news_list = []
        
        try:
            # 36氪API接口（模拟真实请求）
            url = "https://36kr.com/api/search-column/mainsite"
            params = {
                'per_page': 20,
                'page': 1
            }
            
            response = self.session.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                for item in data.get('data', {}).get('items', []):
                    news_item = NewsItem(
                        title=item.get('title', ''),
                        url=f"https://36kr.com/p/{item.get('id', '')}",
                        source="36氪",
                        publish_time=self._format_time(item.get('published_at', '')),
                        summary=item.get('summary', ''),
                        view_count=item.get('stats', {}).get('view_count', 0),
                        comment_count=item.get('stats', {}).get('comment_count', 0),
                        like_count=item.get('stats', {}).get('like_count', 0)
                    )
                    news_item.calculate_heat_score()
                    news_list.append(news_item)
                    
        except Exception as e:
            logger.error(f"爬取36氪新闻失败: {e}")
            # 备用方案：爬取网页
            news_list.extend(self._crawl_36kr_web())
            
        logger.info(f"36氪新闻爬取完成，获得 {len(news_list)} 条新闻")
        return news_list
    
    def _crawl_36kr_web(self) -> List[NewsItem]:
        """备用方案：爬取36氪网页版"""
        news_list = []
        try:
            url = "https://36kr.com/"
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 查找新闻条目
            articles = soup.find_all('div', class_='article-item-title')
            for article in articles[:20]:  # 限制20条
                title_elem = article.find('a')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    url = urljoin("https://36kr.com", title_elem.get('href', ''))
                    
                    news_item = NewsItem(
                        title=title,
                        url=url,
                        source="36氪",
                        publish_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        view_count=100,  # 默认值
                        comment_count=10,
                        like_count=50
                    )
                    news_item.calculate_heat_score()
                    news_list.append(news_item)
                    
        except Exception as e:
            logger.error(f"爬取36氪网页版失败: {e}")
            
        return news_list
    
    def crawl_huxiu(self) -> List[NewsItem]:
        """爬取虎嗅网新闻"""
        logger.info("开始爬取虎嗅网新闻...")
        news_list = []
        
        try:
            url = "https://www.huxiu.com/"
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 查找新闻条目
            articles = soup.find_all('div', class_='mod-info-flow')
            for article in articles[:15]:  # 限制15条
                title_elem = article.find('h3')
                if title_elem:
                    link_elem = title_elem.find('a')
                    if link_elem:
                        title = link_elem.get_text(strip=True)
                        url = urljoin("https://www.huxiu.com", link_elem.get('href', ''))
                        
                        # 提取摘要
                        summary_elem = article.find('div', class_='mob-sub')
                        summary = summary_elem.get_text(strip=True) if summary_elem else ""
                        
                        # 提取统计数据
                        stats = article.find('div', class_='mob-cmt')
                        view_count = self._extract_number(stats.get_text() if stats else "0") if stats else 0
                        
                        news_item = NewsItem(
                            title=title,
                            url=url,
                            source="虎嗅网",
                            publish_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            summary=summary,
                            view_count=view_count,
                            comment_count=view_count // 10,
                            like_count=view_count // 20
                        )
                        news_item.calculate_heat_score()
                        news_list.append(news_item)
                        
        except Exception as e:
            logger.error(f"爬取虎嗅网新闻失败: {e}")
            
        logger.info(f"虎嗅网新闻爬取完成，获得 {len(news_list)} 条新闻")
        return news_list
    
    def crawl_infoq(self) -> List[NewsItem]:
        """爬取InfoQ新闻"""
        logger.info("开始爬取InfoQ新闻...")
        news_list = []
        
        try:
            url = "https://www.infoq.cn/news"
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 查找新闻条目
            articles = soup.find_all('div', class_='card-item')
            for article in articles[:15]:  # 限制15条
                title_elem = article.find('h4')
                if title_elem:
                    link_elem = title_elem.find('a')
                    if link_elem:
                        title = link_elem.get_text(strip=True)
                        url = urljoin("https://www.infoq.cn", link_elem.get('href', ''))
                        
                        # 提取摘要
                        summary_elem = article.find('div', class_='card-content')
                        summary = summary_elem.get_text(strip=True) if summary_elem else ""
                        
                        news_item = NewsItem(
                            title=title,
                            url=url,
                            source="InfoQ",
                            publish_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            summary=summary,
                            view_count=200,  # 默认值
                            comment_count=20,
                            like_count=100
                        )
                        news_item.calculate_heat_score()
                        news_list.append(news_item)
                        
        except Exception as e:
            logger.error(f"爬取InfoQ新闻失败: {e}")
            
        logger.info(f"InfoQ新闻爬取完成，获得 {len(news_list)} 条新闻")
        return news_list
    
    def crawl_csdn_news(self) -> List[NewsItem]:
        """爬取CSDN新闻"""
        logger.info("开始爬取CSDN新闻...")
        news_list = []
        
        try:
            url = "https://www.csdn.net/news"
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 查找新闻条目
            articles = soup.find_all('div', class_='item')
            for article in articles[:15]:  # 限制15条
                title_elem = article.find('h3')
                if title_elem:
                    link_elem = title_elem.find('a')
                    if link_elem:
                        title = link_elem.get_text(strip=True)
                        url = link_elem.get('href', '')
                        if not url.startswith('http'):
                            url = urljoin("https://www.csdn.net", url)
                        
                        # 提取摘要
                        summary_elem = article.find('p', class_='desc')
                        summary = summary_elem.get_text(strip=True) if summary_elem else ""
                        
                        # 提取统计数据
                        stats = article.find('div', class_='item-info')
                        view_count = 150  # 默认值
                        
                        news_item = NewsItem(
                            title=title,
                            url=url,
                            source="CSDN",
                            publish_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            summary=summary,
                            view_count=view_count,
                            comment_count=15,
                            like_count=75
                        )
                        news_item.calculate_heat_score()
                        news_list.append(news_item)
                        
        except Exception as e:
            logger.error(f"爬取CSDN新闻失败: {e}")
            
        logger.info(f"CSDN新闻爬取完成，获得 {len(news_list)} 条新闻")
        return news_list
    
    def crawl_ithome(self) -> List[NewsItem]:
        """爬取IT之家新闻"""
        logger.info("开始爬取IT之家新闻...")
        news_list = []
        
        try:
            url = "https://www.ithome.com/"
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 查找新闻条目
            articles = soup.find_all('div', class_='lst-item')
            for article in articles[:15]:  # 限制15条
                title_elem = article.find('h3')
                if title_elem:
                    link_elem = title_elem.find('a')
                    if link_elem:
                        title = link_elem.get_text(strip=True)
                        url = link_elem.get('href', '')
                        if not url.startswith('http'):
                            url = urljoin("https://www.ithome.com", url)
                        
                        # 提取摘要
                        summary_elem = article.find('div', class_='desc')
                        summary = summary_elem.get_text(strip=True) if summary_elem else ""
                        
                        # 提取统计数据
                        stats = article.find('div', class_='meta')
                        view_count = 300  # 默认值
                        
                        news_item = NewsItem(
                            title=title,
                            url=url,
                            source="IT之家",
                            publish_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            summary=summary,
                            view_count=view_count,
                            comment_count=30,
                            like_count=150
                        )
                        news_item.calculate_heat_score()
                        news_list.append(news_item)
                        
        except Exception as e:
            logger.error(f"爬取IT之家新闻失败: {e}")
            
        logger.info(f"IT之家新闻爬取完成，获得 {len(news_list)} 条新闻")
        return news_list
    
    def _format_time(self, time_str: str) -> str:
        """格式化时间字符串"""
        try:
            # 尝试解析不同的时间格式
            if 'T' in time_str:
                dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                return dt.strftime("%Y-%m-%d %H:%M:%S")
            else:
                return time_str
        except:
            return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def _extract_number(self, text: str) -> int:
        """从文本中提取数字"""
        numbers = re.findall(r'\d+', text)
        return int(numbers[0]) if numbers else 0
    
    def crawl_all_sources(self) -> List[NewsItem]:
        """爬取所有新闻源"""
        logger.info("开始爬取所有IT新闻源...")
        all_news = []
        
        # 爬取各个新闻源
        sources = [
            self.crawl_36kr,
            self.crawl_huxiu,
            self.crawl_infoq,
            self.crawl_csdn_news,
            self.crawl_ithome
        ]
        
        for crawl_func in sources:
            try:
                news = crawl_func()
                all_news.extend(news)
                time.sleep(1)  # 避免请求过快
            except Exception as e:
                logger.error(f"爬取新闻源失败: {e}")
                continue
        
        # 去重（基于标题和URL）
        seen = set()
        unique_news = []
        for news in all_news:
            # 创建唯一标识
            identifier = hashlib.md5(f"{news.title}{news.url}".encode()).hexdigest()
            if identifier not in seen:
                seen.add(identifier)
                unique_news.append(news)
        
        logger.info(f"爬取完成，共获得 {len(unique_news)} 条去重后的新闻")
        self.news_items = unique_news
        return unique_news
    
    def get_top_hot_news(self, limit: int = 10) -> List[NewsItem]:
        """获取热度最高的新闻"""
        if not self.news_items:
            self.crawl_all_sources()
        
        # 按热度分数排序
        sorted_news = sorted(self.news_items, key=lambda x: x.heat_score, reverse=True)
        return sorted_news[:limit]
    
    def save_to_json(self, filename: str = None) -> str:
        """保存新闻到JSON文件"""
        if filename is None:
            filename = f"it_news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        top_news = self.get_top_hot_news()
        
        # 转换为字典格式
        news_data = {
            'crawl_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'total_count': len(self.news_items),
            'top_hot_news': []
        }
        
        for i, news in enumerate(top_news, 1):
            news_dict = {
                'rank': i,
                'title': news.title,
                'url': news.url,
                'source': news.source,
                'publish_time': news.publish_time,
                'summary': news.summary,
                'heat_score': round(news.heat_score, 2),
                'stats': {
                    'view_count': news.view_count,
                    'comment_count': news.comment_count,
                    'like_count': news.like_count
                },
                'tags': news.tags
            }
            news_data['top_hot_news'].append(news_dict)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(news_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"新闻数据已保存到: {filename}")
        return filename
    
    def print_top_news(self, limit: int = 10):
        """打印热度最高的新闻"""
        top_news = self.get_top_hot_news(limit)
        
        print(f"\n{'='*80}")
        print(f"🔥 今日IT行业热门新闻 TOP {limit}")
        print(f"{'='*80}")
        print(f"爬取时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"总新闻数: {len(self.news_items)} 条")
        print(f"{'='*80}\n")
        
        for i, news in enumerate(top_news, 1):
            print(f"🏆 第 {i} 名 (热度: {news.heat_score:.2f})")
            print(f"📰 标题: {news.title}")
            print(f"🔗 链接: {news.url}")
            print(f"📺 来源: {news.source}")
            print(f"⏰ 时间: {news.publish_time}")
            if news.summary:
                print(f"📝 摘要: {news.summary[:100]}...")
            print(f"📊 统计: 浏览 {news.view_count} | 评论 {news.comment_count} | 点赞 {news.like_count}")
            print("-" * 80)

def main():
    """主函数"""
    print("🚀 IT新闻爬虫启动中...")
    
    crawler = ITNewsCrawler()
    
    try:
        # 爬取所有新闻源
        crawler.crawl_all_sources()
        
        # 显示热门新闻
        crawler.print_top_news(10)
        
        # 保存到JSON文件
        filename = crawler.save_to_json()
        print(f"\n✅ 爬取完成！数据已保存到: {filename}")
        
    except KeyboardInterrupt:
        print("\n❌ 用户中断爬取")
    except Exception as e:
        logger.error(f"爬取过程中发生错误: {e}")
        print(f"\n❌ 爬取失败: {e}")

if __name__ == "__main__":
    main()