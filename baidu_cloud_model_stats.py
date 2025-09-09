#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云模型使用情况统计工具
支持统计文心一言、千帆大模型等百度云AI模型的使用情况
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os
from dataclasses import dataclass


@dataclass
class ModelUsageStats:
    """模型使用统计数据结构"""
    model_name: str
    total_requests: int
    total_tokens: int
    success_requests: int
    failed_requests: int
    avg_response_time: float
    date_range: str


class BaiduCloudAPIClient:
    """百度云API客户端"""
    
    def __init__(self, api_key: str, secret_key: str):
        """
        初始化百度云API客户端
        
        Args:
            api_key: 百度云API Key
            secret_key: 百度云Secret Key
        """
        self.api_key = api_key
        self.secret_key = secret_key
        self.access_token = None
        self.base_url = "https://aip.baidubce.com"
        
    def get_access_token(self) -> str:
        """
        获取访问令牌
        
        Returns:
            str: 访问令牌
        """
        url = f"{self.base_url}/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key
        }
        
        try:
            response = requests.post(url, params=params)
            response.raise_for_status()
            result = response.json()
            
            if "access_token" in result:
                self.access_token = result["access_token"]
                return self.access_token
            else:
                raise Exception(f"获取访问令牌失败: {result}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"网络请求失败: {e}")
    
    def get_model_usage_stats(self, 
                            model_name: str = "ernie-bot",
                            start_date: str = None,
                            end_date: str = None) -> ModelUsageStats:
        """
        获取模型使用统计
        
        Args:
            model_name: 模型名称，如 ernie-bot, ernie-bot-turbo 等
            start_date: 开始日期，格式：YYYY-MM-DD
            end_date: 结束日期，格式：YYYY-MM-DD
            
        Returns:
            ModelUsageStats: 模型使用统计信息
        """
        if not self.access_token:
            self.get_access_token()
        
        # 如果没有指定日期范围，默认查询最近7天
        if not start_date or not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        # 百度云千帆大模型平台的使用统计API
        url = f"{self.base_url}/rest/2.0/wenxin/v1/usage"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
        
        params = {
            "model": model_name,
            "start_date": start_date,
            "end_date": end_date
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            result = response.json()
            
            # 解析返回的统计数据
            if "result" in result:
                data = result["result"]
                return ModelUsageStats(
                    model_name=model_name,
                    total_requests=data.get("total_requests", 0),
                    total_tokens=data.get("total_tokens", 0),
                    success_requests=data.get("success_requests", 0),
                    failed_requests=data.get("failed_requests", 0),
                    avg_response_time=data.get("avg_response_time", 0.0),
                    date_range=f"{start_date} 至 {end_date}"
                )
            else:
                raise Exception(f"获取统计数据失败: {result}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"网络请求失败: {e}")
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        获取可用的模型列表
        
        Returns:
            List[Dict]: 可用模型列表
        """
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.base_url}/rest/2.0/wenxin/v1/models"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if "result" in result:
                return result["result"]
            else:
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"获取模型列表失败: {e}")
            return []
    
    def get_detailed_usage_logs(self, 
                              model_name: str = "ernie-bot",
                              start_date: str = None,
                              end_date: str = None,
                              limit: int = 100) -> List[Dict[str, Any]]:
        """
        获取详细的使用日志
        
        Args:
            model_name: 模型名称
            start_date: 开始日期
            end_date: 结束日期
            limit: 返回记录数限制
            
        Returns:
            List[Dict]: 详细使用日志
        """
        if not self.access_token:
            self.get_access_token()
        
        if not start_date or not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        url = f"{self.base_url}/rest/2.0/wenxin/v1/usage/logs"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
        
        params = {
            "model": model_name,
            "start_date": start_date,
            "end_date": end_date,
            "limit": limit
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            result = response.json()
            
            if "result" in result:
                return result["result"]
            else:
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"获取使用日志失败: {e}")
            return []


class ModelStatsReporter:
    """模型统计报告生成器"""
    
    def __init__(self, client: BaiduCloudAPIClient):
        self.client = client
    
    def generate_summary_report(self, 
                              model_names: List[str] = None,
                              days: int = 7) -> str:
        """
        生成汇总报告
        
        Args:
            model_names: 要统计的模型名称列表
            days: 统计天数
            
        Returns:
            str: 格式化的报告文本
        """
        if not model_names:
            # 获取可用模型
            available_models = self.client.get_available_models()
            model_names = [model.get("name", "ernie-bot") for model in available_models[:5]]  # 取前5个模型
        
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        report_lines = [
            "=" * 60,
            "百度云模型使用情况统计报告",
            "=" * 60,
            f"统计时间范围: {start_date} 至 {end_date}",
            f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
        ]
        
        total_requests = 0
        total_tokens = 0
        
        for model_name in model_names:
            try:
                stats = self.client.get_model_usage_stats(model_name, start_date, end_date)
                
                report_lines.extend([
                    f"模型名称: {stats.model_name}",
                    f"  总请求数: {stats.total_requests:,}",
                    f"  总Token数: {stats.total_tokens:,}",
                    f"  成功请求: {stats.success_requests:,}",
                    f"  失败请求: {stats.failed_requests:,}",
                    f"  平均响应时间: {stats.avg_response_time:.2f}ms",
                    f"  成功率: {(stats.success_requests/stats.total_requests*100):.1f}%" if stats.total_requests > 0 else "  成功率: 0%",
                    ""
                ])
                
                total_requests += stats.total_requests
                total_tokens += stats.total_tokens
                
            except Exception as e:
                report_lines.extend([
                    f"模型名称: {model_name}",
                    f"  错误: {str(e)}",
                    ""
                ])
        
        # 添加总计信息
        report_lines.extend([
            "-" * 40,
            "总计",
            "-" * 40,
            f"总请求数: {total_requests:,}",
            f"总Token数: {total_tokens:,}",
            "=" * 60
        ])
        
        return "\n".join(report_lines)
    
    def save_report_to_file(self, report: str, filename: str = None):
        """
        保存报告到文件
        
        Args:
            report: 报告内容
            filename: 文件名，如果不指定则自动生成
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"baidu_model_stats_report_{timestamp}.txt"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"报告已保存到: {filename}")


def main():
    """主函数"""
    # 从环境变量或配置文件读取API密钥
    api_key = os.getenv("BAIDU_API_KEY")
    secret_key = os.getenv("BAIDU_SECRET_KEY")
    
    if not api_key or not secret_key:
        print("请设置环境变量 BAIDU_API_KEY 和 BAIDU_SECRET_KEY")
        print("或者直接在代码中设置您的API密钥")
        return
    
    try:
        # 创建API客户端
        client = BaiduCloudAPIClient(api_key, secret_key)
        
        # 创建报告生成器
        reporter = ModelStatsReporter(client)
        
        # 生成报告
        print("正在生成模型使用情况统计报告...")
        report = reporter.generate_summary_report(days=7)
        
        # 打印报告
        print(report)
        
        # 保存报告到文件
        reporter.save_report_to_file(report)
        
        # 获取详细日志示例
        print("\n正在获取详细使用日志...")
        logs = client.get_detailed_usage_logs(limit=10)
        if logs:
            print(f"最近10条使用记录:")
            for i, log in enumerate(logs, 1):
                print(f"{i}. 时间: {log.get('timestamp', 'N/A')}, "
                      f"模型: {log.get('model', 'N/A')}, "
                      f"Token: {log.get('tokens', 'N/A')}")
        
    except Exception as e:
        print(f"程序执行出错: {e}")


if __name__ == "__main__":
    main()