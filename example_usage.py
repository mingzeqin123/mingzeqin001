#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub爬虫使用示例
"""

from github_crawler import GitHubCrawler
import os

def example_single_repository():
    """示例1: 爬取单个仓库"""
    print("=== 示例1: 爬取单个仓库 ===")
    
    # 初始化爬虫（可选：传入GitHub Token）
    token = os.getenv('GITHUB_TOKEN')  # 从环境变量获取token
    crawler = GitHubCrawler(token)
    
    # 爬取仓库信息
    repo_info = crawler.crawl_repository('microsoft/vscode')
    
    if repo_info:
        print(f"仓库名称: {repo_info['name']}")
        print(f"描述: {repo_info['description']}")
        print(f"主要语言: {repo_info['language']}")
        print(f"星标数: {repo_info['stargazers_count']}")
        print(f"Fork数: {repo_info['forks_count']}")
        print(f"创建时间: {repo_info['created_at']}")

def example_multiple_repositories():
    """示例2: 批量爬取多个仓库"""
    print("\n=== 示例2: 批量爬取多个仓库 ===")
    
    crawler = GitHubCrawler()
    
    # 要爬取的仓库列表
    repo_list = [
        'microsoft/vscode',
        'facebook/react',
        'google/go',
        'https://github.com/python/cpython'
    ]
    
    # 批量爬取
    results = crawler.crawl_multiple_repositories(repo_list)
    
    print(f"\n成功爬取 {len(results)} 个仓库:")
    for repo in results:
        print(f"- {repo['full_name']}: {repo['stargazers_count']} stars")

def example_save_data():
    """示例3: 保存数据到文件"""
    print("\n=== 示例3: 保存数据到文件 ===")
    
    crawler = GitHubCrawler()
    
    # 爬取数据
    results = crawler.crawl_multiple_repositories([
        'microsoft/vscode',
        'facebook/react'
    ])
    
    # 保存为JSON格式
    crawler.save_to_json(results, 'example_repos.json')
    
    # 保存为CSV格式
    crawler.save_to_csv(results, 'example_repos.csv')

def example_basic_info_only():
    """示例4: 只获取基本信息"""
    print("\n=== 示例4: 只获取基本信息 ===")
    
    crawler = GitHubCrawler()
    
    # 只获取基本信息，不包含语言统计、贡献者等
    repo_info = crawler.crawl_repository('microsoft/vscode', include_extra=False)
    
    if repo_info:
        print(f"仓库: {repo_info['full_name']}")
        print(f"星标: {repo_info['stargazers_count']}")
        print("注意: 此次爬取不包含语言统计和贡献者信息")

def example_with_error_handling():
    """示例5: 错误处理"""
    print("\n=== 示例5: 错误处理 ===")
    
    crawler = GitHubCrawler()
    
    # 尝试爬取不存在的仓库
    invalid_repos = [
        'nonexistent/repository',
        'microsoft/vscode',  # 这个存在
        'another/nonexistent'
    ]
    
    for repo_url in invalid_repos:
        try:
            repo_info = crawler.crawl_repository(repo_url)
            if repo_info:
                print(f"✓ 成功: {repo_info['full_name']}")
            else:
                print(f"✗ 失败: {repo_url}")
        except Exception as e:
            print(f"✗ 错误 {repo_url}: {e}")

def example_analyze_languages():
    """示例6: 分析仓库编程语言"""
    print("\n=== 示例6: 分析仓库编程语言 ===")
    
    crawler = GitHubCrawler()
    
    repo_info = crawler.crawl_repository('microsoft/vscode')
    
    if repo_info and 'languages' in repo_info:
        languages = repo_info['languages']
        total_bytes = sum(languages.values())
        
        print(f"仓库 {repo_info['full_name']} 的语言统计:")
        for lang, bytes_count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
            percentage = (bytes_count / total_bytes) * 100
            print(f"  {lang}: {percentage:.1f}% ({bytes_count:,} bytes)")

def example_analyze_contributors():
    """示例7: 分析贡献者"""
    print("\n=== 示例7: 分析贡献者 ===")
    
    crawler = GitHubCrawler()
    
    repo_info = crawler.crawl_repository('microsoft/vscode')
    
    if repo_info and 'contributors' in repo_info:
        contributors = repo_info['contributors']
        
        print(f"仓库 {repo_info['full_name']} 的主要贡献者:")
        for i, contrib in enumerate(contributors[:5], 1):
            print(f"  {i}. {contrib['login']}: {contrib['contributions']} 次贡献")

if __name__ == "__main__":
    # 运行所有示例
    example_single_repository()
    example_multiple_repositories()
    example_save_data()
    example_basic_info_only()
    example_with_error_handling()
    example_analyze_languages()
    example_analyze_contributors()
    
    print("\n所有示例运行完成！")
    print("查看生成的文件: example_repos.json 和 example_repos.csv")