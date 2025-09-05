#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mac Keychain 密码管理脚本
用于安全存储和获取邮箱密码
"""

import keyring
import getpass
import sys
import argparse


class KeychainManager:
    """Mac Keychain 管理器"""
    
    def __init__(self, service_name="EmailBot"):
        self.service_name = service_name
    
    def store_password(self, email_address):
        """存储邮箱密码到 Keychain"""
        try:
            print(f"为邮箱 {email_address} 设置密码")
            print("注意: 对于 Gmail，请使用应用密码而不是账户密码")
            print("应用密码生成方法: Google账户 -> 安全性 -> 两步验证 -> 应用密码")
            print()
            
            password = getpass.getpass("请输入邮箱密码或应用密码: ")
            
            if not password:
                print("密码不能为空")
                return False
            
            # 存储到 Keychain
            keyring.set_password(self.service_name, email_address, password)
            print(f"密码已安全存储到 macOS Keychain")
            return True
            
        except Exception as e:
            print(f"存储密码失败: {e}")
            return False
    
    def get_password(self, email_address):
        """从 Keychain 获取邮箱密码"""
        try:
            password = keyring.get_password(self.service_name, email_address)
            return password
        except Exception as e:
            print(f"获取密码失败: {e}")
            return None
    
    def delete_password(self, email_address):
        """从 Keychain 删除邮箱密码"""
        try:
            keyring.delete_password(self.service_name, email_address)
            print(f"已从 Keychain 删除邮箱 {email_address} 的密码")
            return True
        except Exception as e:
            print(f"删除密码失败: {e}")
            return False
    
    def list_stored_accounts(self):
        """列出已存储的邮箱账户"""
        # 注意: keyring 库没有直接的列表功能
        # 这里只是提供一个接口，实际使用时需要手动记录
        print("已存储的邮箱账户:")
        print("(需要手动记录，keyring 库不支持列表功能)")


def main():
    parser = argparse.ArgumentParser(description='Mac Keychain 邮箱密码管理')
    parser.add_argument('action', choices=['store', 'get', 'delete', 'list'], 
                       help='操作类型')
    parser.add_argument('--email', '-e', help='邮箱地址')
    
    args = parser.parse_args()
    
    manager = KeychainManager()
    
    if args.action == 'store':
        if not args.email:
            email = input("请输入邮箱地址: ")
        else:
            email = args.email
            
        if email:
            success = manager.store_password(email)
            sys.exit(0 if success else 1)
        else:
            print("邮箱地址不能为空")
            sys.exit(1)
            
    elif args.action == 'get':
        if not args.email:
            email = input("请输入邮箱地址: ")
        else:
            email = args.email
            
        if email:
            password = manager.get_password(email)
            if password:
                print(f"邮箱 {email} 的密码: {password}")
            else:
                print(f"未找到邮箱 {email} 的密码")
                sys.exit(1)
        else:
            print("邮箱地址不能为空")
            sys.exit(1)
            
    elif args.action == 'delete':
        if not args.email:
            email = input("请输入要删除的邮箱地址: ")
        else:
            email = args.email
            
        if email:
            confirm = input(f"确认删除邮箱 {email} 的密码? (y/N): ")
            if confirm.lower() == 'y':
                success = manager.delete_password(email)
                sys.exit(0 if success else 1)
            else:
                print("操作已取消")
        else:
            print("邮箱地址不能为空")
            sys.exit(1)
            
    elif args.action == 'list':
        manager.list_stored_accounts()


if __name__ == '__main__':
    main()