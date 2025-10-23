#!/usr/bin/env python3
"""
服务器监控配置管理
支持多服务器配置和管理
"""

import json
import os
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class ServerConfig:
    """服务器配置类"""
    
    def __init__(self, config_file: str = "servers_config.json"):
        self.config_file = config_file
        self.servers = {}
        self.load_config()
    
    def load_config(self):
        """加载配置文件"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.servers = data.get('servers', {})
                logger.info(f"已加载 {len(self.servers)} 个服务器配置")
            else:
                # 创建默认配置
                self.create_default_config()
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            self.create_default_config()
    
    def create_default_config(self):
        """创建默认配置"""
        self.servers = {
            "local": {
                "name": "本地服务器",
                "host": "localhost",
                "port": 5000,
                "enabled": True,
                "description": "本地监控服务器",
                "tags": ["local", "primary"],
                "thresholds": {
                    "cpu_warning": 70,
                    "cpu_critical": 90,
                    "memory_warning": 80,
                    "memory_critical": 95,
                    "disk_warning": 80,
                    "disk_critical": 95
                }
            }
        }
        self.save_config()
    
    def save_config(self):
        """保存配置文件"""
        try:
            config_data = {
                "servers": self.servers,
                "global_settings": {
                    "update_interval": 10,
                    "history_limit": 100,
                    "auto_refresh": True
                }
            }
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, ensure_ascii=False, indent=2)
            logger.info(f"配置已保存到 {self.config_file}")
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")
    
    def add_server(self, server_id: str, config: Dict) -> bool:
        """添加服务器配置"""
        try:
            required_fields = ['name', 'host', 'port']
            for field in required_fields:
                if field not in config:
                    raise ValueError(f"缺少必需字段: {field}")
            
            # 设置默认值
            default_config = {
                "enabled": True,
                "description": "",
                "tags": [],
                "thresholds": {
                    "cpu_warning": 70,
                    "cpu_critical": 90,
                    "memory_warning": 80,
                    "memory_critical": 95,
                    "disk_warning": 80,
                    "disk_critical": 95
                }
            }
            
            # 合并配置
            server_config = {**default_config, **config}
            self.servers[server_id] = server_config
            self.save_config()
            
            logger.info(f"已添加服务器配置: {server_id}")
            return True
            
        except Exception as e:
            logger.error(f"添加服务器配置失败: {e}")
            return False
    
    def remove_server(self, server_id: str) -> bool:
        """移除服务器配置"""
        try:
            if server_id in self.servers:
                del self.servers[server_id]
                self.save_config()
                logger.info(f"已移除服务器配置: {server_id}")
                return True
            else:
                logger.warning(f"服务器配置不存在: {server_id}")
                return False
        except Exception as e:
            logger.error(f"移除服务器配置失败: {e}")
            return False
    
    def get_server(self, server_id: str) -> Optional[Dict]:
        """获取服务器配置"""
        return self.servers.get(server_id)
    
    def get_all_servers(self) -> Dict:
        """获取所有服务器配置"""
        return self.servers
    
    def get_enabled_servers(self) -> Dict:
        """获取启用的服务器配置"""
        return {k: v for k, v in self.servers.items() if v.get('enabled', True)}
    
    def update_server(self, server_id: str, config: Dict) -> bool:
        """更新服务器配置"""
        try:
            if server_id not in self.servers:
                logger.warning(f"服务器配置不存在: {server_id}")
                return False
            
            # 更新配置
            self.servers[server_id].update(config)
            self.save_config()
            
            logger.info(f"已更新服务器配置: {server_id}")
            return True
            
        except Exception as e:
            logger.error(f"更新服务器配置失败: {e}")
            return False
    
    def enable_server(self, server_id: str) -> bool:
        """启用服务器"""
        return self.update_server(server_id, {"enabled": True})
    
    def disable_server(self, server_id: str) -> bool:
        """禁用服务器"""
        return self.update_server(server_id, {"enabled": False})
    
    def get_server_url(self, server_id: str) -> Optional[str]:
        """获取服务器URL"""
        server = self.get_server(server_id)
        if server:
            return f"http://{server['host']}:{server['port']}"
        return None


# 全局配置实例
server_config = ServerConfig()


def get_config() -> ServerConfig:
    """获取配置实例"""
    return server_config


# 示例配置文件生成
def create_example_config():
    """创建示例配置文件"""
    example_servers = {
        "web-server-01": {
            "name": "Web服务器01",
            "host": "192.168.1.100",
            "port": 5000,
            "enabled": True,
            "description": "主要的Web服务器",
            "tags": ["web", "production"],
            "thresholds": {
                "cpu_warning": 70,
                "cpu_critical": 90,
                "memory_warning": 80,
                "memory_critical": 95,
                "disk_warning": 80,
                "disk_critical": 95
            }
        },
        "db-server-01": {
            "name": "数据库服务器01",
            "host": "192.168.1.101",
            "port": 5000,
            "enabled": True,
            "description": "主数据库服务器",
            "tags": ["database", "production"],
            "thresholds": {
                "cpu_warning": 60,
                "cpu_critical": 85,
                "memory_warning": 75,
                "memory_critical": 90,
                "disk_warning": 70,
                "disk_critical": 90
            }
        },
        "cache-server-01": {
            "name": "缓存服务器01",
            "host": "192.168.1.102",
            "port": 5000,
            "enabled": True,
            "description": "Redis缓存服务器",
            "tags": ["cache", "production"],
            "thresholds": {
                "cpu_warning": 80,
                "cpu_critical": 95,
                "memory_warning": 85,
                "memory_critical": 98,
                "disk_warning": 90,
                "disk_critical": 98
            }
        }
    }
    
    config = ServerConfig("example_servers_config.json")
    config.servers = example_servers
    config.save_config()
    
    print("示例配置文件已创建: example_servers_config.json")
    print("包含以下服务器:")
    for server_id, server_info in example_servers.items():
        print(f"  - {server_id}: {server_info['name']} ({server_info['host']}:{server_info['port']})")


if __name__ == "__main__":
    # 创建示例配置
    create_example_config()
    
    # 测试配置管理
    config = ServerConfig()
    print("\n当前服务器配置:")
    for server_id, server_info in config.get_all_servers().items():
        status = "启用" if server_info.get('enabled', True) else "禁用"
        print(f"  - {server_id}: {server_info['name']} ({status})")