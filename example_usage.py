#!/usr/bin/env python3
"""
Nginx IP Monitor 使用示例
演示如何使用nginx_ip_monitor模块
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nginx_ip_monitor import NginxIPMonitor

def example_basic_usage():
    """基本使用示例"""
    print("=== 基本使用示例 ===")
    
    # 创建临时配置文件用于测试
    import json
    temp_config = {
        "nginx_config_template": "nginx.conf.template",
        "nginx_config_path": "/tmp/test_nginx.conf",
        "nginx_config_backup": "/tmp/test_nginx.conf.backup",
        "check_interval": 60,
        "ip_check_services": [
            "https://api.ipify.org",
            "https://ipv4.icanhazip.com",
            "https://checkip.amazonaws.com"
        ],
        "log_file": "/tmp/nginx-ip-monitor.log",
        "log_level": "INFO",
        "restart_nginx_on_change": False,  # 测试时不重启nginx
        "test_nginx_config": False,  # 测试时不测试nginx
        "email_notifications": {
            "enabled": False
        }
    }
    
    with open('temp_config.json', 'w') as f:
        json.dump(temp_config, f)
    
    # 创建监控器实例
    monitor = NginxIPMonitor('temp_config.json')
    
    # 执行一次检查
    print("执行一次IP检查...")
    success = monitor.run_once()
    
    if success:
        print("✅ IP检查成功")
    else:
        print("❌ IP检查失败")
    
    # 清理临时文件
    os.remove('temp_config.json')
    
    return success

def example_custom_config():
    """自定义配置示例"""
    print("\n=== 自定义配置示例 ===")
    
    # 创建自定义配置
    custom_config = {
        "nginx_config_template": "nginx.conf.template",
        "nginx_config_path": "/tmp/test_nginx.conf",
        "nginx_config_backup": "/tmp/test_nginx.conf.backup",
        "check_interval": 30,  # 30秒检查一次
        "log_level": "DEBUG",
        "log_file": "/tmp/nginx-ip-monitor.log",
        "restart_nginx_on_change": False,  # 不自动重启nginx
        "test_nginx_config": False,
        "ip_check_services": [
            "https://api.ipify.org",
            "https://ipv4.icanhazip.com"
        ],
        "email_notifications": {
            "enabled": False
        }
    }
    
    # 保存自定义配置
    import json
    with open('custom_config.json', 'w') as f:
        json.dump(custom_config, f, indent=2)
    
    print("自定义配置已保存到 custom_config.json")
    
    # 使用自定义配置创建监控器
    monitor = NginxIPMonitor('custom_config.json')
    
    # 获取当前IP
    current_ip = monitor.get_current_ip()
    print(f"当前IP: {current_ip}")
    
    # 清理临时文件
    os.remove('custom_config.json')
    
    return current_ip

def example_manual_nginx_update():
    """手动更新nginx配置示例"""
    print("\n=== 手动更新nginx配置示例 ===")
    
    # 使用临时配置
    import json
    temp_config = {
        "nginx_config_template": "nginx.conf.template",
        "nginx_config_path": "/tmp/test_nginx.conf",
        "nginx_config_backup": "/tmp/test_nginx.conf.backup",
        "check_interval": 60,
        "ip_check_services": [
            "https://api.ipify.org",
            "https://ipv4.icanhazip.com",
            "https://checkip.amazonaws.com"
        ],
        "log_file": "/tmp/nginx-ip-monitor.log",
        "log_level": "INFO",
        "restart_nginx_on_change": False,
        "test_nginx_config": False,
        "email_notifications": {
            "enabled": False
        }
    }
    
    with open('temp_config2.json', 'w') as f:
        json.dump(temp_config, f)
    
    monitor = NginxIPMonitor('temp_config2.json')
    
    # 获取当前IP
    current_ip = monitor.get_current_ip()
    if not current_ip:
        print("❌ 无法获取当前IP")
        os.remove('temp_config2.json')
        return False
    
    print(f"当前IP: {current_ip}")
    
    # 手动更新nginx配置
    print("更新nginx配置...")
    success = monitor.update_nginx_config(current_ip)
    
    if success:
        print("✅ nginx配置更新成功")
        
        # 显示生成的配置内容
        if os.path.exists('/tmp/test_nginx.conf'):
            with open('/tmp/test_nginx.conf', 'r') as f:
                content = f.read()
                if current_ip in content:
                    print("✅ 配置文件中包含正确的IP地址")
                else:
                    print("❌ 配置文件中IP地址不正确")
    else:
        print("❌ nginx配置更新失败")
    
    # 清理临时文件
    os.remove('temp_config2.json')
    if os.path.exists('/tmp/test_nginx.conf'):
        os.remove('/tmp/test_nginx.conf')
    if os.path.exists('/tmp/test_nginx.conf.backup'):
        os.remove('/tmp/test_nginx.conf.backup')
    
    return success

def example_ip_validation():
    """IP验证示例"""
    print("\n=== IP验证示例 ===")
    
    # 使用临时配置
    import json
    temp_config = {
        "nginx_config_template": "nginx.conf.template",
        "nginx_config_path": "/tmp/test_nginx.conf",
        "nginx_config_backup": "/tmp/test_nginx.conf.backup",
        "check_interval": 60,
        "ip_check_services": [
            "https://api.ipify.org",
            "https://ipv4.icanhazip.com",
            "https://checkip.amazonaws.com"
        ],
        "log_file": "/tmp/nginx-ip-monitor.log",
        "log_level": "INFO",
        "restart_nginx_on_change": False,
        "test_nginx_config": False,
        "email_notifications": {
            "enabled": False
        }
    }
    
    with open('temp_config3.json', 'w') as f:
        json.dump(temp_config, f)
    
    monitor = NginxIPMonitor('temp_config3.json')
    
    # 测试有效IP
    valid_ips = ["192.168.1.1", "8.8.8.8", "127.0.0.1"]
    for ip in valid_ips:
        is_valid = monitor.is_valid_ip(ip)
        print(f"IP {ip}: {'✅ 有效' if is_valid else '❌ 无效'}")
    
    # 测试无效IP
    invalid_ips = ["256.1.1.1", "192.168.1", "not.an.ip", ""]
    for ip in invalid_ips:
        is_valid = monitor.is_valid_ip(ip)
        print(f"IP '{ip}': {'✅ 有效' if is_valid else '❌ 无效'}")
    
    # 清理临时文件
    os.remove('temp_config3.json')

def main():
    """主函数"""
    print("🚀 Nginx IP Monitor 使用示例")
    print("=" * 50)
    
    try:
        # 基本使用
        example_basic_usage()
        
        # 自定义配置
        example_custom_config()
        
        # 手动更新nginx配置
        example_manual_nginx_update()
        
        # IP验证
        example_ip_validation()
        
        print("\n" + "=" * 50)
        print("✅ 所有示例执行完成")
        
    except Exception as e:
        print(f"\n❌ 示例执行出错: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())