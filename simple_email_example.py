#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的Python邮件发送示例
Simple Python Email Sending Example
"""

from email_demo import EmailSender

def send_simple_email():
    """发送简单邮件的示例"""
    
    # 1. 配置邮箱信息（请替换为你的实际信息）
    sender_email = "your_email@gmail.com"          # 你的邮箱地址
    sender_password = "your_app_password"          # 你的邮箱密码或应用密码
    
    # 2. 创建邮件发送器
    email_sender = EmailSender(
        email=sender_email,
        password=sender_password,
        provider='gmail'  # 支持: 'gmail', '163', 'qq', 'outlook'
    )
    
    # 3. 设置邮件内容
    to_emails = ["recipient@example.com"]  # 收件人邮箱列表
    subject = "Python邮件测试"              # 邮件主题
    content = """
    你好！
    
    这是使用Python发送的测试邮件。
    
    如果你收到这封邮件，说明邮件发送功能正常工作！
    
    祝好！
    """
    
    # 4. 发送邮件
    success = email_sender.send_text_email(to_emails, subject, content)
    
    if success:
        print("✅ 邮件发送成功！")
    else:
        print("❌ 邮件发送失败！")

def send_html_email_example():
    """发送HTML邮件的示例"""
    
    # 配置信息
    sender_email = "your_email@gmail.com"
    sender_password = "your_app_password"
    
    email_sender = EmailSender(sender_email, sender_password, provider='gmail')
    
    # HTML邮件内容
    to_emails = ["recipient@example.com"]
    subject = "Python HTML邮件测试"
    html_content = """
    <html>
    <body>
        <h2 style="color: #4CAF50;">🐍 Python邮件测试</h2>
        
        <p>你好！</p>
        
        <p>这是一封<strong>HTML格式</strong>的邮件，支持：</p>
        <ul>
            <li><strong>粗体文本</strong></li>
            <li><em>斜体文本</em></li>
            <li><span style="color: red;">彩色文本</span></li>
            <li><a href="https://python.org">链接</a></li>
        </ul>
        
        <div style="background-color: #f0f0f0; padding: 10px; margin: 10px 0;">
            <p><strong>提示：</strong> HTML邮件可以包含丰富的格式和样式！</p>
        </div>
        
        <p>祝好！<br>Python邮件程序</p>
    </body>
    </html>
    """
    
    success = email_sender.send_html_email(to_emails, subject, html_content)
    
    if success:
        print("✅ HTML邮件发送成功！")
    else:
        print("❌ HTML邮件发送失败！")

if __name__ == "__main__":
    print("🐍 Python邮件发送简单示例")
    print("=" * 40)
    
    print("\n请先修改邮箱配置信息：")
    print("1. 将 'your_email@gmail.com' 替换为你的邮箱")
    print("2. 将 'your_app_password' 替换为你的邮箱密码")
    print("3. 将收件人邮箱替换为实际的收件人地址")
    
    print("\n然后取消下面代码的注释来测试：")
    print("# send_simple_email()")
    print("# send_html_email_example()")
    
    # 取消注释来运行测试：
    # send_simple_email()
    # send_html_email_example()