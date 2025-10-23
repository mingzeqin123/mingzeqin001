#!/usr/bin/env python3
"""
服务器监控系统 - 采集服务器状态指标
包括CPU使用率、内存使用比例、硬盘使用空间等
"""

import psutil
import json
import time
import socket
import platform
from datetime import datetime
from typing import Dict, List
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ServerMonitor:
    """服务器监控类"""
    
    def __init__(self, server_name: str = None):
        self.server_name = server_name or socket.gethostname()
        self.start_time = time.time()
    
    def get_cpu_info(self) -> Dict:
        """获取CPU信息"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_count_logical = psutil.cpu_count(logical=True)
            
            # 获取CPU频率
            cpu_freq = psutil.cpu_freq()
            cpu_freq_current = cpu_freq.current if cpu_freq else 0
            
            return {
                'usage_percent': round(cpu_percent, 2),
                'count_physical': cpu_count,
                'count_logical': cpu_count_logical,
                'frequency_mhz': round(cpu_freq_current, 2) if cpu_freq_current else 0
            }
        except Exception as e:
            logger.error(f"获取CPU信息失败: {e}")
            return {'usage_percent': 0, 'count_physical': 0, 'count_logical': 0, 'frequency_mhz': 0}
    
    def get_memory_info(self) -> Dict:
        """获取内存信息"""
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'used_gb': round(memory.used / (1024**3), 2),
                'usage_percent': round(memory.percent, 2),
                'swap_total_gb': round(swap.total / (1024**3), 2),
                'swap_used_gb': round(swap.used / (1024**3), 2),
                'swap_percent': round(swap.percent, 2)
            }
        except Exception as e:
            logger.error(f"获取内存信息失败: {e}")
            return {
                'total_gb': 0, 'available_gb': 0, 'used_gb': 0, 'usage_percent': 0,
                'swap_total_gb': 0, 'swap_used_gb': 0, 'swap_percent': 0
            }
    
    def get_disk_info(self) -> List[Dict]:
        """获取磁盘信息"""
        try:
            disk_info = []
            partitions = psutil.disk_partitions()
            
            for partition in partitions:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_info.append({
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'fstype': partition.fstype,
                        'total_gb': round(usage.total / (1024**3), 2),
                        'used_gb': round(usage.used / (1024**3), 2),
                        'free_gb': round(usage.free / (1024**3), 2),
                        'usage_percent': round((usage.used / usage.total) * 100, 2)
                    })
                except PermissionError:
                    # 跳过无权限访问的分区
                    continue
            
            return disk_info
        except Exception as e:
            logger.error(f"获取磁盘信息失败: {e}")
            return []
    
    def get_network_info(self) -> Dict:
        """获取网络信息"""
        try:
            net_io = psutil.net_io_counters()
            
            return {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv
            }
        except Exception as e:
            logger.error(f"获取网络信息失败: {e}")
            return {'bytes_sent': 0, 'bytes_recv': 0, 'packets_sent': 0, 'packets_recv': 0}
    
    def get_system_info(self) -> Dict:
        """获取系统信息"""
        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = time.time() - psutil.boot_time()
            
            return {
                'hostname': self.server_name,
                'platform': platform.platform(),
                'system': platform.system(),
                'processor': platform.processor(),
                'boot_time': boot_time.strftime('%Y-%m-%d %H:%M:%S'),
                'uptime_hours': round(uptime / 3600, 2)
            }
        except Exception as e:
            logger.error(f"获取系统信息失败: {e}")
            return {
                'hostname': self.server_name,
                'platform': 'Unknown',
                'system': 'Unknown',
                'processor': 'Unknown',
                'boot_time': 'Unknown',
                'uptime_hours': 0
            }
    
    def get_all_metrics(self) -> Dict:
        """获取所有监控指标"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        metrics = {
            'timestamp': timestamp,
            'server_name': self.server_name,
            'system': self.get_system_info(),
            'cpu': self.get_cpu_info(),
            'memory': self.get_memory_info(),
            'disk': self.get_disk_info(),
            'network': self.get_network_info()
        }
        
        return metrics
    
    def save_metrics_to_file(self, filename: str = None):
        """保存指标到文件"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"server_metrics_{self.server_name}_{timestamp}.json"
        
        metrics = self.get_all_metrics()
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(metrics, f, ensure_ascii=False, indent=2)
            logger.info(f"指标已保存到文件: {filename}")
        except Exception as e:
            logger.error(f"保存指标到文件失败: {e}")


def main():
    """主函数 - 演示使用"""
    monitor = ServerMonitor()
    
    print("=" * 60)
    print("服务器监控系统")
    print("=" * 60)
    
    # 获取所有指标
    metrics = monitor.get_all_metrics()
    
    # 打印系统信息
    print(f"\n服务器: {metrics['system']['hostname']}")
    print(f"系统: {metrics['system']['platform']}")
    print(f"启动时间: {metrics['system']['boot_time']}")
    print(f"运行时间: {metrics['system']['uptime_hours']} 小时")
    
    # 打印CPU信息
    cpu = metrics['cpu']
    print(f"\nCPU使用率: {cpu['usage_percent']}%")
    print(f"CPU核心数: {cpu['count_physical']} 物理核心, {cpu['count_logical']} 逻辑核心")
    print(f"CPU频率: {cpu['frequency_mhz']} MHz")
    
    # 打印内存信息
    memory = metrics['memory']
    print(f"\n内存使用率: {memory['usage_percent']}%")
    print(f"内存总量: {memory['total_gb']} GB")
    print(f"已使用: {memory['used_gb']} GB")
    print(f"可用: {memory['available_gb']} GB")
    
    # 打印磁盘信息
    print(f"\n磁盘使用情况:")
    for disk in metrics['disk']:
        print(f"  {disk['device']} ({disk['mountpoint']}): {disk['usage_percent']}% "
              f"({disk['used_gb']}/{disk['total_gb']} GB)")
    
    # 打印网络信息
    network = metrics['network']
    print(f"\n网络统计:")
    print(f"  发送: {network['bytes_sent'] / (1024**2):.2f} MB")
    print(f"  接收: {network['bytes_recv'] / (1024**2):.2f} MB")
    
    # 保存到文件
    monitor.save_metrics_to_file()


if __name__ == "__main__":
    main()