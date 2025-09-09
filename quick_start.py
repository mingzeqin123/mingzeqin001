#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云模型使用情况统计工具 - 快速启动脚本
"""

import os
import sys
from datetime import datetime, timedelta

def check_dependencies():
    """检查依赖是否安装"""
    try:
        import requests
        print("✅ requests库已安装")
        return True
    except ImportError:
        print("❌ requests库未安装")
        print("请运行: pip install requests")
        return False

def check_api_keys():
    """检查API密钥是否设置"""
    api_key = os.getenv("BAIDU_API_KEY")
    secret_key = os.getenv("BAIDU_SECRET_KEY")
    
    if not api_key or not secret_key:
        print("❌ API密钥未设置")
        print("请设置环境变量:")
        print("export BAIDU_API_KEY=your_api_key")
        print("export BAIDU_SECRET_KEY=your_secret_key")
        return False
    else:
        print("✅ API密钥已设置")
        return True

def run_quick_stats():
    """运行快速统计"""
    try:
        from baidu_cloud_model_stats import BaiduCloudAPIClient, ModelStatsReporter
        
        print("\n正在获取模型使用统计...")
        
        # 创建客户端
        client = BaiduCloudAPIClient(
            os.getenv("BAIDU_API_KEY"),
            os.getenv("BAIDU_SECRET_KEY")
        )
        
        # 创建报告生成器
        reporter = ModelStatsReporter(client)
        
        # 生成最近7天的报告
        report = reporter.generate_summary_report(days=7)
        
        # 显示报告
        print("\n" + "="*60)
        print(report)
        
        # 保存报告
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"model_stats_{timestamp}.txt"
        reporter.save_report_to_file(report, filename)
        
        print(f"\n报告已保存到: {filename}")
        
    except Exception as e:
        print(f"❌ 运行出错: {e}")
        print("请检查:")
        print("1. API密钥是否正确")
        print("2. 网络连接是否正常")
        print("3. 是否有权限访问百度云API")

def main():
    """主函数"""
    print("百度云模型使用情况统计工具 - 快速启动")
    print("="*50)
    
    # 检查依赖
    if not check_dependencies():
        return
    
    # 检查API密钥
    if not check_api_keys():
        return
    
    # 运行统计
    run_quick_stats()

if __name__ == "__main__":
    main()