#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python邮件发送演示程序
支持多种邮件服务商和邮件类型
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from typing import Optional, List


class EmailSender:
    """邮件发送器类"""
    
    def __init__(self, smtp_server: str, smtp_port: int, sender_email: str, sender_password: str):
        """
        初始化邮件发送器
        
        Args:
            smtp_server: SMTP服务器地址
            smtp_port: SMTP端口
            sender_email: 发送者邮箱
            sender_password: 发送者密码或应用专用密码
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
    
    def send_text_email(self, recipient_email: str, subject: str, body: str) -> bool:
        """
        发送纯文本邮件
        
        Args:
            recipient_email: 收件人邮箱
            subject: 邮件主题
            body: 邮件正文
            
        Returns:
            bool: 发送是否成功
        """
        try:
            # 创建邮件对象
            message = MIMEText(body, 'plain', 'utf-8')
            message['From'] = self.sender_email
            message['To'] = recipient_email
            message['Subject'] = subject
            
            # 连接SMTP服务器并发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # 启用TLS加密
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            print(f"✅ 纯文本邮件发送成功！收件人: {recipient_email}")
            return True
            
        except Exception as e:
            print(f"❌ 纯文本邮件发送失败: {str(e)}")
            return False
    
    def send_html_email(self, recipient_email: str, subject: str, html_body: str) -> bool:
        """
        发送HTML格式邮件
        
        Args:
            recipient_email: 收件人邮箱
            subject: 邮件主题
            html_body: HTML格式邮件正文
            
        Returns:
            bool: 发送是否成功
        """
        try:
            # 创建邮件对象
            message = MIMEText(html_body, 'html', 'utf-8')
            message['From'] = self.sender_email
            message['To'] = recipient_email
            message['Subject'] = subject
            
            # 连接SMTP服务器并发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            print(f"✅ HTML邮件发送成功！收件人: {recipient_email}")
            return True
            
        except Exception as e:
            print(f"❌ HTML邮件发送失败: {str(e)}")
            return False
    
    def send_email_with_attachment(self, recipient_email: str, subject: str, body: str, 
                                 attachment_path: str) -> bool:
        """
        发送带附件的邮件
        
        Args:
            recipient_email: 收件人邮箱
            subject: 邮件主题
            body: 邮件正文
            attachment_path: 附件文件路径
            
        Returns:
            bool: 发送是否成功
        """
        try:
            # 创建多部分邮件对象
            message = MIMEMultipart()
            message['From'] = self.sender_email
            message['To'] = recipient_email
            message['Subject'] = subject
            
            # 添加邮件正文
            message.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # 添加附件
            if os.path.exists(attachment_path):
                with open(attachment_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {os.path.basename(attachment_path)}'
                )
                message.attach(part)
            else:
                print(f"⚠️ 附件文件不存在: {attachment_path}")
                return False
            
            # 连接SMTP服务器并发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            print(f"✅ 带附件邮件发送成功！收件人: {recipient_email}")
            return True
            
        except Exception as e:
            print(f"❌ 带附件邮件发送失败: {str(e)}")
            return False
    
    def send_bulk_email(self, recipient_emails: List[str], subject: str, body: str) -> int:
        """
        批量发送邮件
        
        Args:
            recipient_emails: 收件人邮箱列表
            subject: 邮件主题
            body: 邮件正文
            
        Returns:
            int: 成功发送的邮件数量
        """
        success_count = 0
        
        for recipient_email in recipient_emails:
            if self.send_text_email(recipient_email, subject, body):
                success_count += 1
        
        print(f"📊 批量发送完成: {success_count}/{len(recipient_emails)} 封邮件发送成功")
        return success_count


def get_smtp_config(email_provider: str) -> dict:
    """
    获取不同邮件服务商的SMTP配置
    
    Args:
        email_provider: 邮件服务商名称
        
    Returns:
        dict: SMTP配置信息
    """
    configs = {
        'gmail': {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587
        },
        'outlook': {
            'smtp_server': 'smtp-mail.outlook.com',
            'smtp_port': 587
        },
        'qq': {
            'smtp_server': 'smtp.qq.com',
            'smtp_port': 587
        },
        '163': {
            'smtp_server': 'smtp.163.com',
            'smtp_port': 587
        },
        'sina': {
            'smtp_server': 'smtp.sina.com',
            'smtp_port': 587
        }
    }
    
    return configs.get(email_provider.lower(), configs['gmail'])


def main():
    """主函数 - 演示各种邮件发送功能"""
    
    print("🚀 Python邮件发送演示程序")
    print("=" * 50)
    
    # 邮件配置（请根据实际情况修改）
    EMAIL_PROVIDER = 'gmail'  # 可选: gmail, outlook, qq, 163, sina
    SENDER_EMAIL = 'your_email@gmail.com'  # 发送者邮箱
    SENDER_PASSWORD = 'your_app_password'  # 发送者密码或应用专用密码
    RECIPIENT_EMAIL = 'recipient@example.com'  # 收件人邮箱
    
    # 获取SMTP配置
    smtp_config = get_smtp_config(EMAIL_PROVIDER)
    
    # 创建邮件发送器
    email_sender = EmailSender(
        smtp_server=smtp_config['smtp_server'],
        smtp_port=smtp_config['smtp_port'],
        sender_email=SENDER_EMAIL,
        sender_password=SENDER_PASSWORD
    )
    
    print(f"📧 使用 {EMAIL_PROVIDER.upper()} SMTP服务器: {smtp_config['smtp_server']}:{smtp_config['smtp_port']}")
    print(f"📤 发送者: {SENDER_EMAIL}")
    print(f"📥 收件人: {RECIPIENT_EMAIL}")
    print()
    
    # 演示1: 发送纯文本邮件
    print("📝 演示1: 发送纯文本邮件")
    text_subject = "Python邮件发送测试 - 纯文本"
    text_body = """
    您好！
    
    这是一封通过Python程序发送的测试邮件。
    
    功能特点：
    - 支持多种邮件服务商
    - 支持纯文本和HTML格式
    - 支持附件发送
    - 支持批量发送
    
    祝您使用愉快！
    
    此致
    Python邮件发送程序
    """
    
    email_sender.send_text_email(RECIPIENT_EMAIL, text_subject, text_body)
    print()
    
    # 演示2: 发送HTML邮件
    print("🎨 演示2: 发送HTML邮件")
    html_subject = "Python邮件发送测试 - HTML格式"
    html_body = """
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                🚀 Python邮件发送演示
            </h2>
            
            <p>您好！</p>
            
            <p>这是一封<strong>HTML格式</strong>的测试邮件，展示了以下功能：</p>
            
            <ul style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db;">
                <li>✅ 支持多种邮件服务商 (Gmail, Outlook, QQ, 163等)</li>
                <li>✅ 支持纯文本和HTML格式</li>
                <li>✅ 支持附件发送</li>
                <li>✅ 支持批量发送</li>
                <li>✅ 支持中文内容</li>
            </ul>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #27ae60; margin-top: 0;">💡 使用提示</h3>
                <p>请确保在发送邮件前：</p>
                <ol>
                    <li>正确配置SMTP服务器信息</li>
                    <li>使用正确的邮箱和密码（或应用专用密码）</li>
                    <li>检查网络连接</li>
                </ol>
            </div>
            
            <p style="text-align: center; color: #7f8c8d; font-size: 14px;">
                此致<br>
                <strong>Python邮件发送程序</strong>
            </p>
        </div>
    </body>
    </html>
    """
    
    email_sender.send_html_email(RECIPIENT_EMAIL, html_subject, html_body)
    print()
    
    # 演示3: 发送带附件的邮件
    print("📎 演示3: 发送带附件的邮件")
    attachment_subject = "Python邮件发送测试 - 带附件"
    attachment_body = "这是一封带附件的测试邮件。"
    
    # 创建一个示例附件文件
    sample_file = "/workspace/sample_attachment.txt"
    with open(sample_file, 'w', encoding='utf-8') as f:
        f.write("这是一个示例附件文件\n")
        f.write("由Python邮件发送程序创建\n")
        f.write("包含中文内容测试\n")
    
    email_sender.send_email_with_attachment(
        RECIPIENT_EMAIL, 
        attachment_subject, 
        attachment_body, 
        sample_file
    )
    print()
    
    # 演示4: 批量发送邮件
    print("📬 演示4: 批量发送邮件")
    bulk_recipients = [
        'recipient1@example.com',
        'recipient2@example.com',
        'recipient3@example.com'
    ]
    bulk_subject = "Python邮件发送测试 - 批量发送"
    bulk_body = "这是一封批量发送的测试邮件。"
    
    success_count = email_sender.send_bulk_email(bulk_recipients, bulk_subject, bulk_body)
    print()
    
    print("🎉 所有演示完成！")
    print("\n📋 使用说明：")
    print("1. 修改 SENDER_EMAIL 和 SENDER_PASSWORD 为您的实际邮箱信息")
    print("2. 修改 RECIPIENT_EMAIL 为实际收件人邮箱")
    print("3. 根据您的邮箱服务商选择正确的 EMAIL_PROVIDER")
    print("4. 运行程序: python email_demo.py")


if __name__ == "__main__":
    main()