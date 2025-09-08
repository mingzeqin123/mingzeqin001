#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL备份到阿里云OSS - 测试脚本
用于验证配置和连接是否正常
"""

import sys
import json
import logging
from mysql_backup_to_oss import MySQLBackupToOSS

def test_configuration():
    """测试配置文件"""
    print("=" * 60)
    print("MySQL备份到阿里云OSS - 配置测试")
    print("=" * 60)
    
    config_file = "backup_config.json"
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    
    try:
        # 初始化备份工具
        backup_tool = MySQLBackupToOSS(config_file)
        print("✓ 配置文件加载成功")
        
        # 测试MySQL连接
        print("\n1. 测试MySQL连接...")
        if backup_tool.test_mysql_connection():
            print("✓ MySQL连接测试成功")
        else:
            print("✗ MySQL连接测试失败")
            return False
        
        # 测试OSS连接
        print("\n2. 测试OSS连接...")
        try:
            # 尝试列出bucket信息
            bucket_info = backup_tool.bucket.get_bucket_info()
            print(f"✓ OSS连接测试成功")
            print(f"  - Bucket名称: {bucket_info.name}")
            print(f"  - 存储类型: {bucket_info.storage_class}")
            print(f"  - 创建时间: {bucket_info.creation_date}")
        except Exception as e:
            print(f"✗ OSS连接测试失败: {e}")
            return False
        
        # 测试权限
        print("\n3. 测试OSS权限...")
        try:
            test_key = "test_connection.txt"
            test_content = "This is a test file for backup connection."
            
            # 上传测试文件
            backup_tool.bucket.put_object(test_key, test_content)
            print("✓ OSS写入权限正常")
            
            # 读取测试文件
            result = backup_tool.bucket.get_object(test_key)
            if result.read().decode() == test_content:
                print("✓ OSS读取权限正常")
            
            # 删除测试文件
            backup_tool.bucket.delete_object(test_key)
            print("✓ OSS删除权限正常")
            
        except Exception as e:
            print(f"✗ OSS权限测试失败: {e}")
            return False
        
        # 显示配置摘要
        print("\n4. 配置摘要:")
        config = backup_tool.config
        print(f"  - MySQL主机: {config['mysql']['host']}:{config['mysql']['port']}")
        print(f"  - MySQL用户: {config['mysql']['user']}")
        print(f"  - 备份数据库: {', '.join(config['mysql'].get('databases', ['所有数据库']))}")
        print(f"  - OSS端点: {config['oss']['endpoint']}")
        print(f"  - OSS桶名: {config['oss']['bucket_name']}")
        print(f"  - 备份前缀: {config['oss'].get('prefix', 'mysql_backup')}")
        print(f"  - 压缩备份: {'是' if config.get('compress', True) else '否'}")
        print(f"  - 自动清理: {'是' if config.get('auto_cleanup', True) else '否'}")
        print(f"  - 保留天数: {config.get('retention_days', 30)}天")
        
        print("\n" + "=" * 60)
        print("✓ 所有测试通过! 配置正确，可以开始备份。")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return False

def main():
    """主函数"""
    success = test_configuration()
    
    if success:
        print("\n下一步操作:")
        print("1. 手动执行一次备份: python3 mysql_backup_to_oss.py")
        print("2. 设置定时任务: bash setup_cron.sh")
        print("3. 查看备份日志: tail -f /var/log/mysql_backup.log")
    else:
        print("\n请检查配置文件并修正错误后重新测试。")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()