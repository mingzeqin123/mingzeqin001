#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控系统 - 数据采集模块
采集CPU使用率、内存使用比例、硬盘使用空间等指标
"""

import psutil
import time
import json
import os
import platform
import socket
from datetime import datetime
from typing import Dict, List, Any
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ServerMonitor:
    """服务器监控类"""
    
    def __init__(self, server_name: str = None):
        self.server_name = server_name or self._get_server_name()
        self.data_file = f"server_data_{self.server_name}.json"
        
    def _get_server_name(self) -> str:
        """获取服务器名称"""
        try:
            hostname = socket.gethostname()
            return hostname
        except:
            return platform.node()
    
    def get_cpu_usage(self) -> Dict[str, Any]:
        """获取CPU使用率信息"""
        try:
            # CPU使用率（1秒间隔）
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # CPU核心数
            cpu_count = psutil.cpu_count()
            
            # CPU频率信息
            cpu_freq = psutil.cpu_freq()
            
            # 每个CPU核心的使用率
            cpu_per_core = psutil.cpu_percent(interval=1, percpu=True)
            
            return {
                "total_usage": round(cpu_percent, 2),
                "core_count": cpu_count,
                "per_core_usage": [round(x, 2) for x in cpu_per_core],
                "frequency": {
                    "current": round(cpu_freq.current, 2) if cpu_freq else 0,
                    "min": round(cpu_freq.min, 2) if cpu_freq else 0,
                    "max": round(cpu_freq.max, 2) if cpu_freq else 0
                } if cpu_freq else None
            }
        except Exception as e:
            logger.error(f"获取CPU信息失败: {e}")
            return {"error": str(e)}
    
    def get_memory_usage(self) -> Dict[str, Any]:
        """获取内存使用信息"""
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                "total": round(memory.total / (1024**3), 2),  # GB
                "available": round(memory.available / (1024**3), 2),  # GB
                "used": round(memory.used / (1024**3), 2),  # GB
                "usage_percent": round(memory.percent, 2),
                "swap": {
                    "total": round(swap.total / (1024**3), 2),  # GB
                    "used": round(swap.used / (1024**3), 2),  # GB
                    "free": round(swap.free / (1024**3), 2),  # GB
                    "usage_percent": round(swap.percent, 2)
                }
            }
        except Exception as e:
            logger.error(f"获取内存信息失败: {e}")
            return {"error": str(e)}
    
    def get_disk_usage(self) -> List[Dict[str, Any]]:
        """获取硬盘使用信息"""
        try:
            disk_info = []
            
            # 获取所有磁盘分区
            partitions = psutil.disk_partitions()
            
            for partition in partitions:
                try:
                    # 跳过只读文件系统
                    if 'ro' in partition.opts:
                        continue
                        
                    usage = psutil.disk_usage(partition.mountpoint)
                    
                    disk_info.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": round(usage.total / (1024**3), 2),  # GB
                        "used": round(usage.used / (1024**3), 2),  # GB
                        "free": round(usage.free / (1024**3), 2),  # GB
                        "usage_percent": round((usage.used / usage.total) * 100, 2)
                    })
                except PermissionError:
                    # 跳过无权限访问的分区
                    continue
                except Exception as e:
                    logger.warning(f"获取分区 {partition.device} 信息失败: {e}")
                    continue
            
            return disk_info
        except Exception as e:
            logger.error(f"获取磁盘信息失败: {e}")
            return [{"error": str(e)}]
    
    def get_network_usage(self) -> Dict[str, Any]:
        """获取网络使用信息"""
        try:
            # 网络I/O统计
            net_io = psutil.net_io_counters()
            
            # 网络连接数
            connections = len(psutil.net_connections())
            
            return {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "connections": connections
            }
        except Exception as e:
            logger.error(f"获取网络信息失败: {e}")
            return {"error": str(e)}
    
    def get_system_info(self) -> Dict[str, Any]:
        """获取系统基本信息"""
        try:
            boot_time = psutil.boot_time()
            uptime = time.time() - boot_time
            
            return {
                "platform": platform.system(),
                "platform_version": platform.version(),
                "architecture": platform.machine(),
                "processor": platform.processor(),
                "boot_time": datetime.fromtimestamp(boot_time).isoformat(),
                "uptime_seconds": round(uptime, 2),
                "uptime_hours": round(uptime / 3600, 2),
                "uptime_days": round(uptime / (3600 * 24), 2)
            }
        except Exception as e:
            logger.error(f"获取系统信息失败: {e}")
            return {"error": str(e)}
    
    def collect_all_metrics(self) -> Dict[str, Any]:
        """采集所有指标"""
        timestamp = datetime.now().isoformat()
        
        metrics = {
            "server_name": self.server_name,
            "timestamp": timestamp,
            "cpu": self.get_cpu_usage(),
            "memory": self.get_memory_usage(),
            "disk": self.get_disk_usage(),
            "network": self.get_network_usage(),
            "system": self.get_system_info()
        }
        
        return metrics
    
    def save_metrics(self, metrics: Dict[str, Any]) -> bool:
        """保存指标到文件"""
        try:
            # 读取现有数据
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                data = {"server_name": self.server_name, "metrics": []}
            
            # 添加新指标
            data["metrics"].append(metrics)
            
            # 只保留最近1000条记录
            if len(data["metrics"]) > 1000:
                data["metrics"] = data["metrics"][-1000:]
            
            # 保存到文件
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            logger.error(f"保存指标失败: {e}")
            return False
    
    def get_latest_metrics(self) -> Dict[str, Any]:
        """获取最新指标"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data["metrics"]:
                        return data["metrics"][-1]
            return {}
        except Exception as e:
            logger.error(f"读取最新指标失败: {e}")
            return {}
    
    def get_metrics_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """获取历史指标"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # 过滤指定时间范围内的数据
                cutoff_time = time.time() - (hours * 3600)
                filtered_metrics = []
                
                for metric in data["metrics"]:
                    try:
                        metric_time = datetime.fromisoformat(metric["timestamp"]).timestamp()
                        if metric_time >= cutoff_time:
                            filtered_metrics.append(metric)
                    except:
                        continue
                
                return filtered_metrics
            return []
        except Exception as e:
            logger.error(f"读取历史指标失败: {e}")
            return []


def main():
    """主函数 - 用于测试"""
    monitor = ServerMonitor()
    
    print(f"开始监控服务器: {monitor.server_name}")
    
    # 采集一次指标
    metrics = monitor.collect_all_metrics()
    
    # 打印指标
    print("\n=== 服务器监控指标 ===")
    print(f"服务器名称: {metrics['server_name']}")
    print(f"采集时间: {metrics['timestamp']}")
    
    print(f"\nCPU使用率: {metrics['cpu'].get('total_usage', 'N/A')}%")
    print(f"内存使用率: {metrics['memory'].get('usage_percent', 'N/A')}%")
    
    print("\n磁盘使用情况:")
    for disk in metrics['disk']:
        if 'error' not in disk:
            print(f"  {disk['device']}: {disk['usage_percent']}% ({disk['used']:.1f}GB / {disk['total']:.1f}GB)")
    
    # 保存指标
    if monitor.save_metrics(metrics):
        print("\n指标已保存到文件")
    else:
        print("\n指标保存失败")


if __name__ == "__main__":
    main()