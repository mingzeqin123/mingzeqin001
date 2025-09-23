#!/usr/bin/env python3
"""
API代理客户端示例
演示如何使用代理服务器访问不同的API
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, Optional

class ProxyClient:
    """代理客户端"""
    
    def __init__(self, proxy_url: str = "http://localhost:8080"):
        self.proxy_url = proxy_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def request(self, method: str, target_url: str, **kwargs) -> Dict[str, Any]:
        """发送代理请求"""
        if not self.session:
            raise RuntimeError("请使用 async with 语句")
        
        # 使用路径代理模式
        proxy_endpoint = f"{self.proxy_url}/proxy/{target_url}"
        
        async with self.session.request(method, proxy_endpoint, **kwargs) as response:
            try:
                data = await response.json()
            except:
                data = await response.text()
            
            return {
                "status": response.status,
                "headers": dict(response.headers),
                "data": data
            }
    
    async def get(self, target_url: str, **kwargs) -> Dict[str, Any]:
        """GET请求"""
        return await self.request("GET", target_url, **kwargs)
    
    async def post(self, target_url: str, **kwargs) -> Dict[str, Any]:
        """POST请求"""
        return await self.request("POST", target_url, **kwargs)
    
    async def put(self, target_url: str, **kwargs) -> Dict[str, Any]:
        """PUT请求"""
        return await self.request("PUT", target_url, **kwargs)
    
    async def delete(self, target_url: str, **kwargs) -> Dict[str, Any]:
        """DELETE请求"""
        return await self.request("DELETE", target_url, **kwargs)

async def demo_usage():
    """演示用法"""
    print("API代理客户端使用示例")
    print("=" * 50)
    
    async with ProxyClient() as client:
        # 示例1: 访问JSONPlaceholder API
        print("\n1. 获取用户列表 (JSONPlaceholder)")
        try:
            result = await client.get("https://jsonplaceholder.typicode.com/users")
            print(f"状态码: {result['status']}")
            if result['status'] == 200:
                users = result['data']
                print(f"用户数量: {len(users)}")
                print(f"第一个用户: {users[0]['name']} ({users[0]['email']})")
        except Exception as e:
            print(f"请求失败: {e}")
        
        # 示例2: 创建新用户
        print("\n2. 创建新用户")
        try:
            new_user = {
                "name": "张三",
                "username": "zhangsan",
                "email": "zhangsan@example.com",
                "phone": "123-456-7890",
                "website": "zhangsan.com"
            }
            result = await client.post(
                "https://jsonplaceholder.typicode.com/users",
                json=new_user,
                headers={"Content-Type": "application/json"}
            )
            print(f"状态码: {result['status']}")
            if result['status'] in [200, 201]:
                print(f"创建的用户ID: {result['data']['id']}")
        except Exception as e:
            print(f"创建用户失败: {e}")
        
        # 示例3: 更新用户信息
        print("\n3. 更新用户信息")
        try:
            updated_user = {
                "name": "张三 (已更新)",
                "email": "zhangsan.updated@example.com"
            }
            result = await client.put(
                "https://jsonplaceholder.typicode.com/users/1",
                json=updated_user,
                headers={"Content-Type": "application/json"}
            )
            print(f"状态码: {result['status']}")
            if result['status'] == 200:
                print(f"更新成功: {result['data']['name']}")
        except Exception as e:
            print(f"更新用户失败: {e}")
        
        # 示例4: 获取特定用户的帖子
        print("\n4. 获取用户1的帖子")
        try:
            result = await client.get("https://jsonplaceholder.typicode.com/posts?userId=1")
            print(f"状态码: {result['status']}")
            if result['status'] == 200:
                posts = result['data']
                print(f"帖子数量: {len(posts)}")
                if posts:
                    print(f"第一篇帖子: {posts[0]['title']}")
        except Exception as e:
            print(f"获取帖子失败: {e}")
        
        # 示例5: 访问httpbin进行测试
        print("\n5. 测试httpbin API")
        try:
            result = await client.get("http://httpbin.org/json")
            print(f"状态码: {result['status']}")
            if result['status'] == 200:
                print(f"httpbin响应: {json.dumps(result['data'], indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"httpbin测试失败: {e}")

async def demo_batch_requests():
    """演示批量请求"""
    print("\n\n批量请求示例")
    print("=" * 50)
    
    async with ProxyClient() as client:
        # 并发请求多个API
        tasks = [
            client.get("https://jsonplaceholder.typicode.com/users/1"),
            client.get("https://jsonplaceholder.typicode.com/posts/1"),
            client.get("https://jsonplaceholder.typicode.com/comments/1"),
            client.get("http://httpbin.org/uuid"),
            client.get("http://httpbin.org/user-agent")
        ]
        
        print("发送5个并发请求...")
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results, 1):
            if isinstance(result, Exception):
                print(f"请求 {i} 失败: {result}")
            else:
                print(f"请求 {i} 成功: 状态码 {result['status']}")

if __name__ == "__main__":
    print("请确保代理服务器正在运行 (python api_proxy.py)")
    print("按回车键开始演示...")
    input()
    
    asyncio.run(demo_usage())
    asyncio.run(demo_batch_requests())