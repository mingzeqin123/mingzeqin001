#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云模型使用情况统计工具测试脚本
"""

import unittest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from baidu_cloud_model_stats import BaiduCloudAPIClient, ModelStatsReporter, ModelUsageStats


class TestBaiduCloudAPIClient(unittest.TestCase):
    """测试百度云API客户端"""
    
    def setUp(self):
        """测试前准备"""
        self.api_key = "test_api_key"
        self.secret_key = "test_secret_key"
        self.client = BaiduCloudAPIClient(self.api_key, self.secret_key)
    
    def test_init(self):
        """测试初始化"""
        self.assertEqual(self.client.api_key, self.api_key)
        self.assertEqual(self.client.secret_key, self.secret_key)
        self.assertEqual(self.client.base_url, "https://aip.baidubce.com")
        self.assertIsNone(self.client.access_token)
    
    @patch('requests.post')
    def test_get_access_token_success(self, mock_post):
        """测试成功获取访问令牌"""
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.json.return_value = {"access_token": "test_token"}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        token = self.client.get_access_token()
        
        self.assertEqual(token, "test_token")
        self.assertEqual(self.client.access_token, "test_token")
    
    @patch('requests.post')
    def test_get_access_token_failure(self, mock_post):
        """测试获取访问令牌失败"""
        # 模拟失败的API响应
        mock_response = Mock()
        mock_response.json.return_value = {"error": "invalid_client"}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            self.client.get_access_token()
        
        self.assertIn("获取访问令牌失败", str(context.exception))
    
    @patch('requests.get')
    def test_get_model_usage_stats_success(self, mock_get):
        """测试成功获取模型使用统计"""
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.json.return_value = {
            "result": {
                "total_requests": 1000,
                "total_tokens": 50000,
                "success_requests": 950,
                "failed_requests": 50,
                "avg_response_time": 1.2
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # 设置访问令牌
        self.client.access_token = "test_token"
        
        stats = self.client.get_model_usage_stats(
            model_name="ernie-bot",
            start_date="2024-01-01",
            end_date="2024-01-07"
        )
        
        self.assertIsInstance(stats, ModelUsageStats)
        self.assertEqual(stats.model_name, "ernie-bot")
        self.assertEqual(stats.total_requests, 1000)
        self.assertEqual(stats.total_tokens, 50000)
        self.assertEqual(stats.success_requests, 950)
        self.assertEqual(stats.failed_requests, 50)
        self.assertEqual(stats.avg_response_time, 1.2)
    
    @patch('requests.get')
    def test_get_available_models_success(self, mock_get):
        """测试成功获取可用模型列表"""
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.json.return_value = {
            "result": [
                {"name": "ernie-bot", "description": "文心一言基础版"},
                {"name": "ernie-bot-turbo", "description": "文心一言Turbo版"}
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # 设置访问令牌
        self.client.access_token = "test_token"
        
        models = self.client.get_available_models()
        
        self.assertEqual(len(models), 2)
        self.assertEqual(models[0]["name"], "ernie-bot")
        self.assertEqual(models[1]["name"], "ernie-bot-turbo")


class TestModelStatsReporter(unittest.TestCase):
    """测试模型统计报告生成器"""
    
    def setUp(self):
        """测试前准备"""
        self.mock_client = Mock()
        self.reporter = ModelStatsReporter(self.mock_client)
    
    def test_generate_summary_report(self):
        """测试生成汇总报告"""
        # 模拟客户端返回的统计数据
        mock_stats = ModelUsageStats(
            model_name="ernie-bot",
            total_requests=1000,
            total_tokens=50000,
            success_requests=950,
            failed_requests=50,
            avg_response_time=1.2,
            date_range="2024-01-01 至 2024-01-07"
        )
        
        self.mock_client.get_available_models.return_value = [
            {"name": "ernie-bot"}
        ]
        self.mock_client.get_model_usage_stats.return_value = mock_stats
        
        report = self.reporter.generate_summary_report(days=7)
        
        self.assertIn("百度云模型使用情况统计报告", report)
        self.assertIn("ernie-bot", report)
        self.assertIn("1,000", report)  # 格式化后的数字
        self.assertIn("50,000", report)
        self.assertIn("96.0%", report)  # 成功率


class TestModelUsageStats(unittest.TestCase):
    """测试模型使用统计数据结构"""
    
    def test_model_usage_stats_creation(self):
        """测试创建模型使用统计对象"""
        stats = ModelUsageStats(
            model_name="ernie-bot",
            total_requests=1000,
            total_tokens=50000,
            success_requests=950,
            failed_requests=50,
            avg_response_time=1.2,
            date_range="2024-01-01 至 2024-01-07"
        )
        
        self.assertEqual(stats.model_name, "ernie-bot")
        self.assertEqual(stats.total_requests, 1000)
        self.assertEqual(stats.total_tokens, 50000)
        self.assertEqual(stats.success_requests, 950)
        self.assertEqual(stats.failed_requests, 50)
        self.assertEqual(stats.avg_response_time, 1.2)
        self.assertEqual(stats.date_range, "2024-01-01 至 2024-01-07")


class TestIntegration(unittest.TestCase):
    """集成测试"""
    
    @patch('requests.post')
    @patch('requests.get')
    def test_full_workflow(self, mock_get, mock_post):
        """测试完整的工作流程"""
        # 模拟获取访问令牌
        mock_token_response = Mock()
        mock_token_response.json.return_value = {"access_token": "test_token"}
        mock_token_response.raise_for_status.return_value = None
        mock_post.return_value = mock_token_response
        
        # 模拟获取统计数据
        mock_stats_response = Mock()
        mock_stats_response.json.return_value = {
            "result": {
                "total_requests": 1000,
                "total_tokens": 50000,
                "success_requests": 950,
                "failed_requests": 50,
                "avg_response_time": 1.2
            }
        }
        mock_stats_response.raise_for_status.return_value = None
        mock_get.return_value = mock_stats_response
        
        # 创建客户端和报告生成器
        client = BaiduCloudAPIClient("test_key", "test_secret")
        reporter = ModelStatsReporter(client)
        
        # 获取统计数据
        stats = client.get_model_usage_stats("ernie-bot")
        
        # 验证结果
        self.assertEqual(stats.total_requests, 1000)
        self.assertEqual(stats.total_tokens, 50000)
        
        # 生成报告
        report = reporter.generate_summary_report(model_names=["ernie-bot"])
        self.assertIn("百度云模型使用情况统计报告", report)


def run_tests():
    """运行所有测试"""
    print("开始运行百度云模型统计工具测试...")
    
    # 创建测试套件
    test_suite = unittest.TestSuite()
    
    # 添加测试用例
    test_suite.addTest(unittest.makeSuite(TestBaiduCloudAPIClient))
    test_suite.addTest(unittest.makeSuite(TestModelStatsReporter))
    test_suite.addTest(unittest.makeSuite(TestModelUsageStats))
    test_suite.addTest(unittest.makeSuite(TestIntegration))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # 输出结果
    if result.wasSuccessful():
        print("\n✅ 所有测试通过！")
    else:
        print(f"\n❌ 测试失败: {len(result.failures)} 个失败, {len(result.errors)} 个错误")
        
        for failure in result.failures:
            print(f"失败: {failure[0]}")
            print(f"错误信息: {failure[1]}")
        
        for error in result.errors:
            print(f"错误: {error[0]}")
            print(f"错误信息: {error[1]}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    run_tests()