#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub爬虫演示脚本
"""

from github_crawler_simple import GitHubCrawler

def demo():
    """演示GitHub爬虫的基本功能"""
    print("=== GitHub仓库信息爬虫演示 ===\n")
    
    # 初始化爬虫
    crawler = GitHubCrawler()
    
    # 演示1: 爬取单个仓库
    print("1. 爬取单个仓库信息:")
    repo_info = crawler.crawl_repository('microsoft/vscode', include_extra=False)
    
    if repo_info:
        print(f"   仓库名称: {repo_info['name']}")
        print(f"   完整名称: {repo_info['full_name']}")
        print(f"   描述: {repo_info['description']}")
        print(f"   主要语言: {repo_info['language']}")
        print(f"   星标数: {repo_info['stargazers_count']:,}")
        print(f"   Fork数: {repo_info['forks_count']:,}")
        print(f"   创建时间: {repo_info['created_at']}")
        print(f"   许可证: {repo_info['license']}")
        print(f"   主题: {', '.join(repo_info['topics'])}")
    
    print("\n" + "="*50 + "\n")
    
    # 演示2: 爬取包含详细信息的仓库
    print("2. 爬取包含详细信息的仓库:")
    repo_info = crawler.crawl_repository('facebook/react')
    
    if repo_info:
        print(f"   仓库: {repo_info['full_name']}")
        print(f"   星标数: {repo_info['stargazers_count']:,}")
        
        # 显示编程语言统计
        if 'languages' in repo_info and repo_info['languages']:
            print("   编程语言统计:")
            languages = repo_info['languages']
            total_bytes = sum(languages.values())
            for lang, bytes_count in list(languages.items())[:3]:  # 显示前3种语言
                percentage = (bytes_count / total_bytes) * 100
                print(f"     {lang}: {percentage:.1f}%")
        
        # 显示主要贡献者
        if 'contributors' in repo_info and repo_info['contributors']:
            print("   主要贡献者:")
            for contrib in repo_info['contributors'][:3]:  # 显示前3个贡献者
                print(f"     {contrib['login']}: {contrib['contributions']} 次贡献")
        
        # 显示最新发布版本
        if 'releases' in repo_info and repo_info['releases']:
            latest_release = repo_info['releases'][0]
            print(f"   最新版本: {latest_release['tag_name']} ({latest_release['published_at'][:10]})")
    
    print("\n" + "="*50 + "\n")
    
    # 演示3: 批量爬取多个仓库
    print("3. 批量爬取多个仓库:")
    repo_list = ['microsoft/vscode', 'facebook/react', 'golang/go']
    results = crawler.crawl_multiple_repositories(repo_list, include_extra=False)
    
    print("   爬取结果汇总:")
    for repo in results:
        print(f"   - {repo['full_name']}: {repo['stargazers_count']:,} ⭐, {repo['forks_count']:,} 🍴, {repo['language']}")
    
    # 保存结果
    print("\n4. 保存结果到文件:")
    crawler.save_to_json(results, 'demo_results.json')
    crawler.save_to_csv(results, 'demo_results.csv')
    
    print("\n✅ 演示完成！")
    print("生成的文件: demo_results.json, demo_results.csv")

if __name__ == "__main__":
    demo()