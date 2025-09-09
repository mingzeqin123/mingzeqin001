#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云千帆大模型使用情况统计工具 - 使用示例
Example usage of Baidu Cloud Qianfan Model Usage Statistics Tool
"""

from baidu_cloud_model_stats import BaiduCloudModelStats
from datetime import datetime, timedelta

def example_basic_usage():
    """基本使用示例"""
    print("=== 基本使用示例 ===")
    
    try:
        # 初始化统计工具
        stats_tool = BaiduCloudModelStats()
        
        # 获取最近7天的使用统计
        print("正在获取最近7天的使用统计...")
        stats = stats_tool.get_usage_statistics()
        
        # 显示格式化的统计信息
        formatted_output = stats_tool.format_statistics(stats)
        print(formatted_output)
        
        # 导出数据
        json_file = stats_tool.export_to_json(stats)
        print(f"数据已导出到JSON文件: {json_file}")
        
    except Exception as e:
        print(f"基本使用示例执行失败: {e}")

def example_specific_model():
    """特定模型查询示例"""
    print("\n=== 特定模型查询示例 ===")
    
    try:
        stats_tool = BaiduCloudModelStats()
        
        # 查询特定模型的使用情况
        model_name = "ERNIE-Bot-turbo"
        print(f"正在查询模型 {model_name} 的使用情况...")
        
        stats = stats_tool.get_usage_statistics(model_name=model_name)
        
        # 只显示关键信息
        result = stats.get('result', {})
        print(f"模型: {result.get('model_name')}")
        print(f"总请求数: {result.get('total_requests', 0):,}")
        print(f"成功率: {result.get('success_rate', 'N/A')}")
        print(f"总Token数: {result.get('total_tokens', 0):,}")
        
    except Exception as e:
        print(f"特定模型查询示例执行失败: {e}")

def example_date_range_query():
    """日期范围查询示例"""
    print("\n=== 日期范围查询示例 ===")
    
    try:
        stats_tool = BaiduCloudModelStats()
        
        # 查询上个月的数据
        end_date = datetime.now().replace(day=1) - timedelta(days=1)  # 上个月最后一天
        start_date = end_date.replace(day=1)  # 上个月第一天
        
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        
        print(f"正在查询 {start_str} 到 {end_str} 的数据...")
        
        stats = stats_tool.get_usage_statistics(
            start_date=start_str,
            end_date=end_str
        )
        
        result = stats.get('result', {})
        daily_stats = result.get('daily_stats', [])
        
        print(f"查询到 {len(daily_stats)} 天的数据")
        if daily_stats:
            total_requests = sum(day.get('requests', 0) for day in daily_stats)
            total_tokens = sum(day.get('tokens', 0) for day in daily_stats)
            print(f"总请求数: {total_requests:,}")
            print(f"总Token数: {total_tokens:,}")
        
    except Exception as e:
        print(f"日期范围查询示例执行失败: {e}")

def example_model_list():
    """模型列表查询示例"""
    print("\n=== 模型列表查询示例 ===")
    
    try:
        stats_tool = BaiduCloudModelStats()
        
        # 获取所有可用模型
        print("正在获取模型列表...")
        models = stats_tool.get_model_list()
        
        if models:
            print(f"找到 {len(models)} 个可用模型:")
            for i, model in enumerate(models[:10], 1):  # 只显示前10个
                name = model.get('name', 'N/A')
                description = model.get('description', 'N/A')
                print(f"  {i:2d}. {name:<20} - {description}")
            
            if len(models) > 10:
                print(f"  ... 还有 {len(models) - 10} 个模型")
        else:
            print("未找到可用模型或获取失败")
    
    except Exception as e:
        print(f"模型列表查询示例执行失败: {e}")

def example_export_data():
    """数据导出示例"""
    print("\n=== 数据导出示例 ===")
    
    try:
        stats_tool = BaiduCloudModelStats()
        
        # 获取统计数据
        stats = stats_tool.get_usage_statistics()
        
        # 导出为不同格式
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        json_file = stats_tool.export_to_json(stats, f"demo_stats_{timestamp}.json")
        csv_file = stats_tool.export_to_csv(stats, f"demo_stats_{timestamp}.csv")
        
        print("数据导出完成:")
        print(f"  JSON格式: {json_file}")
        print(f"  CSV格式: {csv_file}")
        
        # 读取并显示JSON文件的部分内容
        import json
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            result = data.get('result', {})
            print(f"\nJSON文件内容预览:")
            print(f"  模型名称: {result.get('model_name')}")
            print(f"  统计时间: {result.get('start_date')} 到 {result.get('end_date')}")
            print(f"  总请求数: {result.get('total_requests', 0):,}")
    
    except Exception as e:
        print(f"数据导出示例执行失败: {e}")

def example_error_analysis():
    """错误分析示例"""
    print("\n=== 错误分析示例 ===")
    
    try:
        stats_tool = BaiduCloudModelStats()
        
        # 获取统计数据
        stats = stats_tool.get_usage_statistics()
        result = stats.get('result', {})
        
        # 分析错误情况
        failed_requests = result.get('failed_requests', 0)
        total_requests = result.get('total_requests', 0)
        error_breakdown = result.get('error_breakdown', {})
        
        print(f"错误分析报告:")
        print(f"  总请求数: {total_requests:,}")
        print(f"  失败请求数: {failed_requests:,}")
        
        if total_requests > 0:
            error_rate = (failed_requests / total_requests) * 100
            print(f"  错误率: {error_rate:.2f}%")
        
        if error_breakdown:
            print(f"  错误类型分布:")
            for error_type, count in error_breakdown.items():
                if failed_requests > 0:
                    percentage = (count / failed_requests) * 100
                    print(f"    {error_type}: {count} ({percentage:.1f}%)")
                else:
                    print(f"    {error_type}: {count}")
    
    except Exception as e:
        print(f"错误分析示例执行失败: {e}")

def main():
    """主函数 - 运行所有示例"""
    print("百度云千帆大模型使用情况统计工具 - 使用示例")
    print("=" * 60)
    
    # 运行各种示例
    example_basic_usage()
    example_specific_model()
    example_date_range_query()
    example_model_list()
    example_export_data()
    example_error_analysis()
    
    print("\n" + "=" * 60)
    print("所有示例运行完成！")
    print("请查看生成的日志文件和导出文件。")

if __name__ == "__main__":
    main()