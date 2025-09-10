#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信支付配置文件
"""

# 微信支付配置
WECHAT_PAY_CONFIG = {
    # 商户号（必填）
    'mch_id': 'your_mch_id',
    
    # 应用ID（必填）
    'app_id': 'your_app_id',
    
    # API密钥（必填）
    'api_key': 'your_api_key',
    
    # 证书文件路径（转账等操作需要）
    'cert_path': 'cert/apiclient_cert.pem',
    'key_path': 'cert/apiclient_key.pem',
    
    # 是否使用沙箱环境
    'sandbox': True,
    
    # 回调通知地址
    'notify_url': 'https://yourdomain.com/notify',
}

# 转账配置
TRANSFER_CONFIG = {
    # 转账描述模板
    'desc_template': '转账给{user_name}',
    
    # 最大转账金额（分）
    'max_amount': 200000,  # 2000元
    
    # 最小转账金额（分）
    'min_amount': 100,     # 1元
    
    # 转账超时时间（秒）
    'timeout': 30,
}