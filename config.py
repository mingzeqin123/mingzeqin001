#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云API配置文件
"""

import os
from typing import Dict, Any


class BaiduCloudConfig:
    """百度云API配置类"""
    
    # API配置
    API_KEY = os.getenv("BAIDU_API_KEY", "")
    SECRET_KEY = os.getenv("BAIDU_SECRET_KEY", "")
    
    # API端点配置
    BASE_URL = "https://aip.baidubce.com"
    OAUTH_URL = f"{BASE_URL}/oauth/2.0/token"
    USAGE_URL = f"{BASE_URL}/rest/2.0/wenxin/v1/usage"
    MODELS_URL = f"{BASE_URL}/rest/2.0/wenxin/v1/models"
    LOGS_URL = f"{BASE_URL}/rest/2.0/wenxin/v1/usage/logs"
    
    # 默认配置
    DEFAULT_MODEL = "ernie-bot"
    DEFAULT_DAYS = 7
    DEFAULT_LIMIT = 100
    
    # 支持的模型列表
    SUPPORTED_MODELS = [
        "ernie-bot",
        "ernie-bot-turbo", 
        "ernie-bot-4",
        "ernie-bot-8k",
        "ernie-bot-128k",
        "ernie-vilg-v2",
        "ernie-speed",
        "ernie-speed-128k"
    ]
    
    # 请求配置
    REQUEST_TIMEOUT = 30
    MAX_RETRIES = 3
    RETRY_DELAY = 1
    
    @classmethod
    def validate_config(cls) -> bool:
        """
        验证配置是否完整
        
        Returns:
            bool: 配置是否有效
        """
        return bool(cls.API_KEY and cls.SECRET_KEY)
    
    @classmethod
    def get_config_dict(cls) -> Dict[str, Any]:
        """
        获取配置字典
        
        Returns:
            Dict[str, Any]: 配置字典
        """
        return {
            "api_key": cls.API_KEY,
            "secret_key": cls.SECRET_KEY,
            "base_url": cls.BASE_URL,
            "default_model": cls.DEFAULT_MODEL,
            "default_days": cls.DEFAULT_DAYS,
            "supported_models": cls.SUPPORTED_MODELS,
            "request_timeout": cls.REQUEST_TIMEOUT,
            "max_retries": cls.MAX_RETRIES,
            "retry_delay": cls.RETRY_DELAY
        }