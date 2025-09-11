#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件配置文件示例
包含各种邮件服务商的SMTP配置
"""

import os
from typing import Dict, Any

# 邮件服务商SMTP配置
SMTP_CONFIGS = {
    'gmail': {
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'description': 'Gmail邮箱服务'
    },
    'outlook': {
        'smtp_server': 'smtp-mail.outlook.com',
        'smtp_port': 587,
        'description': 'Outlook/Hotmail邮箱服务'
    },
    'qq': {
        'smtp_server': 'smtp.qq.com',
        'smtp_port': 587,
        'description': 'QQ邮箱服务'
    },
    '163': {
        'smtp_server': 'smtp.163.com',
        'smtp_port': 587,
        'description': '163邮箱服务'
    },
    'sina': {
        'smtp_server': 'smtp.sina.com',
        'smtp_port': 587,
        'description': '新浪邮箱服务'
    },
    '126': {
        'smtp_server': 'smtp.126.com',
        'smtp_port': 587,
        'description': '126邮箱服务'
    }
}

# 邮件模板
EMAIL_TEMPLATES = {
    'welcome': {
        'subject': '欢迎注册我们的服务',
        'html_body': '''
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>欢迎注册！</h2>
            <p>感谢您注册我们的服务。</p>
            <p>如有任何问题，请随时联系我们。</p>
        </body>
        </html>
        ''',
        'text_body': '欢迎注册我们的服务！感谢您的支持。'
    },
    'notification': {
        'subject': '系统通知',
        'html_body': '''
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>系统通知</h2>
            <p>这是一条重要的系统通知。</p>
            <p>请及时查看并处理。</p>
        </body>
        </html>
        ''',
        'text_body': '系统通知：请及时查看并处理相关事项。'
    },
    'reminder': {
        'subject': '提醒通知',
        'html_body': '''
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>提醒通知</h2>
            <p>这是一个友好的提醒。</p>
            <p>请不要忘记处理相关事项。</p>
        </body>
        </html>
        ''',
        'text_body': '提醒：请不要忘记处理相关事项。'
    }
}

# 从环境变量获取邮件配置
def get_email_config() -> Dict[str, Any]:
    """
    从环境变量获取邮件配置
    
    Returns:
        Dict: 邮件配置信息
    """
    return {
        'sender_email': os.getenv('SENDER_EMAIL', 'your_email@gmail.com'),
        'sender_password': os.getenv('SENDER_PASSWORD', 'your_app_password'),
        'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
        'smtp_port': int(os.getenv('SMTP_PORT', '587')),
        'email_provider': os.getenv('EMAIL_PROVIDER', 'gmail')
    }

# 获取指定服务商的配置
def get_provider_config(provider: str) -> Dict[str, Any]:
    """
    获取指定邮件服务商的配置
    
    Args:
        provider: 邮件服务商名称
        
    Returns:
        Dict: SMTP配置信息
    """
    return SMTP_CONFIGS.get(provider.lower(), SMTP_CONFIGS['gmail'])

# 获取邮件模板
def get_email_template(template_name: str) -> Dict[str, str]:
    """
    获取邮件模板
    
    Args:
        template_name: 模板名称
        
    Returns:
        Dict: 邮件模板信息
    """
    return EMAIL_TEMPLATES.get(template_name, EMAIL_TEMPLATES['welcome'])

# 示例：如何使用配置
if __name__ == "__main__":
    print("📧 邮件配置示例")
    print("=" * 30)
    
    # 显示所有支持的邮件服务商
    print("\n支持的邮件服务商：")
    for provider, config in SMTP_CONFIGS.items():
        print(f"  {provider}: {config['smtp_server']}:{config['smtp_port']} - {config['description']}")
    
    # 显示所有邮件模板
    print("\n可用的邮件模板：")
    for template_name, template in EMAIL_TEMPLATES.items():
        print(f"  {template_name}: {template['subject']}")
    
    # 示例：获取Gmail配置
    print("\nGmail配置示例：")
    gmail_config = get_provider_config('gmail')
    print(f"  SMTP服务器: {gmail_config['smtp_server']}")
    print(f"  SMTP端口: {gmail_config['smtp_port']}")
    
    # 示例：获取欢迎邮件模板
    print("\n欢迎邮件模板示例：")
    welcome_template = get_email_template('welcome')
    print(f"  主题: {welcome_template['subject']}")
    print(f"  文本内容: {welcome_template['text_body']}")
    
    print("\n💡 使用提示：")
    print("1. 设置环境变量 SENDER_EMAIL 和 SENDER_PASSWORD")
    print("2. 设置环境变量 EMAIL_PROVIDER 选择邮件服务商")
    print("3. 在代码中导入并使用这些配置函数")