#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python 邮件发送演示程序
Email Sending Demo in Python

这个演示程序展示了如何使用Python发送各种类型的邮件：
- 纯文本邮件
- HTML格式邮件
- 带附件的邮件
- 群发邮件

支持的邮件服务提供商：
- Gmail
- 163邮箱
- QQ邮箱
- Outlook
- 自定义SMTP服务器
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header
import os
from typing import List, Optional
import json


class EmailSender:
    """邮件发送器类"""
    
    # 常用邮件服务提供商配置
    SMTP_CONFIGS = {
        'gmail': {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'use_tls': True
        },
        '163': {
            'smtp_server': 'smtp.163.com',
            'smtp_port': 25,
            'use_tls': True
        },
        'qq': {
            'smtp_server': 'smtp.qq.com',
            'smtp_port': 587,
            'use_tls': True
        },
        'outlook': {
            'smtp_server': 'smtp-mail.outlook.com',
            'smtp_port': 587,
            'use_tls': True
        }
    }
    
    def __init__(self, email: str, password: str, provider: str = 'custom', 
                 smtp_server: str = None, smtp_port: int = 587, use_tls: bool = True):
        """
        初始化邮件发送器
        
        Args:
            email: 发送者邮箱地址
            password: 邮箱密码或应用密码
            provider: 邮件服务提供商 ('gmail', '163', 'qq', 'outlook', 'custom')
            smtp_server: 自定义SMTP服务器地址 (当provider='custom'时使用)
            smtp_port: SMTP端口号
            use_tls: 是否使用TLS加密
        """
        self.email = email
        self.password = password
        
        if provider in self.SMTP_CONFIGS:
            config = self.SMTP_CONFIGS[provider]
            self.smtp_server = config['smtp_server']
            self.smtp_port = config['smtp_port']
            self.use_tls = config['use_tls']
        else:
            self.smtp_server = smtp_server
            self.smtp_port = smtp_port
            self.use_tls = use_tls
    
    def send_text_email(self, to_emails: List[str], subject: str, content: str) -> bool:
        """
        发送纯文本邮件
        
        Args:
            to_emails: 收件人邮箱列表
            subject: 邮件主题
            content: 邮件内容
            
        Returns:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 创建邮件对象
            msg = MIMEText(content, 'plain', 'utf-8')
            msg['From'] = Header(self.email, 'utf-8')
            msg['To'] = Header(', '.join(to_emails), 'utf-8')
            msg['Subject'] = Header(subject, 'utf-8')
            
            # 发送邮件
            return self._send_email(msg, to_emails)
            
        except Exception as e:
            print(f"发送纯文本邮件失败: {str(e)}")
            return False
    
    def send_html_email(self, to_emails: List[str], subject: str, html_content: str) -> bool:
        """
        发送HTML格式邮件
        
        Args:
            to_emails: 收件人邮箱列表
            subject: 邮件主题
            html_content: HTML格式的邮件内容
            
        Returns:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 创建邮件对象
            msg = MIMEText(html_content, 'html', 'utf-8')
            msg['From'] = Header(self.email, 'utf-8')
            msg['To'] = Header(', '.join(to_emails), 'utf-8')
            msg['Subject'] = Header(subject, 'utf-8')
            
            # 发送邮件
            return self._send_email(msg, to_emails)
            
        except Exception as e:
            print(f"发送HTML邮件失败: {str(e)}")
            return False
    
    def send_email_with_attachment(self, to_emails: List[str], subject: str, 
                                 content: str, attachments: List[str]) -> bool:
        """
        发送带附件的邮件
        
        Args:
            to_emails: 收件人邮箱列表
            subject: 邮件主题
            content: 邮件内容
            attachments: 附件文件路径列表
            
        Returns:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 创建多部分邮件对象
            msg = MIMEMultipart()
            msg['From'] = Header(self.email, 'utf-8')
            msg['To'] = Header(', '.join(to_emails), 'utf-8')
            msg['Subject'] = Header(subject, 'utf-8')
            
            # 添加邮件正文
            msg.attach(MIMEText(content, 'plain', 'utf-8'))
            
            # 添加附件
            for file_path in attachments:
                if os.path.isfile(file_path):
                    with open(file_path, 'rb') as attachment:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(attachment.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(file_path)}'
                    )
                    msg.attach(part)
                else:
                    print(f"警告: 附件文件不存在 - {file_path}")
            
            # 发送邮件
            return self._send_email(msg, to_emails)
            
        except Exception as e:
            print(f"发送带附件邮件失败: {str(e)}")
            return False
    
    def send_mixed_email(self, to_emails: List[str], subject: str, 
                        text_content: str, html_content: str, 
                        attachments: Optional[List[str]] = None) -> bool:
        """
        发送混合格式邮件（同时包含文本和HTML版本）
        
        Args:
            to_emails: 收件人邮箱列表
            subject: 邮件主题
            text_content: 纯文本内容
            html_content: HTML内容
            attachments: 附件文件路径列表（可选）
            
        Returns:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 创建多部分邮件对象
            msg = MIMEMultipart('alternative')
            msg['From'] = Header(self.email, 'utf-8')
            msg['To'] = Header(', '.join(to_emails), 'utf-8')
            msg['Subject'] = Header(subject, 'utf-8')
            
            # 创建文本和HTML部分
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            
            # 如果有附件，需要创建混合类型的容器
            if attachments:
                # 创建混合容器
                mixed_msg = MIMEMultipart('mixed')
                mixed_msg['From'] = msg['From']
                mixed_msg['To'] = msg['To']
                mixed_msg['Subject'] = msg['Subject']
                
                # 添加文本/HTML部分到混合容器
                msg.attach(text_part)
                msg.attach(html_part)
                mixed_msg.attach(msg)
                
                # 添加附件
                for file_path in attachments:
                    if os.path.isfile(file_path):
                        with open(file_path, 'rb') as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                        
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {os.path.basename(file_path)}'
                        )
                        mixed_msg.attach(part)
                    else:
                        print(f"警告: 附件文件不存在 - {file_path}")
                
                return self._send_email(mixed_msg, to_emails)
            else:
                # 没有附件，直接添加文本和HTML部分
                msg.attach(text_part)
                msg.attach(html_part)
                return self._send_email(msg, to_emails)
            
        except Exception as e:
            print(f"发送混合格式邮件失败: {str(e)}")
            return False
    
    def _send_email(self, msg, to_emails: List[str]) -> bool:
        """
        发送邮件的内部方法
        
        Args:
            msg: 邮件对象
            to_emails: 收件人邮箱列表
            
        Returns:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 创建SMTP连接
            if self.use_tls:
                # 创建安全连接
                context = ssl.create_default_context()
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls(context=context)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            
            # 登录
            server.login(self.email, self.password)
            
            # 发送邮件
            text = msg.as_string()
            server.sendmail(self.email, to_emails, text)
            server.quit()
            
            print(f"邮件发送成功! 收件人: {', '.join(to_emails)}")
            return True
            
        except Exception as e:
            print(f"邮件发送失败: {str(e)}")
            return False


def demo_text_email():
    """演示发送纯文本邮件"""
    print("\n=== 纯文本邮件演示 ===")
    
    # 邮件配置（请替换为你的实际邮箱信息）
    sender_email = "your_email@example.com"
    sender_password = "your_password"  # 注意：Gmail等需要使用应用密码
    
    # 创建邮件发送器（使用Gmail为例）
    email_sender = EmailSender(sender_email, sender_password, provider='gmail')
    
    # 邮件内容
    to_emails = ["recipient@example.com"]
    subject = "Python邮件测试 - 纯文本"
    content = """
    您好！
    
    这是一封使用Python发送的纯文本邮件。
    
    邮件功能测试内容：
    1. 中文字符显示测试
    2. 特殊符号测试：@#$%^&*()
    3. 数字测试：1234567890
    
    祝好！
    Python邮件发送程序
    """
    
    # 发送邮件
    success = email_sender.send_text_email(to_emails, subject, content)
    if success:
        print("纯文本邮件发送成功！")
    else:
        print("纯文本邮件发送失败！")


def demo_html_email():
    """演示发送HTML格式邮件"""
    print("\n=== HTML格式邮件演示 ===")
    
    # 邮件配置
    sender_email = "your_email@example.com"
    sender_password = "your_password"
    
    email_sender = EmailSender(sender_email, sender_password, provider='gmail')
    
    # HTML邮件内容
    to_emails = ["recipient@example.com"]
    subject = "Python邮件测试 - HTML格式"
    html_content = """
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
          .highlight { background-color: yellow; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🐍 Python邮件发送演示</h1>
        </div>
        
        <div class="content">
          <h2>欢迎使用Python邮件功能！</h2>
          
          <p>这是一封<span class="highlight">HTML格式</span>的邮件，展示了丰富的格式功能：</p>
          
          <h3>功能特性：</h3>
          <ul>
            <li><strong>粗体文本</strong></li>
            <li><em>斜体文本</em></li>
            <li><u>下划线文本</u></li>
            <li><a href="https://python.org">Python官网链接</a></li>
          </ul>
          
          <h3>数据表格：</h3>
          <table>
            <tr>
              <th>功能</th>
              <th>状态</th>
              <th>描述</th>
            </tr>
            <tr>
              <td>纯文本邮件</td>
              <td>✅ 支持</td>
              <td>基础文本邮件发送</td>
            </tr>
            <tr>
              <td>HTML邮件</td>
              <td>✅ 支持</td>
              <td>富文本格式邮件</td>
            </tr>
            <tr>
              <td>附件发送</td>
              <td>✅ 支持</td>
              <td>支持多种文件类型</td>
            </tr>
          </table>
          
          <h3>图片示例：</h3>
          <img src="https://via.placeholder.com/300x200/4CAF50/white?text=Python+Email" alt="Python Email" style="max-width: 100%; height: auto;">
          
          <blockquote style="border-left: 4px solid #4CAF50; margin: 16px 0; padding: 16px; background-color: #f9f9f9;">
            <p><strong>提示：</strong> 这是一个引用块，可以用来突出重要信息。</p>
          </blockquote>
        </div>
        
        <div class="footer">
          <p>© 2025 Python邮件发送程序 | 技术支持：Python SMTP库</p>
        </div>
      </body>
    </html>
    """
    
    # 发送邮件
    success = email_sender.send_html_email(to_emails, subject, html_content)
    if success:
        print("HTML邮件发送成功！")
    else:
        print("HTML邮件发送失败！")


def demo_attachment_email():
    """演示发送带附件的邮件"""
    print("\n=== 带附件邮件演示 ===")
    
    # 邮件配置
    sender_email = "your_email@example.com"
    sender_password = "your_password"
    
    email_sender = EmailSender(sender_email, sender_password, provider='gmail')
    
    # 创建示例文件作为附件
    sample_file = "/workspace/sample_attachment.txt"
    with open(sample_file, 'w', encoding='utf-8') as f:
        f.write("""这是一个示例附件文件

文件内容：
- 这是第一行
- 这是第二行
- 支持中文字符
- 创建时间：2025年

Python邮件附件功能测试完成！
""")
    
    # 邮件内容
    to_emails = ["recipient@example.com"]
    subject = "Python邮件测试 - 带附件"
    content = """
    您好！
    
    这封邮件包含了一个示例附件。
    
    附件信息：
    - 文件名：sample_attachment.txt
    - 文件类型：文本文件
    - 内容：包含中文的示例文本
    
    请查收附件！
    
    祝好！
    """
    
    attachments = [sample_file]
    
    # 发送邮件
    success = email_sender.send_email_with_attachment(to_emails, subject, content, attachments)
    if success:
        print("带附件邮件发送成功！")
    else:
        print("带附件邮件发送失败！")
    
    # 清理示例文件
    if os.path.exists(sample_file):
        os.remove(sample_file)
        print(f"清理示例文件: {sample_file}")


def demo_batch_email():
    """演示群发邮件"""
    print("\n=== 群发邮件演示 ===")
    
    # 邮件配置
    sender_email = "your_email@example.com"
    sender_password = "your_password"
    
    email_sender = EmailSender(sender_email, sender_password, provider='gmail')
    
    # 群发邮件列表
    to_emails = [
        "user1@example.com",
        "user2@example.com", 
        "user3@example.com"
    ]
    
    subject = "Python群发邮件测试"
    content = """
    尊敬的用户，
    
    这是一封群发邮件测试。
    
    群发功能特点：
    1. 支持同时发送给多个收件人
    2. 每个收件人都会收到相同的邮件内容
    3. 收件人地址会在邮件头中显示
    
    感谢您的关注！
    
    Python邮件系统
    """
    
    # 发送群发邮件
    success = email_sender.send_text_email(to_emails, subject, content)
    if success:
        print("群发邮件发送成功！")
    else:
        print("群发邮件发送失败！")


def create_email_config():
    """创建邮件配置文件"""
    print("\n=== 创建邮件配置文件 ===")
    
    config = {
        "email_settings": {
            "sender_email": "your_email@example.com",
            "sender_password": "your_password_or_app_password",
            "provider": "gmail",
            "custom_smtp": {
                "smtp_server": "smtp.example.com",
                "smtp_port": 587,
                "use_tls": True
            }
        },
        "common_providers": {
            "gmail": {
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "use_tls": True,
                "note": "需要启用两步验证并使用应用密码"
            },
            "163": {
                "smtp_server": "smtp.163.com", 
                "smtp_port": 25,
                "use_tls": True,
                "note": "需要在邮箱设置中开启SMTP服务"
            },
            "qq": {
                "smtp_server": "smtp.qq.com",
                "smtp_port": 587,
                "use_tls": True,
                "note": "需要获取授权码替代密码"
            },
            "outlook": {
                "smtp_server": "smtp-mail.outlook.com",
                "smtp_port": 587,
                "use_tls": True,
                "note": "支持Outlook.com和Hotmail.com"
            }
        },
        "usage_examples": {
            "text_email": "发送纯文本邮件",
            "html_email": "发送HTML格式邮件", 
            "attachment_email": "发送带附件邮件",
            "batch_email": "群发邮件"
        }
    }
    
    config_file = "/workspace/email_config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"邮件配置文件已创建: {config_file}")
    return config_file


def main():
    """主函数 - 演示所有功能"""
    print("🐍 Python邮件发送演示程序")
    print("=" * 50)
    
    print("\n📧 这个程序演示了Python发送邮件的各种功能：")
    print("1. 纯文本邮件")
    print("2. HTML格式邮件") 
    print("3. 带附件邮件")
    print("4. 群发邮件")
    print("5. 混合格式邮件")
    
    print("\n⚠️  使用前请注意：")
    print("1. 替换示例中的邮箱地址和密码")
    print("2. Gmail需要使用应用密码，不是账户密码")
    print("3. 某些邮箱需要先开启SMTP服务")
    print("4. 建议先测试发送给自己的邮箱")
    
    # 创建配置文件
    config_file = create_email_config()
    
    print(f"\n📋 配置文件已创建: {config_file}")
    print("请根据配置文件修改您的邮箱设置后运行演示。")
    
    # 注意：以下演示代码需要配置真实的邮箱信息才能运行
    # 取消注释下面的代码来运行演示：
    
    # demo_text_email()
    # demo_html_email() 
    # demo_attachment_email()
    # demo_batch_email()
    
    print("\n✅ 演示程序准备完成！")
    print("请修改邮箱配置后取消相关演示代码的注释来测试功能。")


if __name__ == "__main__":
    main()