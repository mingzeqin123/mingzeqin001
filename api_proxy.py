#!/usr/bin/env python3
"""
通用API代理程序
支持多种HTTP方法（GET、POST、PUT、DELETE等）的统一API访问
"""

import asyncio
import json
import logging
import time
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs
import aiohttp
from aiohttp import web, ClientSession, ClientTimeout
import yaml
import argparse
import os

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('proxy.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class APIProxy:
    """API代理服务器"""
    
    def __init__(self, config_file: str = "proxy_config.yaml"):
        self.config = self.load_config(config_file)
        self.session: Optional[ClientSession] = None
        self.app = web.Application()
        self.setup_routes()
        
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """加载配置文件"""
        default_config = {
            "server": {
                "host": "0.0.0.0",
                "port": 8080,
                "timeout": 30
            },
            "proxy": {
                "timeout": 30,
                "max_connections": 100,
                "max_keepalive_connections": 20,
                "keepalive_timeout": 30
            },
            "allowed_origins": ["*"],
            "rate_limiting": {
                "enabled": False,
                "requests_per_minute": 100
            }
        }
        
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = yaml.safe_load(f)
                    default_config.update(user_config)
            except Exception as e:
                logger.warning(f"无法加载配置文件 {config_file}: {e}")
        else:
            # 创建默认配置文件
            with open(config_file, 'w', encoding='utf-8') as f:
                yaml.dump(default_config, f, default_flow_style=False, allow_unicode=True)
            logger.info(f"已创建默认配置文件: {config_file}")
            
        return default_config
    
    def setup_routes(self):
        """设置路由"""
        # 健康检查
        self.app.router.add_get('/health', self.health_check)
        
        # 代理所有请求到 /proxy/{target_url}
        self.app.router.add_route('*', '/proxy/{target_url:.*}', self.proxy_request)
        
        # 简化的代理接口
        self.app.router.add_route('*', '/api/{target_url:.*}', self.simple_proxy)
        
        # 添加CORS支持
        self.app.middlewares.append(self.cors_middleware)
        
    async def cors_middleware(self, request, handler):
        """CORS中间件"""
        response = await handler(request)
        
        # 设置CORS头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Max-Age'] = '3600'
        
        return response
    
    async def health_check(self, request):
        """健康检查端点"""
        return web.json_response({
            "status": "healthy",
            "timestamp": time.time(),
            "version": "1.0.0"
        })
    
    async def proxy_request(self, request):
        """代理请求处理"""
        try:
            # 获取目标URL
            target_url = request.match_info['target_url']
            if not target_url.startswith('http'):
                target_url = f"http://{target_url}"
            
            # 解析查询参数
            parsed_url = urlparse(target_url)
            query_params = parse_qs(parsed_url.query)
            
            # 获取请求头（排除一些不需要的）
            headers = dict(request.headers)
            headers_to_remove = ['host', 'content-length', 'connection']
            for header in headers_to_remove:
                headers.pop(header, None)
            
            # 获取请求体
            body = None
            if request.can_read_body:
                body = await request.read()
            
            # 创建代理请求
            proxy_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
            if query_params:
                proxy_url += "?" + "&".join([f"{k}={v[0]}" for k, v in query_params.items()])
            
            logger.info(f"代理请求: {request.method} {proxy_url}")
            
            # 发送请求
            async with self.session.request(
                method=request.method,
                url=proxy_url,
                headers=headers,
                data=body,
                timeout=ClientTimeout(total=self.config['proxy']['timeout'])
            ) as response:
                
                # 读取响应
                response_body = await response.read()
                
                # 创建响应
                proxy_response = web.Response(
                    body=response_body,
                    status=response.status,
                    headers=dict(response.headers)
                )
                
                logger.info(f"代理响应: {response.status} {len(response_body)} bytes")
                return proxy_response
                
        except Exception as e:
            logger.error(f"代理请求失败: {e}")
            return web.json_response(
                {"error": f"代理请求失败: {str(e)}"},
                status=500
            )
    
    async def simple_proxy(self, request):
        """简化的代理接口"""
        try:
            # 从查询参数获取目标URL
            target_url = request.query.get('url')
            if not target_url:
                return web.json_response(
                    {"error": "缺少目标URL参数"},
                    status=400
                )
            
            # 获取请求头
            headers = dict(request.headers)
            headers.pop('host', None)
            
            # 获取请求体
            body = None
            if request.can_read_body:
                body = await request.read()
            
            logger.info(f"简单代理请求: {request.method} {target_url}")
            
            # 发送请求
            async with self.session.request(
                method=request.method,
                url=target_url,
                headers=headers,
                data=body,
                timeout=ClientTimeout(total=self.config['proxy']['timeout'])
            ) as response:
                
                # 读取响应
                response_body = await response.read()
                
                # 创建响应
                proxy_response = web.Response(
                    body=response_body,
                    status=response.status,
                    headers=dict(response.headers)
                )
                
                logger.info(f"简单代理响应: {response.status} {len(response_body)} bytes")
                return proxy_response
                
        except Exception as e:
            logger.error(f"简单代理请求失败: {e}")
            return web.json_response(
                {"error": f"代理请求失败: {str(e)}"},
                status=500
            )
    
    async def start_session(self):
        """启动HTTP会话"""
        connector = aiohttp.TCPConnector(
            limit=self.config['proxy']['max_connections'],
            limit_per_host=self.config['proxy']['max_keepalive_connections'],
            keepalive_timeout=self.config['proxy']['keepalive_timeout']
        )
        
        self.session = ClientSession(
            connector=connector,
            timeout=ClientTimeout(total=self.config['proxy']['timeout'])
        )
        logger.info("HTTP会话已启动")
    
    async def close_session(self):
        """关闭HTTP会话"""
        if self.session:
            await self.session.close()
            logger.info("HTTP会话已关闭")
    
    async def start_server(self):
        """启动服务器"""
        await self.start_session()
        
        runner = web.AppRunner(self.app)
        await runner.setup()
        
        site = web.TCPSite(
            runner,
            self.config['server']['host'],
            self.config['server']['port']
        )
        
        await site.start()
        logger.info(f"代理服务器已启动: http://{self.config['server']['host']}:{self.config['server']['port']}")
        
        return runner

async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='API代理服务器')
    parser.add_argument('--config', '-c', default='proxy_config.yaml', help='配置文件路径')
    parser.add_argument('--host', default='0.0.0.0', help='服务器主机')
    parser.add_argument('--port', type=int, default=8080, help='服务器端口')
    
    args = parser.parse_args()
    
    # 创建代理服务器
    proxy = APIProxy(args.config)
    
    # 更新配置
    proxy.config['server']['host'] = args.host
    proxy.config['server']['port'] = args.port
    
    try:
        # 启动服务器
        runner = await proxy.start_server()
        
        # 保持运行
        try:
            await asyncio.Future()  # 永远等待
        except KeyboardInterrupt:
            logger.info("收到停止信号")
        finally:
            await runner.cleanup()
            await proxy.close_session()
            
    except Exception as e:
        logger.error(f"服务器启动失败: {e}")
        await proxy.close_session()

if __name__ == "__main__":
    asyncio.run(main())