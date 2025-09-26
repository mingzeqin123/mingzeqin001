#!/usr/bin/env python3
"""
用户注册系统演示脚本
演示密码生成和邮件模板功能
"""

import secrets
import string
import hashlib
from datetime import datetime

class PasswordGenerator:
    """随机密码生成器演示"""
    
    @staticmethod
    def generate_password(length=12):
        """生成指定长度的随机密码"""
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        special_chars = "!@#$%^&*"
        
        # 确保密码包含每种类型的字符
        password = [
            secrets.choice(uppercase),
            secrets.choice(lowercase),
            secrets.choice(digits),
            secrets.choice(special_chars)
        ]
        
        # 填充剩余长度
        all_chars = uppercase + lowercase + digits + special_chars
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # 打乱密码字符顺序
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)

def demo_password_generation():
    """演示密码生成功能"""
    print("🔐 密码生成演示")
    print("=" * 40)
    
    for i in range(5):
        password = PasswordGenerator.generate_password()
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        print(f"密码 {i+1}: {password}")
        print(f"哈希值: {password_hash[:32]}...")
        print()

def demo_email_template():
    """演示邮件模板"""
    print("📧 邮件模板演示")
    print("=" * 40)
    
    # 示例数据
    username = "张三"
    password = PasswordGenerator.generate_password()
    login_url = "https://yourplatform.com/login"
    platform_name = "示例平台"
    
    print("邮件内容预览:")
    print(f"收件人: {username}")
    print(f"用户名: {username}")
    print(f"密码: {password}")
    print(f"登录地址: {login_url}")
    print()
    
    # 简化的文本版邮件内容
    email_content = f"""
欢迎加入{platform_name}！

亲爱的 {username}，

恭喜您成功注册{platform_name}！我们很高兴您加入我们的平台。

您的登录信息：
用户名：{username}
临时密码：{password}
登录地址：{login_url}

重要提醒：
• 请妥善保管您的登录信息
• 建议您首次登录后立即修改密码
• 请勿将账号信息泄露给他人

如果您有任何疑问，请随时联系我们的客服团队。

祝您使用愉快！
{platform_name} 团队

此邮件由系统自动发送，请勿回复。
"""
    
    print("文本版邮件内容:")
    print("-" * 40)
    print(email_content)

def demo_user_registration_flow():
    """演示完整的用户注册流程"""
    print("🚀 用户注册流程演示")
    print("=" * 40)
    
    # 模拟用户数据
    users = [
        {"username": "user001", "email": "user001@example.com"},
        {"username": "张小明", "email": "zhangxm@example.com"},
        {"username": "admin", "email": "admin@company.com"}
    ]
    
    for i, user_data in enumerate(users, 1):
        print(f"注册用户 {i}:")
        print(f"  用户名: {user_data['username']}")
        print(f"  邮箱: {user_data['email']}")
        
        # 生成密码
        password = PasswordGenerator.generate_password()
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        print(f"  生成密码: {password}")
        print(f"  密码哈希: {password_hash[:16]}...")
        
        # 模拟数据库存储
        print(f"  ✅ 用户信息已保存到数据库")
        
        # 模拟邮件发送
        print(f"  📧 欢迎邮件已发送至: {user_data['email']}")
        
        print(f"  ⏰ 注册时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

def demo_security_features():
    """演示安全特性"""
    print("🔒 安全特性演示")
    print("=" * 40)
    
    print("1. 密码复杂度检查:")
    password = PasswordGenerator.generate_password()
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*" for c in password)
    
    print(f"   密码: {password}")
    print(f"   包含大写字母: {'✅' if has_upper else '❌'}")
    print(f"   包含小写字母: {'✅' if has_lower else '❌'}")
    print(f"   包含数字: {'✅' if has_digit else '❌'}")
    print(f"   包含特殊字符: {'✅' if has_special else '❌'}")
    print()
    
    print("2. 用户名冲突检测演示:")
    existing_users = ["admin", "user001", "test"]
    new_usernames = ["admin", "user002", "user001", "newuser"]
    
    for username in new_usernames:
        if username in existing_users:
            print(f"   {username}: ❌ 用户名已存在")
        else:
            print(f"   {username}: ✅ 用户名可用")
    print()
    
    print("3. 邮箱格式验证演示:")
    test_emails = [
        "valid@example.com",
        "invalid-email",
        "user@domain",
        "@example.com",
        "user@example.co.uk"
    ]
    
    for email in test_emails:
        is_valid = "@" in email and "." in email and email.count("@") == 1
        print(f"   {email}: {'✅' if is_valid else '❌'}")

def main():
    """主演示函数"""
    print("🎭 用户注册系统功能演示")
    print("=" * 50)
    print(f"演示时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 运行各项演示
    demo_password_generation()
    print()
    
    demo_user_registration_flow()
    print()
    
    demo_security_features()
    print()
    
    demo_email_template()
    print()
    
    print("=" * 50)
    print("✨ 演示完成！")
    print()
    print("💡 要运行完整的注册系统，请执行:")
    print("   python3 simple_app.py")
    print()
    print("🌐 然后在浏览器中访问:")
    print("   http://localhost:8000")
    print("=" * 50)

if __name__ == '__main__':
    main()