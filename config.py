#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控系统配置文件
"""

import os
from pathlib import Path

# 基础配置
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"

# 创建必要的目录
DATA_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# 服务器配置
SERVER_CONFIG = {
    # 默认服务器名称（None表示自动检测）
    "default_server_name": None,
    
    # 数据采集间隔（分钟）
    "collection_interval": 1,
    
    # 数据保留时间（小时）
    "data_retention_hours": 24 * 7,  # 7天
    
    # 最大历史记录数
    "max_history_records": 1000,
}

# 大屏配置
DASHBOARD_CONFIG = {
    # 监听端口
    "port": 5000,
    
    # 监听地址
    "host": "0.0.0.0",
    
    # 调试模式
    "debug": False,
    
    # 自动刷新间隔（秒）
    "refresh_interval": 30,
}

# 监控阈值配置
THRESHOLD_CONFIG = {
    # CPU使用率阈值
    "cpu": {
        "warning": 70,   # 警告阈值
        "critical": 90,  # 危险阈值
    },
    
    # 内存使用率阈值
    "memory": {
        "warning": 80,
        "critical": 95,
    },
    
    # 磁盘使用率阈值
    "disk": {
        "warning": 85,
        "critical": 95,
    },
}

# 日志配置
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": LOG_DIR / "monitoring.log",
    "max_size": 10 * 1024 * 1024,  # 10MB
    "backup_count": 5,
}

# 多服务器配置示例
MULTI_SERVER_CONFIG = [
    {
        "name": "web-server-01",
        "host": "192.168.1.10",
        "description": "Web服务器1",
        "enabled": True,
    },
    {
        "name": "db-server-01", 
        "host": "192.168.1.11",
        "description": "数据库服务器1",
        "enabled": True,
    },
    {
        "name": "app-server-01",
        "host": "192.168.1.12", 
        "description": "应用服务器1",
        "enabled": True,
    },
]

# 图表配置
CHART_CONFIG = {
    # 历史数据时间范围（小时）
    "history_hours": 24,
    
    # 图表更新间隔（秒）
    "update_interval": 30,
    
    # 图表颜色主题
    "colors": {
        "cpu": "#4CAF50",
        "memory": "#2196F3", 
        "disk": "#FF9800",
        "network": "#9C27B0",
    },
}

# 告警配置
ALERT_CONFIG = {
    # 是否启用告警
    "enabled": False,
    
    # 告警方式
    "methods": ["email", "webhook"],
    
    # 邮件配置
    "email": {
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "username": "",
        "password": "",
        "to_addresses": [],
    },
    
    # Webhook配置
    "webhook": {
        "url": "",
        "timeout": 10,
    },
}