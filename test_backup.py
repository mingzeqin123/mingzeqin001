#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL备份测试脚本
用于验证配置和连接是否正常
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def test_mysql_connection(config):
    """测试MySQL连接"""
    print("测试MySQL连接...")
    
    mysql_config = config['mysql']
    cmd = [
        'mysql',
        f'-h{mysql_config["host"]}',
        f'-P{mysql_config["port"]}',
        f'-u{mysql_config["username"]}',
        f'-p{mysql_config["password"]}',
        '-e', 'SELECT 1;'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ MySQL连接成功")
            return True
        else:
            print(f"❌ MySQL连接失败: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ MySQL连接超时")
        return False
    except FileNotFoundError:
        print("❌ 未找到mysql命令，请安装MySQL客户端")
        return False

def test_mysqldump(config):
    """测试mysqldump命令"""
    print("测试mysqldump命令...")
    
    mysql_config = config['mysql']
    cmd = [
        'mysqldump',
        f'--host={mysql_config["host"]}',
        f'--port={mysql_config["port"]}',
        f'--user={mysql_config["username"]}',
        f'--password={mysql_config["password"]}',
        '--version'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ mysqldump命令可用")
            print(f"版本信息: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ mysqldump命令失败: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ 未找到mysqldump命令，请安装MySQL客户端")
        return False

def test_oss_connection(config):
    """测试OSS连接"""
    print("测试阿里云OSS连接...")
    
    try:
        import oss2
        from oss2.credentials import EnvironmentVariableCredentialsProvider
        
        oss_config = config['oss']
        
        # 优先使用环境变量
        auth = oss2.ProviderAuth(
            EnvironmentVariableCredentialsProvider()
        )
        
        # 如果环境变量不存在，使用配置文件
        if not os.getenv('OSS_ACCESS_KEY_ID'):
            auth = oss2.Auth(oss_config['access_key_id'], oss_config['access_key_secret'])
        
        bucket = oss2.Bucket(
            auth,
            oss_config['endpoint'],
            oss_config['bucket_name']
        )
        
        # 测试连接
        bucket.get_bucket_info()
        print("✅ OSS连接成功")
        return True
        
    except ImportError:
        print("❌ 未安装oss2库，请运行: pip install oss2")
        return False
    except Exception as e:
        print(f"❌ OSS连接失败: {str(e)}")
        return False

def test_directories(config):
    """测试目录权限"""
    print("测试目录权限...")
    
    backup_dir = Path(config['backup']['local_backup_dir'])
    log_file = Path(config['logging']['file'])
    
    # 测试备份目录
    try:
        backup_dir.mkdir(parents=True, exist_ok=True)
        test_file = backup_dir / 'test_write.tmp'
        test_file.write_text('test')
        test_file.unlink()
        print(f"✅ 备份目录可写: {backup_dir}")
    except Exception as e:
        print(f"❌ 备份目录不可写: {e}")
        return False
    
    # 测试日志文件
    try:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, 'a') as f:
            f.write('test log entry\n')
        print(f"✅ 日志文件可写: {log_file}")
    except Exception as e:
        print(f"❌ 日志文件不可写: {e}")
        return False
    
    return True

def main():
    """主测试函数"""
    config_file = "backup_config.json"
    
    if not os.path.exists(config_file):
        print(f"❌ 配置文件不存在: {config_file}")
        print("请先运行 install.sh 创建配置文件")
        sys.exit(1)
    
    # 加载配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print("开始测试MySQL备份配置...")
    print("=" * 50)
    
    tests = [
        ("MySQL连接", lambda: test_mysql_connection(config)),
        ("mysqldump命令", lambda: test_mysqldump(config)),
        ("OSS连接", lambda: test_oss_connection(config)),
        ("目录权限", lambda: test_directories(config))
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
        print("-" * 30)
    
    print(f"\n测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 所有测试通过！备份配置正常")
        sys.exit(0)
    else:
        print("⚠️  部分测试失败，请检查配置")
        sys.exit(1)

if __name__ == "__main__":
    main()