#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub爬虫使用示例
"""

from github_scraper import GitHubScraper
import os

def main():
    """示例：爬取几个热门仓库的信息"""
    
    # 创建爬虫实例（可以传入GitHub Token）
    # scraper = GitHubScraper(token="your_github_token_here")
    scraper = GitHubScraper()  # 不使用Token，有频率限制
    
    # 要爬取的仓库列表
    repositories = [
        ("microsoft", "vscode"),
        ("facebook", "react"),
        ("torvalds", "linux"),
        ("microsoft", "TypeScript"),
        ("vuejs", "vue")
    ]
    
    # 创建输出目录
    output_dir = "./examples_output"
    os.makedirs(output_dir, exist_ok=True)
    
    print("开始批量爬取GitHub仓库信息...\n")
    
    for owner, repo in repositories:
        print(f"正在爬取: {owner}/{repo}")
        
        try:
            # 爬取仓库信息
            data = scraper.scrape_repository(
                owner=owner,
                repo=repo,
                include_contributors=False,  # 跳过贡献者信息以加快速度
                include_releases=False       # 跳过发布版本信息以加快速度
            )
            
            if data:
                # 保存JSON文件
                filename = f"{output_dir}/{owner}_{repo}.json"
                scraper.save_to_json(data, filename)
                
                # 显示基本信息
                stats = data['statistics']
                print(f"  ⭐ Stars: {stats['stars']}")
                print(f"  🍴 Forks: {stats['forks']}")
                print(f"  💻 语言: {stats['language']}")
                print(f"  📅 更新: {stats['updated_at'][:10]}")
                print()
            else:
                print(f"  ❌ 爬取失败\n")
                
        except Exception as e:
            print(f"  ❌ 错误: {e}\n")
        
        # 添加延迟避免频率限制
        import time
        time.sleep(2)
    
    print("批量爬取完成！")
    print(f"结果保存在: {output_dir}")


if __name__ == "__main__":
    main()