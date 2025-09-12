#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Repository Scraper
爬取GitHub指定仓库的详细信息
"""

import requests
import json
import csv
import time
import argparse
from datetime import datetime
from urllib.parse import urljoin
import os


class GitHubScraper:
    def __init__(self, token=None):
        """
        初始化GitHub爬虫
        
        Args:
            token (str): GitHub Personal Access Token (可选，有token可以避免频率限制)
        """
        self.session = requests.Session()
        self.base_url = "https://api.github.com"
        
        if token:
            self.session.headers.update({
                'Authorization': f'token {token}',
                'Accept': 'application/vnd.github.v3+json'
            })
        
        # 设置User-Agent避免被限制
        self.session.headers.update({
            'User-Agent': 'GitHub-Repository-Scraper/1.0'
        })
    
    def get_repo_info(self, owner, repo):
        """
        获取仓库基本信息
        
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            
        Returns:
            dict: 仓库信息字典
        """
        url = f"{self.base_url}/repos/{owner}/{repo}"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"获取仓库信息失败: {e}")
            return None
    
    def get_repo_stats(self, owner, repo):
        """
        获取仓库统计信息（stars, forks, watchers等）
        
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            
        Returns:
            dict: 统计信息字典
        """
        # 获取基本统计
        repo_info = self.get_repo_info(owner, repo)
        if not repo_info:
            return None
        
        stats = {
            'stars': repo_info.get('stargazers_count', 0),
            'forks': repo_info.get('forks_count', 0),
            'watchers': repo_info.get('watchers_count', 0),
            'open_issues': repo_info.get('open_issues_count', 0),
            'size': repo_info.get('size', 0),
            'language': repo_info.get('language', 'Unknown'),
            'created_at': repo_info.get('created_at', ''),
            'updated_at': repo_info.get('updated_at', ''),
            'pushed_at': repo_info.get('pushed_at', ''),
            'license': repo_info.get('license', {}).get('name', 'No License') if repo_info.get('license') else 'No License'
        }
        
        return stats
    
    def get_repo_languages(self, owner, repo):
        """
        获取仓库编程语言统计
        
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            
        Returns:
            dict: 语言统计字典
        """
        url = f"{self.base_url}/repos/{owner}/{repo}/languages"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"获取语言统计失败: {e}")
            return {}
    
    def get_repo_contributors(self, owner, repo, max_contributors=30):
        """
        获取仓库贡献者信息
        
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            max_contributors (int): 最大贡献者数量
            
        Returns:
            list: 贡献者信息列表
        """
        url = f"{self.base_url}/repos/{owner}/{repo}/contributors"
        params = {'per_page': min(max_contributors, 100)}
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            contributors = response.json()
            
            # 只保留基本信息
            contributor_list = []
            for contrib in contributors:
                contributor_list.append({
                    'username': contrib.get('login', ''),
                    'contributions': contrib.get('contributions', 0),
                    'avatar_url': contrib.get('avatar_url', '')
                })
            
            return contributor_list
        except requests.exceptions.RequestException as e:
            print(f"获取贡献者信息失败: {e}")
            return []
    
    def get_repo_releases(self, owner, repo, max_releases=10):
        """
        获取仓库发布版本信息
        
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            max_releases (int): 最大发布版本数量
            
        Returns:
            list: 发布版本信息列表
        """
        url = f"{self.base_url}/repos/{owner}/{repo}/releases"
        params = {'per_page': min(max_releases, 100)}
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            releases = response.json()
            
            release_list = []
            for release in releases:
                release_list.append({
                    'tag_name': release.get('tag_name', ''),
                    'name': release.get('name', ''),
                    'published_at': release.get('published_at', ''),
                    'prerelease': release.get('prerelease', False),
                    'draft': release.get('draft', False)
                })
            
            return release_list
        except requests.exceptions.RequestException as e:
            print(f"获取发布版本信息失败: {e}")
            return []
    
    def scrape_repository(self, owner, repo, include_contributors=True, include_releases=True):
        """
        完整爬取仓库信息
        
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            include_contributors (bool): 是否包含贡献者信息
            include_releases (bool): 是否包含发布版本信息
            
        Returns:
            dict: 完整的仓库信息
        """
        print(f"开始爬取仓库: {owner}/{repo}")
        
        # 获取基本信息
        repo_info = self.get_repo_info(owner, repo)
        if not repo_info:
            return None
        
        # 获取统计信息
        stats = self.get_repo_stats(owner, repo)
        
        # 获取语言统计
        languages = self.get_repo_languages(owner, repo)
        
        # 构建完整信息
        full_info = {
            'repository': {
                'name': repo_info.get('name', ''),
                'full_name': repo_info.get('full_name', ''),
                'description': repo_info.get('description', ''),
                'html_url': repo_info.get('html_url', ''),
                'clone_url': repo_info.get('clone_url', ''),
                'ssh_url': repo_info.get('ssh_url', ''),
                'homepage': repo_info.get('homepage', ''),
                'topics': repo_info.get('topics', []),
                'default_branch': repo_info.get('default_branch', ''),
                'private': repo_info.get('private', False),
                'fork': repo_info.get('fork', False),
                'archived': repo_info.get('archived', False)
            },
            'owner': {
                'login': repo_info.get('owner', {}).get('login', ''),
                'type': repo_info.get('owner', {}).get('type', ''),
                'avatar_url': repo_info.get('owner', {}).get('avatar_url', '')
            },
            'statistics': stats,
            'languages': languages,
            'scraped_at': datetime.now().isoformat()
        }
        
        # 获取贡献者信息
        if include_contributors:
            print("获取贡献者信息...")
            contributors = self.get_repo_contributors(owner, repo)
            full_info['contributors'] = contributors
            time.sleep(1)  # 避免请求过快
        
        # 获取发布版本信息
        if include_releases:
            print("获取发布版本信息...")
            releases = self.get_repo_releases(owner, repo)
            full_info['releases'] = releases
            time.sleep(1)  # 避免请求过快
        
        print(f"仓库 {owner}/{repo} 爬取完成!")
        return full_info
    
    def save_to_json(self, data, filename):
        """
        保存数据到JSON文件
        
        Args:
            data (dict): 要保存的数据
            filename (str): 文件名
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"数据已保存到: {filename}")
        except Exception as e:
            print(f"保存JSON文件失败: {e}")
    
    def save_to_csv(self, data, filename):
        """
        保存统计数据到CSV文件
        
        Args:
            data (dict): 要保存的数据
            filename (str): 文件名
        """
        try:
            # 准备CSV数据
            csv_data = {
                'repository': data['repository']['full_name'],
                'description': data['repository']['description'],
                'stars': data['statistics']['stars'],
                'forks': data['statistics']['forks'],
                'watchers': data['statistics']['watchers'],
                'open_issues': data['statistics']['open_issues'],
                'language': data['statistics']['language'],
                'license': data['statistics']['license'],
                'created_at': data['statistics']['created_at'],
                'updated_at': data['statistics']['updated_at'],
                'pushed_at': data['statistics']['pushed_at'],
                'topics': ', '.join(data['repository']['topics']),
                'homepage': data['repository']['homepage'],
                'scraped_at': data['scraped_at']
            }
            
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=csv_data.keys())
                writer.writeheader()
                writer.writerow(csv_data)
            print(f"CSV数据已保存到: {filename}")
        except Exception as e:
            print(f"保存CSV文件失败: {e}")


def main():
    parser = argparse.ArgumentParser(description='GitHub仓库信息爬虫')
    parser.add_argument('owner', help='仓库所有者用户名或组织名')
    parser.add_argument('repo', help='仓库名称')
    parser.add_argument('--token', help='GitHub Personal Access Token')
    parser.add_argument('--no-contributors', action='store_true', help='不获取贡献者信息')
    parser.add_argument('--no-releases', action='store_true', help='不获取发布版本信息')
    parser.add_argument('--output-dir', default='./output', help='输出目录 (默认: ./output)')
    parser.add_argument('--format', choices=['json', 'csv', 'both'], default='both', help='输出格式')
    
    args = parser.parse_args()
    
    # 创建输出目录
    os.makedirs(args.output_dir, exist_ok=True)
    
    # 创建爬虫实例
    scraper = GitHubScraper(token=args.token)
    
    # 爬取仓库信息
    data = scraper.scrape_repository(
        owner=args.owner,
        repo=args.repo,
        include_contributors=not args.no_contributors,
        include_releases=not args.no_releases
    )
    
    if data:
        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base_filename = f"{args.owner}_{args.repo}_{timestamp}"
        
        # 保存数据
        if args.format in ['json', 'both']:
            json_file = os.path.join(args.output_dir, f"{base_filename}.json")
            scraper.save_to_json(data, json_file)
        
        if args.format in ['csv', 'both']:
            csv_file = os.path.join(args.output_dir, f"{base_filename}.csv")
            scraper.save_to_csv(data, csv_file)
        
        # 显示基本信息
        print("\n=== 仓库基本信息 ===")
        print(f"仓库名: {data['repository']['full_name']}")
        print(f"描述: {data['repository']['description']}")
        print(f"⭐ Stars: {data['statistics']['stars']}")
        print(f"🍴 Forks: {data['statistics']['forks']}")
        print(f"👀 Watchers: {data['statistics']['watchers']}")
        print(f"🐛 Issues: {data['statistics']['open_issues']}")
        print(f"💻 主要语言: {data['statistics']['language']}")
        print(f"📄 许可证: {data['statistics']['license']}")
        print(f"📅 创建时间: {data['statistics']['created_at']}")
        print(f"🔄 更新时间: {data['statistics']['updated_at']}")
        
        if data.get('languages'):
            print(f"\n=== 编程语言统计 ===")
            total_bytes = sum(data['languages'].values())
            for lang, bytes_count in sorted(data['languages'].items(), key=lambda x: x[1], reverse=True):
                percentage = (bytes_count / total_bytes) * 100
                print(f"{lang}: {percentage:.1f}%")
        
        if data.get('contributors'):
            print(f"\n=== 主要贡献者 ===")
            for i, contrib in enumerate(data['contributors'][:10], 1):
                print(f"{i}. {contrib['username']}: {contrib['contributions']} 次提交")
        
        if data.get('releases'):
            print(f"\n=== 最新发布版本 ===")
            for release in data['releases'][:5]:
                status = "🔄 预发布" if release['prerelease'] else "✅ 正式版"
                print(f"{release['tag_name']} - {release['name']} {status}")
    else:
        print("爬取失败!")


if __name__ == "__main__":
    main()