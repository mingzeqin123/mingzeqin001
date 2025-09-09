#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云模型使用情况统计工具使用示例
"""

import os
import sys
from datetime import datetime, timedelta
from baidu_cloud_model_stats import BaiduCloudAPIClient, ModelStatsReporter


def example_basic_usage():
    """基础使用示例"""
    print("=== 基础使用示例 ===")
    
    # 设置API密钥（实际使用时请从环境变量或配置文件读取）
    api_key = "your_api_key_here"
    secret_key = "your_secret_key_here"
    
    if api_key == "your_api_key_here":
        print("请先设置您的百度云API密钥")
        return
    
    try:
        # 创建API客户端
        client = BaiduCloudAPIClient(api_key, secret_key)
        
        # 获取单个模型的使用统计
        stats = client.get_model_usage_stats(
            model_name="ernie-bot",
            start_date="2024-01-01",
            end_date="2024-01-07"
        )
        
        print(f"模型: {stats.model_name}")
        print(f"总请求数: {stats.total_requests}")
        print(f"总Token数: {stats.total_tokens}")
        print(f"成功率: {(stats.success_requests/stats.total_requests*100):.1f}%" if stats.total_requests > 0 else "成功率: 0%")
        
    except Exception as e:
        print(f"错误: {e}")


def example_multiple_models():
    """多模型统计示例"""
    print("\n=== 多模型统计示例 ===")
    
    api_key = "your_api_key_here"
    secret_key = "your_secret_key_here"
    
    if api_key == "your_api_key_here":
        print("请先设置您的百度云API密钥")
        return
    
    try:
        client = BaiduCloudAPIClient(api_key, secret_key)
        reporter = ModelStatsReporter(client)
        
        # 统计多个模型
        model_names = ["ernie-bot", "ernie-bot-turbo", "ernie-bot-4"]
        
        # 生成汇总报告
        report = reporter.generate_summary_report(
            model_names=model_names,
            days=30  # 统计最近30天
        )
        
        print(report)
        
        # 保存报告到文件
        reporter.save_report_to_file(report, "monthly_model_stats.txt")
        
    except Exception as e:
        print(f"错误: {e}")


def example_detailed_logs():
    """详细日志查询示例"""
    print("\n=== 详细日志查询示例 ===")
    
    api_key = "your_api_key_here"
    secret_key = "your_secret_key_here"
    
    if api_key == "your_api_key_here":
        print("请先设置您的百度云API密钥")
        return
    
    try:
        client = BaiduCloudAPIClient(api_key, secret_key)
        
        # 获取详细使用日志
        logs = client.get_detailed_usage_logs(
            model_name="ernie-bot",
            start_date="2024-01-01",
            end_date="2024-01-07",
            limit=20
        )
        
        print(f"找到 {len(logs)} 条使用记录:")
        for i, log in enumerate(logs, 1):
            print(f"{i:2d}. 时间: {log.get('timestamp', 'N/A')}")
            print(f"    模型: {log.get('model', 'N/A')}")
            print(f"    Token: {log.get('tokens', 'N/A')}")
            print(f"    状态: {log.get('status', 'N/A')}")
            print()
        
    except Exception as e:
        print(f"错误: {e}")


def example_available_models():
    """获取可用模型列表示例"""
    print("\n=== 获取可用模型列表示例 ===")
    
    api_key = "your_api_key_here"
    secret_key = "your_secret_key_here"
    
    if api_key == "your_api_key_here":
        print("请先设置您的百度云API密钥")
        return
    
    try:
        client = BaiduCloudAPIClient(api_key, secret_key)
        
        # 获取可用模型列表
        models = client.get_available_models()
        
        print(f"找到 {len(models)} 个可用模型:")
        for i, model in enumerate(models, 1):
            print(f"{i:2d}. {model.get('name', 'N/A')}")
            print(f"    描述: {model.get('description', 'N/A')}")
            print(f"    状态: {model.get('status', 'N/A')}")
            print()
        
    except Exception as e:
        print(f"错误: {e}")


def example_custom_date_range():
    """自定义日期范围统计示例"""
    print("\n=== 自定义日期范围统计示例 ===")
    
    api_key = "your_api_key_here"
    secret_key = "your_secret_key_here"
    
    if api_key == "your_api_key_here":
        print("请先设置您的百度云API密钥")
        return
    
    try:
        client = BaiduCloudAPIClient(api_key, secret_key)
        
        # 自定义日期范围
        start_date = "2024-01-01"
        end_date = "2024-01-31"
        
        # 获取指定日期范围的统计
        stats = client.get_model_usage_stats(
            model_name="ernie-bot",
            start_date=start_date,
            end_date=end_date
        )
        
        print(f"统计时间范围: {start_date} 至 {end_date}")
        print(f"模型: {stats.model_name}")
        print(f"总请求数: {stats.total_requests:,}")
        print(f"总Token数: {stats.total_tokens:,}")
        print(f"平均每日请求数: {stats.total_requests/31:.1f}")
        print(f"平均每日Token数: {stats.total_tokens/31:.1f}")
        
    except Exception as e:
        print(f"错误: {e}")


def example_environment_variables():
    """使用环境变量配置示例"""
    print("\n=== 使用环境变量配置示例 ===")
    
    # 从环境变量读取配置
    api_key = os.getenv("BAIDU_API_KEY")
    secret_key = os.getenv("BAIDU_SECRET_KEY")
    
    if not api_key or not secret_key:
        print("请设置环境变量:")
        print("export BAIDU_API_KEY=your_api_key")
        print("export BAIDU_SECRET_KEY=your_secret_key")
        return
    
    try:
        client = BaiduCloudAPIClient(api_key, secret_key)
        reporter = ModelStatsReporter(client)
        
        # 生成报告
        report = reporter.generate_summary_report(days=7)
        print(report)
        
    except Exception as e:
        print(f"错误: {e}")


def main():
    """主函数 - 运行所有示例"""
    print("百度云模型使用情况统计工具 - 使用示例")
    print("=" * 50)
    
    # 运行各种示例
    example_basic_usage()
    example_multiple_models()
    example_detailed_logs()
    example_available_models()
    example_custom_date_range()
    example_environment_variables()
    
    print("\n" + "=" * 50)
    print("所有示例运行完成！")
    print("\n使用说明:")
    print("1. 设置您的百度云API密钥")
    print("2. 运行 python baidu_cloud_model_stats.py 获取统计报告")
    print("3. 查看生成的报告文件")


if __name__ == "__main__":
    main()