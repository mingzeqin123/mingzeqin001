#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版Python邮件发送示例
快速上手，适合初学者
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_simple_email():
    """发送简单邮件的函数"""
    
    # 邮件配置 - 请修改为您的实际信息
    smtp_server = "smtp.gmail.com"  # Gmail SMTP服务器
    smtp_port = 587                 # Gmail SMTP端口
    sender_email = "your_email@gmail.com"  # 发送者邮箱
    sender_password = "your_app_password"  # 发送者密码或应用专用密码
    recipient_email = "recipient@example.com"  # 收件人邮箱
    
    # 邮件内容
    subject = "Python邮件发送测试"
    body = """
    您好！
    
    这是一封通过Python发送的测试邮件。
    
    如果您收到这封邮件，说明邮件发送功能正常工作。
    
    祝您使用愉快！
    """
    
    try:
        # 创建邮件对象
        message = MIMEText(body, 'plain', 'utf-8')
        message['From'] = sender_email
        message['To'] = recipient_email
        message['Subject'] = subject
        
        # 连接SMTP服务器并发送邮件
        print("正在连接SMTP服务器...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            print("正在启用TLS加密...")
            server.starttls()  # 启用TLS加密
            
            print("正在登录邮箱...")
            server.login(sender_email, sender_password)
            
            print("正在发送邮件...")
            server.send_message(message)
        
        print("✅ 邮件发送成功！")
        print(f"📧 收件人: {recipient_email}")
        print(f"📝 主题: {subject}")
        
    except smtplib.SMTPAuthenticationError:
        print("❌ 认证失败！请检查邮箱和密码是否正确。")
        print("💡 提示：Gmail需要使用应用专用密码，不是账户密码。")
        
    except smtplib.SMTPRecipientsRefused:
        print("❌ 收件人邮箱被拒绝！请检查收件人邮箱地址。")
        
    except smtplib.SMTPServerDisconnected:
        print("❌ 服务器连接断开！请检查网络连接。")
        
    except Exception as e:
        print(f"❌ 发送失败: {str(e)}")


def send_html_email():
    """发送HTML格式邮件的函数"""
    
    # 邮件配置
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "your_email@gmail.com"
    sender_password = "your_app_password"
    recipient_email = "recipient@example.com"
    
    # 邮件内容
    subject = "Python HTML邮件测试"
    html_body = """
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #2c3e50;">🚀 Python邮件发送成功！</h2>
        <p>这是一封<strong>HTML格式</strong>的测试邮件。</p>
        <ul>
            <li>✅ 支持HTML格式</li>
            <li>✅ 支持中文内容</li>
            <li>✅ 支持样式设置</li>
        </ul>
        <p style="color: #7f8c8d;">祝您使用愉快！</p>
    </body>
    </html>
    """
    
    try:
        # 创建HTML邮件对象
        message = MIMEText(html_body, 'html', 'utf-8')
        message['From'] = sender_email
        message['To'] = recipient_email
        message['Subject'] = subject
        
        # 发送邮件
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
        
        print("✅ HTML邮件发送成功！")
        
    except Exception as e:
        print(f"❌ HTML邮件发送失败: {str(e)}")


if __name__ == "__main__":
    print("🚀 Python邮件发送简单示例")
    print("=" * 40)
    
    print("\n📝 发送纯文本邮件...")
    send_simple_email()
    
    print("\n🎨 发送HTML邮件...")
    send_html_email()
    
    print("\n📋 使用说明：")
    print("1. 修改代码中的邮箱配置信息")
    print("2. 确保使用正确的密码或应用专用密码")
    print("3. 运行程序: python simple_email_example.py")