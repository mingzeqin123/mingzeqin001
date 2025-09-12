#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub仓库信息爬虫 - 简化版（使用标准库）
支持通过GitHub API获取仓库的详细信息
"""

import urllib.request
import urllib.parse
import urllib.error
import json
import time
import csv
from datetime import datetime
from typing import Dict, List, Optional
import argparse
import sys
import os
import re

class GitHubCrawler:
    """GitHub仓库信息爬虫类"""
    
    def __init__(self, token: Optional[str] = None):
        """
        初始化爬虫
        
        Args:
            token: GitHub Personal Access Token (可选，用于提高API限制)
        """
        self.base_url = "https://api.github.com"
        self.headers = {
            'User-Agent': 'GitHub-Repository-Crawler/1.0',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        # 如果提供了token，添加认证
        if token:
            self.headers['Authorization'] = f'token {token}'
            
        self.rate_limit_remaining = 60  # 默认未认证限制
        self.rate_limit_reset = time.time()
    
    def make_request(self, url: str, params: Dict = None) -> Dict:
        """
        发送HTTP请求
        
        Args:
            url: 请求URL
            params: 查询参数
            
        Returns:
            响应数据字典
        """
        if params:
            url += '?' + urllib.parse.urlencode(params)
        
        request = urllib.request.Request(url, headers=self.headers)
        
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                # 更新API限制信息
                if 'X-RateLimit-Remaining' in response.headers:
                    self.rate_limit_remaining = int(response.headers['X-RateLimit-Remaining'])
                    self.rate_limit_reset = int(response.headers['X-RateLimit-Reset'])
                
                data = response.read().decode('utf-8')
                return json.loads(data)
                
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise ValueError("仓库不存在")
            elif e.code == 403:
                raise ValueError("API限制或访问被拒绝")
            else:
                raise ValueError(f"HTTP错误: {e.code}")
        except urllib.error.URLError as e:
            raise ValueError(f"网络错误: {e}")
        except json.JSONDecodeError:
            raise ValueError("响应数据格式错误")
    
    def check_rate_limit(self) -> None:
        """检查API限制"""
        if self.rate_limit_remaining <= 1:
            wait_time = max(0, self.rate_limit_reset - time.time() + 1)
            if wait_time > 0:
                print(f"API限制达到，等待 {wait_time:.0f} 秒...")
                time.sleep(wait_time)
    
    def parse_repo_url(self, url: str) -> tuple:
        """
        解析GitHub仓库URL
        
        Args:
            url: GitHub仓库URL
            
        Returns:
            (owner, repo) 元组
        """
        patterns = [
            r'github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$',
            r'github\.com/([^/]+)/([^/]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1), match.group(2)
        
        raise ValueError(f"无法解析GitHub仓库URL: {url}")
    
    def get_repository_info(self, owner: str, repo: str) -> Dict:
        """
        获取仓库基本信息
        
        Args:
            owner: 仓库所有者
            repo: 仓库名称
            
        Returns:
            仓库信息字典
        """
        self.check_rate_limit()
        
        url = f"{self.base_url}/repos/{owner}/{repo}"
        data = self.make_request(url)
        
        # 提取关键信息
        repo_info = {
            'name': data.get('name'),
            'full_name': data.get('full_name'),
            'description': data.get('description'),
            'url': data.get('html_url'),
            'clone_url': data.get('clone_url'),
            'ssh_url': data.get('ssh_url'),
            'owner': {
                'login': data.get('owner', {}).get('login'),
                'type': data.get('owner', {}).get('type'),
                'avatar_url': data.get('owner', {}).get('avatar_url')
            },
            'language': data.get('language'),
            'size': data.get('size'),  # KB
            'stargazers_count': data.get('stargazers_count'),
            'watchers_count': data.get('watchers_count'),
            'forks_count': data.get('forks_count'),
            'open_issues_count': data.get('open_issues_count'),
            'default_branch': data.get('default_branch'),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at'),
            'pushed_at': data.get('pushed_at'),
            'is_private': data.get('private'),
            'is_fork': data.get('fork'),
            'is_archived': data.get('archived'),
            'license': data.get('license', {}).get('name') if data.get('license') else None,
            'topics': data.get('topics', []),
            'has_issues': data.get('has_issues'),
            'has_projects': data.get('has_projects'),
            'has_wiki': data.get('has_wiki'),
            'has_pages': data.get('has_pages'),
            'has_downloads': data.get('has_downloads'),
            'network_count': data.get('network_count'),
            'subscribers_count': data.get('subscribers_count')
        }
        
        return repo_info
    
    def get_repository_languages(self, owner: str, repo: str) -> Dict:
        """
        获取仓库编程语言统计
        
        Args:
            owner: 仓库所有者
            repo: 仓库名称
            
        Returns:
            语言统计字典
        """
        self.check_rate_limit()
        
        url = f"{self.base_url}/repos/{owner}/{repo}/languages"
        
        try:
            return self.make_request(url)
        except:
            return {}
    
    def get_repository_contributors(self, owner: str, repo: str, limit: int = 10) -> List[Dict]:
        """
        获取仓库贡献者信息
        
        Args:
            owner: 仓库所有者
            repo: 仓库名称
            limit: 返回贡献者数量限制
            
        Returns:
            贡献者列表
        """
        self.check_rate_limit()
        
        url = f"{self.base_url}/repos/{owner}/{repo}/contributors"
        params = {'per_page': limit}
        
        try:
            contributors = self.make_request(url, params)
            return [
                {
                    'login': contrib.get('login'),
                    'contributions': contrib.get('contributions'),
                    'avatar_url': contrib.get('avatar_url'),
                    'type': contrib.get('type')
                }
                for contrib in contributors
            ]
        except:
            return []
    
    def get_repository_releases(self, owner: str, repo: str, limit: int = 5) -> List[Dict]:
        """
        获取仓库发布版本信息
        
        Args:
            owner: 仓库所有者
            repo: 仓库名称
            limit: 返回版本数量限制
            
        Returns:
            发布版本列表
        """
        self.check_rate_limit()
        
        url = f"{self.base_url}/repos/{owner}/{repo}/releases"
        params = {'per_page': limit}
        
        try:
            releases = self.make_request(url, params)
            return [
                {
                    'tag_name': release.get('tag_name'),
                    'name': release.get('name'),
                    'published_at': release.get('published_at'),
                    'prerelease': release.get('prerelease'),
                    'draft': release.get('draft'),
                    'download_count': sum(
                        asset.get('download_count', 0) 
                        for asset in release.get('assets', [])
                    )
                }
                for release in releases
            ]
        except:
            return []
    
    def crawl_repository(self, repo_url: str, include_extra: bool = True) -> Dict:
        """
        爬取完整的仓库信息
        
        Args:
            repo_url: GitHub仓库URL或owner/repo格式
            include_extra: 是否包含额外信息（语言、贡献者、版本）
            
        Returns:
            完整的仓库信息字典
        """
        try:
            # 解析仓库URL
            if '/' in repo_url and 'github.com' not in repo_url:
                # 直接是 owner/repo 格式
                owner, repo = repo_url.split('/', 1)
            else:
                owner, repo = self.parse_repo_url(repo_url)
            
            print(f"正在爬取仓库: {owner}/{repo}")
            
            # 获取基本信息
            repo_info = self.get_repository_info(owner, repo)
            
            if include_extra:
                # 获取语言统计
                print("获取语言统计...")
                repo_info['languages'] = self.get_repository_languages(owner, repo)
                
                # 获取贡献者
                print("获取贡献者信息...")
                repo_info['contributors'] = self.get_repository_contributors(owner, repo)
                
                # 获取发布版本
                print("获取发布版本...")
                repo_info['releases'] = self.get_repository_releases(owner, repo)
            
            # 添加爬取时间
            repo_info['crawled_at'] = datetime.now().isoformat()
            
            print(f"✓ 成功爬取仓库: {owner}/{repo}")
            return repo_info
            
        except Exception as e:
            print(f"✗ 爬取失败: {e}")
            return {}
    
    def crawl_multiple_repositories(self, repo_list: List[str], include_extra: bool = True) -> List[Dict]:
        """
        批量爬取多个仓库
        
        Args:
            repo_list: 仓库URL或owner/repo列表
            include_extra: 是否包含额外信息
            
        Returns:
            仓库信息列表
        """
        results = []
        
        for i, repo_url in enumerate(repo_list, 1):
            print(f"\n[{i}/{len(repo_list)}] 处理仓库: {repo_url}")
            
            repo_info = self.crawl_repository(repo_url, include_extra)
            if repo_info:
                results.append(repo_info)
            
            # 添加延时避免过于频繁的请求
            if i < len(repo_list):
                time.sleep(1)
        
        return results
    
    def save_to_json(self, data: List[Dict], filename: str) -> None:
        """保存数据为JSON文件"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✓ 数据已保存到: {filename}")
    
    def save_to_csv(self, data: List[Dict], filename: str) -> None:
        """保存数据为CSV文件"""
        if not data:
            return
        
        # 扁平化数据结构
        flattened_data = []
        for repo in data:
            flat_repo = {}
            for key, value in repo.items():
                if isinstance(value, dict):
                    if key == 'owner':
                        flat_repo['owner_login'] = value.get('login')
                        flat_repo['owner_type'] = value.get('type')
                        flat_repo['owner_avatar_url'] = value.get('avatar_url')
                    elif key == 'languages':
                        # 将语言统计转换为字符串
                        flat_repo['languages'] = ', '.join(
                            f"{lang}({bytes_count})" 
                            for lang, bytes_count in value.items()
                        ) if value else ''
                elif isinstance(value, list):
                    if key == 'topics':
                        flat_repo['topics'] = ', '.join(value)
                    elif key == 'contributors':
                        flat_repo['top_contributors'] = ', '.join(
                            f"{c['login']}({c['contributions']})" 
                            for c in value[:5]
                        ) if value else ''
                    elif key == 'releases':
                        flat_repo['latest_release'] = value[0]['tag_name'] if value else ''
                        flat_repo['release_count'] = len(value)
                else:
                    flat_repo[key] = value
            
            flattened_data.append(flat_repo)
        
        # 写入CSV
        if flattened_data:
            fieldnames = flattened_data[0].keys()
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flattened_data)
            print(f"✓ 数据已保存到: {filename}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='GitHub仓库信息爬虫')
    parser.add_argument('repositories', nargs='+', 
                       help='GitHub仓库URL或owner/repo格式，支持多个')
    parser.add_argument('--token', '-t', 
                       help='GitHub Personal Access Token')
    parser.add_argument('--output', '-o', default='github_repos',
                       help='输出文件名前缀 (默认: github_repos)')
    parser.add_argument('--format', '-f', choices=['json', 'csv', 'both'], 
                       default='both', help='输出格式 (默认: both)')
    parser.add_argument('--no-extra', action='store_true',
                       help='不包含额外信息（语言、贡献者、版本）')
    
    args = parser.parse_args()
    
    # 从环境变量获取token
    token = args.token or os.getenv('GITHUB_TOKEN')
    
    # 初始化爬虫
    crawler = GitHubCrawler(token)
    
    # 爬取仓库信息
    include_extra = not args.no_extra
    results = crawler.crawl_multiple_repositories(args.repositories, include_extra)
    
    if not results:
        print("没有成功爬取到任何仓库信息")
        sys.exit(1)
    
    # 保存结果
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if args.format in ['json', 'both']:
        json_filename = f"{args.output}_{timestamp}.json"
        crawler.save_to_json(results, json_filename)
    
    if args.format in ['csv', 'both']:
        csv_filename = f"{args.output}_{timestamp}.csv"
        crawler.save_to_csv(results, csv_filename)
    
    print(f"\n✓ 成功爬取 {len(results)} 个仓库的信息")


if __name__ == "__main__":
    main()