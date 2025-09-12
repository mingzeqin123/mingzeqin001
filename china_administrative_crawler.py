#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中国行政区划信息爬虫
从国家统计局等权威网站获取全国各地行政区划信息
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import time
import random
import re
from urllib.parse import urljoin, urlparse
import logging
from typing import List, Dict, Optional
import os

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawler.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ChinaAdministrativeCrawler:
    """中国行政区划信息爬虫"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.base_urls = {
            'stats': 'http://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/',  # 国家统计局
            'mca': 'http://www.mca.gov.cn/article/sj/xzqh/',  # 民政部
        }
        self.administrative_data = []
        
    def get_page_content(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        """获取网页内容"""
        for attempt in range(retries):
            try:
                logger.info(f"正在访问: {url}")
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                # 尝试检测编码
                if response.encoding == 'ISO-8859-1':
                    response.encoding = 'utf-8'
                elif 'gbk' in response.headers.get('content-type', '').lower():
                    response.encoding = 'gbk'
                elif 'gb2312' in response.headers.get('content-type', '').lower():
                    response.encoding = 'gb2312'
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 随机延迟，避免被封
                time.sleep(random.uniform(1, 3))
                return soup
                
            except requests.RequestException as e:
                logger.warning(f"访问失败 (尝试 {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(2, 5))
                    
        logger.error(f"无法访问页面: {url}")
        return None
    
    def get_stats_latest_year(self) -> Optional[str]:
        """获取国家统计局最新年份的区划代码"""
        try:
            soup = self.get_page_content(self.base_urls['stats'])
            if not soup:
                return None
                
            # 查找最新年份的链接
            links = soup.find_all('a', href=True)
            years = []
            for link in links:
                href = link.get('href', '')
                # 匹配年份格式，如 2023/ 或 2023.html
                year_match = re.search(r'(20\d{2})', href)
                if year_match:
                    years.append(year_match.group(1))
                    
            if years:
                latest_year = max(years)
                logger.info(f"找到最新年份: {latest_year}")
                return latest_year
                
        except Exception as e:
            logger.error(f"获取最新年份失败: {e}")
            
        # 默认使用2023年
        return "2023"
    
    def crawl_stats_administrative_data(self) -> List[Dict]:
        """爬取国家统计局行政区划数据"""
        logger.info("开始爬取国家统计局行政区划数据...")
        
        # 获取最新年份
        latest_year = self.get_stats_latest_year()
        if not latest_year:
            logger.error("无法获取最新年份数据")
            return []
            
        # 构建URL
        year_url = f"{self.base_urls['stats']}{latest_year}/"
        
        # 获取省级数据
        provinces = self._get_provinces(year_url)
        
        all_data = []
        for province in provinces:
            logger.info(f"正在处理省份: {province['name']}")
            
            # 添加省级数据
            province_data = {
                'level': '省',
                'code': province['code'],
                'name': province['name'],
                'parent_code': '',
                'parent_name': '中华人民共和国',
                'full_path': province['name']
            }
            all_data.append(province_data)
            
            # 获取市级数据
            cities = self._get_cities(year_url, province)
            for city in cities:
                city_data = {
                    'level': '市',
                    'code': city['code'],
                    'name': city['name'],
                    'parent_code': province['code'],
                    'parent_name': province['name'],
                    'full_path': f"{province['name']}/{city['name']}"
                }
                all_data.append(city_data)
                
                # 获取区县数据
                counties = self._get_counties(year_url, city)
                for county in counties:
                    county_data = {
                        'level': '区县',
                        'code': county['code'],
                        'name': county['name'],
                        'parent_code': city['code'],
                        'parent_name': city['name'],
                        'full_path': f"{province['name']}/{city['name']}/{county['name']}"
                    }
                    all_data.append(county_data)
        
        return all_data
    
    def _get_provinces(self, base_url: str) -> List[Dict]:
        """获取省级行政区划"""
        soup = self.get_page_content(base_url)
        if not soup:
            return []
            
        provinces = []
        # 查找省级链接，通常在特定的表格或列表中
        province_links = soup.find_all('a', href=True)
        
        for link in province_links:
            href = link.get('href', '')
            text = link.get_text(strip=True)
            
            # 匹配省级区划代码格式 (通常是2位数字开头)
            if re.match(r'^\d{2}\.html$', href) and text:
                code = href.replace('.html', '').ljust(12, '0')  # 补齐到12位
                provinces.append({
                    'code': code,
                    'name': text,
                    'url': urljoin(base_url, href)
                })
                
        return provinces
    
    def _get_cities(self, base_url: str, province: Dict) -> List[Dict]:
        """获取市级行政区划"""
        soup = self.get_page_content(province['url'])
        if not soup:
            return []
            
        cities = []
        # 查找市级数据表格
        tables = soup.find_all('table', class_='citytable')
        if not tables:
            tables = soup.find_all('table')
            
        for table in tables:
            rows = table.find_all('tr')[1:]  # 跳过表头
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    code_cell = cells[0]
                    name_cell = cells[1]
                    
                    code_link = code_cell.find('a')
                    if code_link:
                        code = code_link.get_text(strip=True)
                        name = name_cell.get_text(strip=True)
                        city_url = urljoin(province['url'], code_link.get('href', ''))
                        
                        cities.append({
                            'code': code,
                            'name': name,
                            'url': city_url
                        })
                        
        return cities
    
    def _get_counties(self, base_url: str, city: Dict) -> List[Dict]:
        """获取区县级行政区划"""
        soup = self.get_page_content(city['url'])
        if not soup:
            return []
            
        counties = []
        # 查找区县级数据表格
        tables = soup.find_all('table', class_='countytable')
        if not tables:
            tables = soup.find_all('table')
            
        for table in tables:
            rows = table.find_all('tr')[1:]  # 跳过表头
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    code = cells[0].get_text(strip=True)
                    name = cells[1].get_text(strip=True)
                    
                    if code and name:
                        counties.append({
                            'code': code,
                            'name': name
                        })
                        
        return counties
    
    def crawl_alternative_source(self) -> List[Dict]:
        """备用数据源：使用预定义的行政区划数据"""
        logger.info("使用备用数据源...")
        
        # 这里可以添加一些基础的行政区划数据作为备用
        basic_data = [
            {'level': '省', 'code': '110000000000', 'name': '北京市', 'parent_code': '', 'parent_name': '中华人民共和国', 'full_path': '北京市'},
            {'level': '市', 'code': '110100000000', 'name': '北京市', 'parent_code': '110000000000', 'parent_name': '北京市', 'full_path': '北京市/北京市'},
            {'level': '区县', 'code': '110101000000', 'name': '东城区', 'parent_code': '110100000000', 'parent_name': '北京市', 'full_path': '北京市/北京市/东城区'},
            {'level': '区县', 'code': '110102000000', 'name': '西城区', 'parent_code': '110100000000', 'parent_name': '北京市', 'full_path': '北京市/北京市/西城区'},
            
            {'level': '省', 'code': '120000000000', 'name': '天津市', 'parent_code': '', 'parent_name': '中华人民共和国', 'full_path': '天津市'},
            {'level': '市', 'code': '120100000000', 'name': '天津市', 'parent_code': '120000000000', 'parent_name': '天津市', 'full_path': '天津市/天津市'},
            {'level': '区县', 'code': '120101000000', 'name': '和平区', 'parent_code': '120100000000', 'parent_name': '天津市', 'full_path': '天津市/天津市/和平区'},
            
            {'level': '省', 'code': '130000000000', 'name': '河北省', 'parent_code': '', 'parent_name': '中华人民共和国', 'full_path': '河北省'},
            {'level': '市', 'code': '130100000000', 'name': '石家庄市', 'parent_code': '130000000000', 'parent_name': '河北省', 'full_path': '河北省/石家庄市'},
            {'level': '区县', 'code': '130102000000', 'name': '长安区', 'parent_code': '130100000000', 'parent_name': '石家庄市', 'full_path': '河北省/石家庄市/长安区'},
            
            {'level': '省', 'code': '310000000000', 'name': '上海市', 'parent_code': '', 'parent_name': '中华人民共和国', 'full_path': '上海市'},
            {'level': '市', 'code': '310100000000', 'name': '上海市', 'parent_code': '310000000000', 'parent_name': '上海市', 'full_path': '上海市/上海市'},
            {'level': '区县', 'code': '310101000000', 'name': '黄浦区', 'parent_code': '310100000000', 'parent_name': '上海市', 'full_path': '上海市/上海市/黄浦区'},
            
            {'level': '省', 'code': '440000000000', 'name': '广东省', 'parent_code': '', 'parent_name': '中华人民共和国', 'full_path': '广东省'},
            {'level': '市', 'code': '440100000000', 'name': '广州市', 'parent_code': '440000000000', 'parent_name': '广东省', 'full_path': '广东省/广州市'},
            {'level': '区县', 'code': '440103000000', 'name': '荔湾区', 'parent_code': '440100000000', 'parent_name': '广州市', 'full_path': '广东省/广州市/荔湾区'},
            
            {'level': '市', 'code': '440300000000', 'name': '深圳市', 'parent_code': '440000000000', 'parent_name': '广东省', 'full_path': '广东省/深圳市'},
            {'level': '区县', 'code': '440303000000', 'name': '罗湖区', 'parent_code': '440300000000', 'parent_name': '深圳市', 'full_path': '广东省/深圳市/罗湖区'},
        ]
        
        return basic_data
    
    def save_to_json(self, data: List[Dict], filename: str = 'china_administrative_divisions.json'):
        """保存数据为JSON格式"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"数据已保存到 {filename}")
        except Exception as e:
            logger.error(f"保存JSON文件失败: {e}")
    
    def save_to_csv(self, data: List[Dict], filename: str = 'china_administrative_divisions.csv'):
        """保存数据为CSV格式"""
        try:
            if not data:
                logger.warning("没有数据可保存")
                return
                
            fieldnames = data[0].keys()
            with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            logger.info(f"数据已保存到 {filename}")
        except Exception as e:
            logger.error(f"保存CSV文件失败: {e}")
    
    def run(self):
        """运行爬虫"""
        logger.info("开始爬取中国行政区划信息...")
        
        # 首先尝试从国家统计局获取数据
        data = self.crawl_stats_administrative_data()
        
        # 如果主要数据源失败，使用备用数据源
        if not data:
            logger.warning("主要数据源获取失败，使用备用数据源")
            data = self.crawl_alternative_source()
        
        if data:
            logger.info(f"共获取到 {len(data)} 条行政区划记录")
            
            # 保存数据
            self.save_to_json(data)
            self.save_to_csv(data)
            
            # 统计信息
            level_counts = {}
            for item in data:
                level = item.get('level', '未知')
                level_counts[level] = level_counts.get(level, 0) + 1
            
            logger.info("数据统计:")
            for level, count in level_counts.items():
                logger.info(f"  {level}: {count} 条")
                
        else:
            logger.error("未能获取到任何数据")

def main():
    """主函数"""
    crawler = ChinaAdministrativeCrawler()
    crawler.run()

if __name__ == '__main__':
    main()