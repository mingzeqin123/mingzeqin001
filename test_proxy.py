#!/usr/bin/env python3
"""
API代理程序测试脚本
"""

import asyncio
import aiohttp
import json
import time

async def test_proxy():
    """测试代理服务器功能"""
    base_url = "http://localhost:8080"
    
    async with aiohttp.ClientSession() as session:
        print("开始测试API代理服务器...")
        
        # 测试1: 健康检查
        print("\n1. 测试健康检查...")
        try:
            async with session.get(f"{base_url}/health") as response:
                data = await response.json()
                print(f"健康检查: {data}")
        except Exception as e:
            print(f"健康检查失败: {e}")
        
        # 测试2: GET请求 - 路径代理模式
        print("\n2. 测试GET请求 (路径代理模式)...")
        try:
            async with session.get(f"{base_url}/proxy/http://httpbin.org/get") as response:
                data = await response.json()
                print(f"GET响应状态: {response.status}")
                print(f"GET响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"GET请求失败: {e}")
        
        # 测试3: POST请求 - 路径代理模式
        print("\n3. 测试POST请求 (路径代理模式)...")
        try:
            test_data = {"name": "测试用户", "email": "test@example.com", "timestamp": time.time()}
            async with session.post(
                f"{base_url}/proxy/http://httpbin.org/post",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                data = await response.json()
                print(f"POST响应状态: {response.status}")
                print(f"POST响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"POST请求失败: {e}")
        
        # 测试4: GET请求 - 查询参数代理模式
        print("\n4. 测试GET请求 (查询参数代理模式)...")
        try:
            async with session.get(f"{base_url}/api?url=http://httpbin.org/get") as response:
                data = await response.json()
                print(f"查询参数GET响应状态: {response.status}")
                print(f"查询参数GET响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"查询参数GET请求失败: {e}")
        
        # 测试5: PUT请求
        print("\n5. 测试PUT请求...")
        try:
            test_data = {"id": 123, "name": "更新用户", "email": "updated@example.com"}
            async with session.put(
                f"{base_url}/proxy/http://httpbin.org/put",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                data = await response.json()
                print(f"PUT响应状态: {response.status}")
                print(f"PUT响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"PUT请求失败: {e}")
        
        # 测试6: DELETE请求
        print("\n6. 测试DELETE请求...")
        try:
            async with session.delete(f"{base_url}/proxy/http://httpbin.org/delete") as response:
                data = await response.json()
                print(f"DELETE响应状态: {response.status}")
                print(f"DELETE响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"DELETE请求失败: {e}")
        
        # 测试7: 带查询参数的请求
        print("\n7. 测试带查询参数的请求...")
        try:
            async with session.get(f"{base_url}/proxy/http://httpbin.org/get?param1=value1&param2=value2") as response:
                data = await response.json()
                print(f"带查询参数GET响应状态: {response.status}")
                print(f"带查询参数GET响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"带查询参数GET请求失败: {e}")
        
        # 测试8: 错误处理
        print("\n8. 测试错误处理...")
        try:
            async with session.get(f"{base_url}/proxy/http://nonexistent-domain-12345.com") as response:
                print(f"错误请求响应状态: {response.status}")
                if response.status != 200:
                    text = await response.text()
                    print(f"错误响应内容: {text}")
        except Exception as e:
            print(f"错误处理测试: {e}")
        
        print("\n测试完成!")

if __name__ == "__main__":
    print("请确保代理服务器正在运行 (python api_proxy.py)")
    print("按回车键开始测试...")
    input()
    asyncio.run(test_proxy())