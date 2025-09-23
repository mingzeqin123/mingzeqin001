#!/usr/bin/env python3
"""
API代理Python客户端示例
展示如何使用Python通过代理服务器访问不同类型的API
"""

import requests
import json
import asyncio
import aiohttp
from typing import Dict, Any, Optional

class ApiProxyClient:
    """API代理客户端类"""
    
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        
    def set_auth_token(self, token: str):
        """设置认证token"""
        self.token = token
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def set_api_key(self, api_key: str):
        """设置API Key"""
        self.session.headers.update({"X-API-Key": api_key})
    
    def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_proxy_info(self) -> Dict[str, Any]:
        """获取代理信息"""
        response = self.session.get(f"{self.base_url}/api/info")
        return response.json()
    
    def http_api_request(self, method: str, path: str, data: Optional[Dict] = None, 
                        params: Optional[Dict] = None) -> Dict[str, Any]:
        """HTTP API请求"""
        url = f"{self.base_url}/api{path}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status_code": getattr(e.response, 'status_code', None)}
    
    def graphql_query(self, path: str, query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
        """GraphQL查询"""
        url = f"{self.base_url}/api{path}"
        
        payload = {
            "query": query,
            "variables": variables or {}
        }
        
        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status_code": getattr(e.response, 'status_code', None)}
    
    def grpc_call(self, path: str, method: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """gRPC调用"""
        url = f"{self.base_url}/api{path}/{method}"
        
        try:
            response = self.session.post(url, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status_code": getattr(e.response, 'status_code', None)}


class AsyncApiProxyClient:
    """异步API代理客户端"""
    
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.headers = {}
    
    def set_auth_token(self, token: str):
        """设置认证token"""
        self.headers["Authorization"] = f"Bearer {token}"
    
    def set_api_key(self, api_key: str):
        """设置API Key"""
        self.headers["X-API-Key"] = api_key
    
    async def http_request(self, session: aiohttp.ClientSession, method: str, 
                          path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """异步HTTP请求"""
        url = f"{self.base_url}/api{path}"
        
        try:
            async with session.request(
                method=method,
                url=url,
                json=data,
                headers=self.headers
            ) as response:
                return await response.json()
        except Exception as e:
            return {"error": str(e)}
    
    async def batch_requests(self, requests: list) -> list:
        """批量异步请求"""
        async with aiohttp.ClientSession() as session:
            tasks = []
            for req in requests:
                task = self.http_request(session, req["method"], req["path"], req.get("data"))
                tasks.append(task)
            
            return await asyncio.gather(*tasks)


def demo_sync_client():
    """同步客户端演示"""
    print("=== 同步API代理客户端演示 ===")
    
    client = ApiProxyClient()
    
    # 健康检查
    print("\n1. 健康检查:")
    health = client.health_check()
    print(json.dumps(health, indent=2))
    
    # 获取代理信息
    print("\n2. 代理信息:")
    info = client.get_proxy_info()
    print(f"可用适配器数量: {info.get('data', {}).get('total', 0)}")
    
    # HTTP API示例
    print("\n3. HTTP API请求:")
    # GET请求
    result = client.http_api_request("GET", "/v1/rest/1")
    if "error" not in result:
        print(f"获取到文章: {result.get('title', 'N/A')}")
    else:
        print(f"请求失败: {result['error']}")
    
    # POST请求
    new_post = {
        "title": "通过Python代理客户端创建",
        "body": "这是通过Python API代理客户端创建的文章",
        "userId": 1
    }
    result = client.http_api_request("POST", "/v1/rest", data=new_post)
    if "error" not in result:
        print(f"创建文章成功, ID: {result.get('id', 'N/A')}")
    else:
        print(f"创建失败: {result['error']}")
    
    # GraphQL示例
    print("\n4. GraphQL查询:")
    query = """
    query {
        viewer {
            login
            name
        }
    }
    """
    # 注意: 需要有效的GitHub token
    # client.set_auth_token("your-github-token")
    result = client.graphql_query("/v1/graphql", query)
    print(f"GraphQL结果: {json.dumps(result, indent=2)}")
    
    # gRPC示例
    print("\n5. gRPC调用:")
    grpc_data = {
        "name": "Python客户端",
        "message": "Hello from Python!"
    }
    result = client.grpc_call("/v1/grpc", "SayHello", grpc_data)
    print(f"gRPC结果: {json.dumps(result, indent=2)}")


async def demo_async_client():
    """异步客户端演示"""
    print("\n=== 异步API代理客户端演示 ===")
    
    client = AsyncApiProxyClient()
    
    # 批量请求示例
    requests = [
        {"method": "GET", "path": "/v1/rest/1"},
        {"method": "GET", "path": "/v1/rest/2"},
        {"method": "GET", "path": "/v1/rest/3"},
    ]
    
    print("\n批量异步请求:")
    results = await client.batch_requests(requests)
    
    for i, result in enumerate(results, 1):
        if "error" not in result:
            print(f"请求 {i}: {result.get('title', 'N/A')}")
        else:
            print(f"请求 {i} 失败: {result['error']}")


def demo_error_handling():
    """错误处理演示"""
    print("\n=== 错误处理演示 ===")
    
    client = ApiProxyClient()
    
    # 访问不存在的端点
    result = client.http_api_request("GET", "/nonexistent")
    print(f"不存在的端点: {result}")
    
    # 无效的GraphQL查询
    invalid_query = "invalid graphql syntax"
    result = client.graphql_query("/v1/graphql", invalid_query)
    print(f"无效GraphQL查询: {result}")


def demo_authentication():
    """认证演示"""
    print("\n=== 认证演示 ===")
    
    client = ApiProxyClient()
    
    # API Key认证
    client.set_api_key("demo-api-key")
    result = client.http_api_request("GET", "/v1/rest/1")
    print(f"API Key认证结果: {'成功' if 'error' not in result else '失败'}")
    
    # JWT Token认证 (如果有的话)
    # client.set_auth_token("your-jwt-token")
    # result = client.http_api_request("GET", "/v1/protected")
    # print(f"JWT认证结果: {result}")


def demo_custom_headers():
    """自定义头部演示"""
    print("\n=== 自定义头部演示 ===")
    
    client = ApiProxyClient()
    
    # 添加自定义头部
    client.session.headers.update({
        "User-Agent": "Python-API-Proxy-Client/1.0.0",
        "Accept": "application/json",
        "Custom-Header": "custom-value"
    })
    
    result = client.http_api_request("GET", "/v1/rest/1")
    print(f"自定义头部请求: {'成功' if 'error' not in result else '失败'}")


if __name__ == "__main__":
    print("API代理Python客户端示例")
    print("=" * 50)
    
    # 检查代理服务器是否运行
    try:
        client = ApiProxyClient()
        health = client.health_check()
        if health.get("status") != "healthy":
            print("警告: 代理服务器状态不健康")
    except:
        print("错误: 无法连接到代理服务器")
        print("请确保API代理服务器在 http://localhost:3000 运行")
        exit(1)
    
    # 运行演示
    demo_sync_client()
    
    # 异步演示
    asyncio.run(demo_async_client())
    
    # 其他演示
    demo_error_handling()
    demo_authentication()
    demo_custom_headers()
    
    print("\n演示完成!")