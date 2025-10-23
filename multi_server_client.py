#!/usr/bin/env python3
"""
多服务器监控客户端
从多个服务器收集监控数据并聚合显示
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
import logging
from config import get_config

logger = logging.getLogger(__name__)


class MultiServerClient:
    """多服务器监控客户端"""
    
    def __init__(self):
        self.config = get_config()
        self.servers_data = {}  # 存储各服务器的数据
        self.servers_status = {}  # 存储各服务器的状态
        self.session = None
    
    async def __aenter__(self):
        """异步上下文管理器入口"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self.session:
            await self.session.close()
    
    async def fetch_server_metrics(self, server_id: str, server_config: Dict) -> Optional[Dict]:
        """获取单个服务器的指标数据"""
        try:
            url = f"http://{server_config['host']}:{server_config['port']}/api/metrics"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('success'):
                        # 添加服务器标识信息
                        metrics = data['data']
                        metrics['server_id'] = server_id
                        metrics['server_config'] = server_config
                        
                        # 更新服务器状态
                        self.servers_status[server_id] = {
                            'status': 'online',
                            'last_update': datetime.now().isoformat(),
                            'response_time': time.time(),
                            'error': None
                        }
                        
                        logger.info(f"成功获取服务器 {server_id} 的指标数据")
                        return metrics
                    else:
                        raise Exception(f"API返回错误: {data.get('error', 'Unknown error')}")
                else:
                    raise Exception(f"HTTP错误: {response.status}")
                    
        except asyncio.TimeoutError:
            error_msg = f"服务器 {server_id} 连接超时"
            logger.warning(error_msg)
            self.servers_status[server_id] = {
                'status': 'timeout',
                'last_update': datetime.now().isoformat(),
                'response_time': None,
                'error': error_msg
            }
        except Exception as e:
            error_msg = f"获取服务器 {server_id} 数据失败: {str(e)}"
            logger.error(error_msg)
            self.servers_status[server_id] = {
                'status': 'error',
                'last_update': datetime.now().isoformat(),
                'response_time': None,
                'error': error_msg
            }
        
        return None
    
    async def fetch_all_servers_metrics(self) -> Dict[str, Dict]:
        """获取所有启用服务器的指标数据"""
        enabled_servers = self.config.get_enabled_servers()
        
        if not enabled_servers:
            logger.warning("没有启用的服务器配置")
            return {}
        
        # 并发获取所有服务器数据
        tasks = []
        for server_id, server_config in enabled_servers.items():
            task = self.fetch_server_metrics(server_id, server_config)
            tasks.append((server_id, task))
        
        # 等待所有任务完成
        results = {}
        for server_id, task in tasks:
            try:
                metrics = await task
                if metrics:
                    results[server_id] = metrics
                    self.servers_data[server_id] = metrics
            except Exception as e:
                logger.error(f"处理服务器 {server_id} 数据时发生错误: {e}")
        
        return results
    
    def get_aggregated_metrics(self) -> Dict:
        """获取聚合的指标数据"""
        if not self.servers_data:
            return {
                'timestamp': datetime.now().isoformat(),
                'total_servers': 0,
                'online_servers': 0,
                'offline_servers': 0,
                'servers': {}
            }
        
        online_servers = len([s for s in self.servers_status.values() if s['status'] == 'online'])
        total_servers = len(self.servers_status)
        
        # 计算平均值
        cpu_values = []
        memory_values = []
        disk_values = []
        
        for server_data in self.servers_data.values():
            cpu_values.append(server_data['cpu']['usage_percent'])
            memory_values.append(server_data['memory']['usage_percent'])
            
            # 计算平均磁盘使用率
            if server_data['disk']:
                avg_disk = sum(disk['usage_percent'] for disk in server_data['disk']) / len(server_data['disk'])
                disk_values.append(avg_disk)
        
        avg_cpu = sum(cpu_values) / len(cpu_values) if cpu_values else 0
        avg_memory = sum(memory_values) / len(memory_values) if memory_values else 0
        avg_disk = sum(disk_values) / len(disk_values) if disk_values else 0
        
        return {
            'timestamp': datetime.now().isoformat(),
            'total_servers': total_servers,
            'online_servers': online_servers,
            'offline_servers': total_servers - online_servers,
            'average_metrics': {
                'cpu_percent': round(avg_cpu, 2),
                'memory_percent': round(avg_memory, 2),
                'disk_percent': round(avg_disk, 2)
            },
            'servers': self.servers_data,
            'servers_status': self.servers_status
        }
    
    def get_server_alerts(self) -> List[Dict]:
        """获取服务器告警信息"""
        alerts = []
        
        for server_id, server_data in self.servers_data.items():
            server_config = self.config.get_server(server_id)
            if not server_config:
                continue
            
            thresholds = server_config.get('thresholds', {})
            
            # 检查CPU告警
            cpu_percent = server_data['cpu']['usage_percent']
            if cpu_percent >= thresholds.get('cpu_critical', 90):
                alerts.append({
                    'server_id': server_id,
                    'server_name': server_config['name'],
                    'type': 'cpu',
                    'level': 'critical',
                    'message': f"CPU使用率过高: {cpu_percent}%",
                    'value': cpu_percent,
                    'threshold': thresholds.get('cpu_critical', 90),
                    'timestamp': datetime.now().isoformat()
                })
            elif cpu_percent >= thresholds.get('cpu_warning', 70):
                alerts.append({
                    'server_id': server_id,
                    'server_name': server_config['name'],
                    'type': 'cpu',
                    'level': 'warning',
                    'message': f"CPU使用率较高: {cpu_percent}%",
                    'value': cpu_percent,
                    'threshold': thresholds.get('cpu_warning', 70),
                    'timestamp': datetime.now().isoformat()
                })
            
            # 检查内存告警
            memory_percent = server_data['memory']['usage_percent']
            if memory_percent >= thresholds.get('memory_critical', 95):
                alerts.append({
                    'server_id': server_id,
                    'server_name': server_config['name'],
                    'type': 'memory',
                    'level': 'critical',
                    'message': f"内存使用率过高: {memory_percent}%",
                    'value': memory_percent,
                    'threshold': thresholds.get('memory_critical', 95),
                    'timestamp': datetime.now().isoformat()
                })
            elif memory_percent >= thresholds.get('memory_warning', 80):
                alerts.append({
                    'server_id': server_id,
                    'server_name': server_config['name'],
                    'type': 'memory',
                    'level': 'warning',
                    'message': f"内存使用率较高: {memory_percent}%",
                    'value': memory_percent,
                    'threshold': thresholds.get('memory_warning', 80),
                    'timestamp': datetime.now().isoformat()
                })
            
            # 检查磁盘告警
            for disk in server_data['disk']:
                disk_percent = disk['usage_percent']
                if disk_percent >= thresholds.get('disk_critical', 95):
                    alerts.append({
                        'server_id': server_id,
                        'server_name': server_config['name'],
                        'type': 'disk',
                        'level': 'critical',
                        'message': f"磁盘 {disk['device']} 使用率过高: {disk_percent}%",
                        'value': disk_percent,
                        'threshold': thresholds.get('disk_critical', 95),
                        'disk_device': disk['device'],
                        'timestamp': datetime.now().isoformat()
                    })
                elif disk_percent >= thresholds.get('disk_warning', 80):
                    alerts.append({
                        'server_id': server_id,
                        'server_name': server_config['name'],
                        'type': 'disk',
                        'level': 'warning',
                        'message': f"磁盘 {disk['device']} 使用率较高: {disk_percent}%",
                        'value': disk_percent,
                        'threshold': thresholds.get('disk_warning', 80),
                        'disk_device': disk['device'],
                        'timestamp': datetime.now().isoformat()
                    })
        
        # 检查离线服务器
        for server_id, status in self.servers_status.items():
            if status['status'] != 'online':
                server_config = self.config.get_server(server_id)
                alerts.append({
                    'server_id': server_id,
                    'server_name': server_config['name'] if server_config else server_id,
                    'type': 'connection',
                    'level': 'critical',
                    'message': f"服务器离线或无法连接: {status.get('error', 'Unknown error')}",
                    'timestamp': datetime.now().isoformat()
                })
        
        return alerts


async def main():
    """主函数 - 演示使用"""
    print("多服务器监控客户端测试")
    print("=" * 50)
    
    async with MultiServerClient() as client:
        # 获取所有服务器数据
        print("正在获取服务器数据...")
        results = await client.fetch_all_servers_metrics()
        
        if results:
            print(f"\n成功获取 {len(results)} 个服务器的数据:")
            for server_id, metrics in results.items():
                print(f"\n服务器: {server_id} ({metrics['server_name']})")
                print(f"  CPU使用率: {metrics['cpu']['usage_percent']}%")
                print(f"  内存使用率: {metrics['memory']['usage_percent']}%")
                print(f"  磁盘数量: {len(metrics['disk'])}")
                print(f"  更新时间: {metrics['timestamp']}")
            
            # 获取聚合数据
            print("\n聚合统计:")
            aggregated = client.get_aggregated_metrics()
            print(f"  总服务器数: {aggregated['total_servers']}")
            print(f"  在线服务器: {aggregated['online_servers']}")
            print(f"  离线服务器: {aggregated['offline_servers']}")
            print(f"  平均CPU使用率: {aggregated['average_metrics']['cpu_percent']}%")
            print(f"  平均内存使用率: {aggregated['average_metrics']['memory_percent']}%")
            print(f"  平均磁盘使用率: {aggregated['average_metrics']['disk_percent']}%")
            
            # 获取告警信息
            alerts = client.get_server_alerts()
            if alerts:
                print(f"\n告警信息 ({len(alerts)} 条):")
                for alert in alerts:
                    level_color = "🔴" if alert['level'] == 'critical' else "🟡"
                    print(f"  {level_color} {alert['server_name']}: {alert['message']}")
            else:
                print("\n✅ 没有告警信息")
        else:
            print("未能获取到任何服务器数据")


if __name__ == "__main__":
    asyncio.run(main())