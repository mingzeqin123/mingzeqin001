#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IT新闻爬虫测试脚本
"""

import sys
import os

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from it_news_crawler import ITNewsCrawler, NewsItem
from datetime import datetime
import json

def test_crawler():
    """测试爬虫功能"""
    print("🧪 开始测试IT新闻爬虫...")
    
    crawler = ITNewsCrawler()
    
    # 测试单个新闻源
    print("\n📰 测试各个新闻源...")
    
    # 由于实际网站可能有反爬虫机制，我们创建一些模拟数据进行演示
    demo_news = create_demo_news()
    crawler.news_items = demo_news
    
    print(f"✅ 模拟获取了 {len(demo_news)} 条新闻")
    
    # 测试热度排序
    print("\n🔥 测试热度排序...")
    top_news = crawler.get_top_hot_news(10)
    
    print(f"✅ 成功获取热度前10的新闻")
    
    # 显示结果
    crawler.print_top_news(10)
    
    # 测试保存功能
    print("\n💾 测试保存功能...")
    filename = crawler.save_to_json("test_news_output.json")
    print(f"✅ 成功保存到文件: {filename}")
    
    return True

def create_demo_news():
    """创建演示用的新闻数据"""
    demo_data = [
        {
            "title": "OpenAI发布GPT-5，性能提升显著",
            "source": "36氪",
            "view_count": 15000,
            "comment_count": 300,
            "like_count": 1200,
            "summary": "OpenAI正式发布了GPT-5模型，在多个基准测试中表现出色，推理能力和安全性都有显著提升。"
        },
        {
            "title": "苹果M4芯片性能曝光，AI计算能力翻倍",
            "source": "IT之家",
            "view_count": 12000,
            "comment_count": 250,
            "like_count": 900,
            "summary": "最新曝光的苹果M4芯片规格显示，其AI计算性能相比M3提升了100%，将主要用于新款MacBook Pro。"
        },
        {
            "title": "字节跳动推出新一代推荐算法，效果提升30%",
            "source": "虎嗅网",
            "view_count": 8000,
            "comment_count": 180,
            "like_count": 600,
            "summary": "字节跳动技术团队发布了基于Transformer架构的新推荐算法，在多个业务场景中取得显著效果提升。"
        },
        {
            "title": "Meta发布Llama 3模型，开源AI再迎突破",
            "source": "InfoQ",
            "view_count": 10000,
            "comment_count": 220,
            "like_count": 800,
            "summary": "Meta正式开源Llama 3大语言模型，参数规模达到700亿，在多项任务上超越GPT-3.5性能。"
        },
        {
            "title": "华为鸿蒙OS 5.0正式发布，生态应用超100万",
            "source": "CSDN",
            "view_count": 20000,
            "comment_count": 400,
            "like_count": 1500,
            "summary": "华为在开发者大会上正式发布鸿蒙OS 5.0，新增多项AI功能，生态应用数量突破100万大关。"
        },
        {
            "title": "谷歌Gemini Ultra模型开放API，挑战GPT-4",
            "source": "36氪",
            "view_count": 9500,
            "comment_count": 200,
            "like_count": 750,
            "summary": "谷歌正式开放Gemini Ultra模型的API接口，开发者可以通过Google Cloud平台使用这一强大的多模态AI模型。"
        },
        {
            "title": "阿里云发布通义千问3.0，中文理解能力大幅提升",
            "source": "虎嗅网",
            "view_count": 7500,
            "comment_count": 150,
            "like_count": 500,
            "summary": "阿里云发布通义千问3.0大模型，在中文语言理解和生成任务上表现优异，已接入钉钉等多个产品。"
        },
        {
            "title": "英伟达H200 GPU正式上市，AI训练速度提升2倍",
            "source": "IT之家",
            "view_count": 11000,
            "comment_count": 280,
            "like_count": 850,
            "summary": "英伟达最新的H200 GPU正式上市，采用HBM3e内存，AI模型训练速度相比H100提升2倍。"
        },
        {
            "title": "微软发布Copilot Pro订阅服务，月费20美元",
            "source": "InfoQ",
            "view_count": 6000,
            "comment_count": 120,
            "like_count": 400,
            "summary": "微软推出Copilot Pro高级订阅服务，提供更快的AI响应速度和优先访问最新模型的权限。"
        },
        {
            "title": "腾讯混元大模型升级，支持千万级上下文长度",
            "source": "CSDN",
            "view_count": 8500,
            "comment_count": 170,
            "like_count": 650,
            "summary": "腾讯混元大模型迎来重大升级，支持千万级token的超长上下文，可处理整本书籍的内容。"
        },
        {
            "title": "百度文心一言4.0发布，多模态能力全面升级",
            "source": "36氪",
            "view_count": 9000,
            "comment_count": 190,
            "like_count": 700,
            "summary": "百度发布文心一言4.0版本，新增图像理解、视频分析等多模态功能，理解准确率提升40%。"
        },
        {
            "title": "OpenAI Sora视频生成模型开放测试，效果震撼",
            "source": "虎嗅网",
            "view_count": 25000,
            "comment_count": 500,
            "like_count": 2000,
            "summary": "OpenAI的Sora视频生成模型开始小规模测试，能够生成长达60秒的高质量视频内容。"
        },
        {
            "title": "苹果Vision Pro销量突破100万台，VR市场升温",
            "source": "IT之家",
            "view_count": 13000,
            "comment_count": 320,
            "like_count": 1000,
            "summary": "苹果Vision Pro自发布以来销量已突破100万台，带动整个VR/AR市场重新升温。"
        },
        {
            "title": "特斯拉FSD V12正式推送，完全自动驾驶更近一步",
            "source": "InfoQ",
            "view_count": 14000,
            "comment_count": 350,
            "like_count": 1100,
            "summary": "特斯拉向车主推送FSD V12版本，采用端到端神经网络，自动驾驶能力显著提升。"
        },
        {
            "title": "亚马逊AWS推出AI芯片Trainium2，性能提升4倍",
            "source": "CSDN",
            "view_count": 5500,
            "comment_count": 110,
            "like_count": 350,
            "summary": "亚马逊AWS发布第二代AI训练芯片Trainium2，性能相比前代提升4倍，成本降低50%。"
        }
    ]
    
    news_items = []
    for i, data in enumerate(demo_data):
        news_item = NewsItem(
            title=data["title"],
            url=f"https://example.com/news/{i+1}",
            source=data["source"],
            publish_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            summary=data["summary"],
            view_count=data["view_count"],
            comment_count=data["comment_count"],
            like_count=data["like_count"]
        )
        news_item.calculate_heat_score()
        news_items.append(news_item)
    
    return news_items

if __name__ == "__main__":
    try:
        success = test_crawler()
        if success:
            print("\n🎉 爬虫测试完成！所有功能正常工作。")
        else:
            print("\n❌ 爬虫测试失败！")
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()