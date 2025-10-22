#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API客户端示例
演示如何调用评论分类API
"""

import requests
import json
import time
from typing import List, Dict, Optional

class CommentClassifierClient:
    """评论分类API客户端"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        """初始化客户端"""
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
    def health_check(self) -> Dict:
        """健康检查"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def classify_single(self, comment: str, user_id: Optional[str] = None) -> Dict:
        """分类单条评论"""
        try:
            data = {"comment": comment}
            if user_id:
                data["user_id"] = user_id
                
            response = self.session.post(
                f"{self.base_url}/classify",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def classify_batch(self, comments: List[str]) -> Dict:
        """批量分类评论"""
        try:
            data = {"comments": comments}
            response = self.session.post(
                f"{self.base_url}/classify/batch",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def get_categories(self) -> Dict:
        """获取分类类别"""
        try:
            response = self.session.get(f"{self.base_url}/categories")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

def demo_single_classification():
    """单条评论分类演示"""
    print("=" * 60)
    print("单条评论分类API演示")
    print("=" * 60)
    
    client = CommentClassifierClient()
    
    # 测试评论
    test_comments = [
        "这个产品真的很不错，推荐大家购买！",
        "哈哈哈哈哈哈哈哈哈哈",
        "微信：abc123，有需要的联系我",
        "你这个傻逼，滚蛋！",
        "111111111"
    ]
    
    for i, comment in enumerate(test_comments, 1):
        print(f"\n{i}. 分类评论: {comment}")
        print("-" * 40)
        
        result = client.classify_single(comment, f"user{i}")
        
        if "error" in result:
            print(f"错误: {result['error']}")
        else:
            data = result['data']
            print(f"分类: {data['category_name']}")
            print(f"置信度: {data['confidence']:.2f}")
            print(f"原因: {', '.join(data['reasons'])}")
            if data['keywords']:
                print(f"关键词: {', '.join(data['keywords'])}")

def demo_batch_classification():
    """批量评论分类演示"""
    print("=" * 60)
    print("批量评论分类API演示")
    print("=" * 60)
    
    client = CommentClassifierClient()
    
    # 测试评论批次
    test_comments = [
        "这个产品真的很不错，推荐大家购买！",
        "感谢分享，学到了很多东西。",
        "哈哈哈哈哈哈哈哈哈哈",
        "顶顶顶顶顶",
        "微信：abc123，有需要的联系我",
        "代购正品，价格优惠，欢迎咨询",
        "你这个傻逼，滚蛋！",
        "垃圾产品，骗钱的！",
        "111111111",
        "aaaaaaaaa"
    ]
    
    print(f"批量分类 {len(test_comments)} 条评论...")
    print("-" * 40)
    
    result = client.classify_batch(test_comments)
    
    if "error" in result:
        print(f"错误: {result['error']}")
        return
    
    data = result['data']
    results = data['results']
    statistics = data['statistics']
    
    # 显示分类结果
    print("分类结果:")
    for i, (comment, classification) in enumerate(zip(test_comments, results), 1):
        print(f"{i:2d}. {comment[:30]}... -> {classification['category_name']} ({classification['confidence']:.2f})")
    
    # 显示统计信息
    print(f"\n统计信息:")
    print(f"总评论数: {statistics['total_comments']}")
    for category, count in statistics['category_counts'].items():
        category_name = statistics['category_names'][category]
        percentage = statistics['category_percentages'][category]
        print(f"{category_name}: {count} 条 ({percentage:.1f}%)")

def demo_performance_test():
    """性能测试演示"""
    print("=" * 60)
    print("API性能测试演示")
    print("=" * 60)
    
    client = CommentClassifierClient()
    
    # 准备测试数据
    test_comment = "这是一条测试评论，用于性能测试。"
    batch_comments = [f"测试评论 {i}: 这是第{i}条评论" for i in range(1, 51)]  # 50条评论
    
    # 单条分类性能测试
    print("1. 单条分类性能测试 (50次调用)")
    start_time = time.time()
    
    for i in range(50):
        result = client.classify_single(f"{test_comment} {i}")
        if "error" in result:
            print(f"请求失败: {result['error']}")
            break
    
    single_time = time.time() - start_time
    print(f"单条分类总时间: {single_time:.2f}秒")
    print(f"单条分类平均时间: {single_time/50*1000:.2f}毫秒")
    
    # 批量分类性能测试
    print("\n2. 批量分类性能测试 (50条评论)")
    start_time = time.time()
    
    result = client.classify_batch(batch_comments)
    
    batch_time = time.time() - start_time
    
    if "error" not in result:
        print(f"批量分类总时间: {batch_time:.2f}秒")
        print(f"批量分类平均时间: {batch_time/50*1000:.2f}毫秒")
        
        # 性能对比
        if single_time > 0 and batch_time > 0:
            speedup = single_time / batch_time
            print(f"批量处理加速比: {speedup:.2f}x")
    else:
        print(f"批量分类失败: {result['error']}")

def demo_error_handling():
    """错误处理演示"""
    print("=" * 60)
    print("错误处理演示")
    print("=" * 60)
    
    client = CommentClassifierClient()
    
    # 测试各种错误情况
    error_tests = [
        {
            "name": "空评论",
            "action": lambda: client.classify_single("")
        },
        {
            "name": "缺少评论参数",
            "action": lambda: client.session.post(f"{client.base_url}/classify", json={})
        },
        {
            "name": "超大批次 (>100条)",
            "action": lambda: client.classify_batch([f"评论{i}" for i in range(150)])
        },
        {
            "name": "无效JSON",
            "action": lambda: client.session.post(
                f"{client.base_url}/classify",
                data="invalid json",
                headers={"Content-Type": "application/json"}
            )
        }
    ]
    
    for test in error_tests:
        print(f"\n测试: {test['name']}")
        print("-" * 30)
        
        try:
            result = test['action']()
            if hasattr(result, 'json'):
                result = result.json()
            
            if isinstance(result, dict) and "error" in result:
                print(f"预期错误: {result['error']}")
            else:
                print(f"意外成功: {result}")
                
        except Exception as e:
            print(f"异常: {str(e)}")

def interactive_demo():
    """交互式演示"""
    print("=" * 60)
    print("交互式评论分类演示")
    print("=" * 60)
    
    client = CommentClassifierClient()
    
    # 检查服务器连接
    health = client.health_check()
    if "error" in health:
        print(f"无法连接到服务器: {health['error']}")
        print("请确保API服务器正在运行 (python api_server.py)")
        return
    
    print("服务器连接正常！")
    print("输入评论进行分类，输入 'quit' 退出")
    
    while True:
        print("\n" + "-" * 40)
        comment = input("请输入评论: ").strip()
        
        if comment.lower() == 'quit':
            break
            
        if not comment:
            print("评论不能为空")
            continue
            
        result = client.classify_single(comment)
        
        if "error" in result:
            print(f"分类失败: {result['error']}")
        else:
            data = result['data']
            print(f"分类结果: {data['category_name']}")
            print(f"置信度: {data['confidence']:.2f}")
            print(f"原因: {', '.join(data['reasons'])}")
            if data['keywords']:
                print(f"关键词: {', '.join(data['keywords'])}")

def main():
    """主函数"""
    print("评论分类API客户端演示")
    
    while True:
        print("\n" + "=" * 60)
        print("请选择演示类型:")
        print("1. 单条评论分类演示")
        print("2. 批量评论分类演示") 
        print("3. 性能测试演示")
        print("4. 错误处理演示")
        print("5. 交互式演示")
        print("6. 运行所有演示")
        print("0. 退出")
        print("=" * 60)
        
        choice = input("请输入选择 (0-6): ").strip()
        
        if choice == '1':
            demo_single_classification()
        elif choice == '2':
            demo_batch_classification()
        elif choice == '3':
            demo_performance_test()
        elif choice == '4':
            demo_error_handling()
        elif choice == '5':
            interactive_demo()
        elif choice == '6':
            demo_single_classification()
            demo_batch_classification()
            demo_performance_test()
            demo_error_handling()
        elif choice == '0':
            print("退出演示程序")
            break
        else:
            print("无效选择，请重新输入")

if __name__ == "__main__":
    main()