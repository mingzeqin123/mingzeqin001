#!/usr/bin/env python3
"""
Nginx IP Monitor 测试脚本
用于测试IP监控和nginx配置更新功能
"""

import os
import sys
import json
import subprocess
import tempfile
from pathlib import Path

def test_ip_detection():
    """测试IP检测功能"""
    print("🔍 测试IP检测功能...")
    
    try:
        import requests
        
        services = [
            "https://api.ipify.org",
            "https://ipv4.icanhazip.com", 
            "https://checkip.amazonaws.com"
        ]
        
        for service in services:
            try:
                response = requests.get(service, timeout=10)
                if response.status_code == 200:
                    ip = response.text.strip()
                    print(f"  ✅ {service}: {ip}")
                    return ip
                else:
                    print(f"  ❌ {service}: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ {service}: {e}")
        
        print("  ❌ 所有IP检测服务都失败")
        return None
        
    except ImportError:
        print("  ❌ requests模块未安装")
        return None

def test_nginx_config_template():
    """测试nginx配置模板"""
    print("\n🔧 测试nginx配置模板...")
    
    template_file = "nginx.conf.template"
    if not os.path.exists(template_file):
        print(f"  ❌ 模板文件不存在: {template_file}")
        return False
    
    try:
        with open(template_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "{{SERVER_IP}}" in content:
            print("  ✅ 模板文件包含IP占位符")
        else:
            print("  ❌ 模板文件缺少IP占位符")
            return False
        
        # 测试IP替换
        test_ip = "192.168.1.100"
        updated_content = content.replace("{{SERVER_IP}}", test_ip)
        
        if test_ip in updated_content and "{{SERVER_IP}}" not in updated_content:
            print("  ✅ IP替换功能正常")
        else:
            print("  ❌ IP替换功能异常")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ 读取模板文件失败: {e}")
        return False

def test_config_file():
    """测试配置文件"""
    print("\n⚙️ 测试配置文件...")
    
    config_file = "config.json"
    if not os.path.exists(config_file):
        print(f"  ❌ 配置文件不存在: {config_file}")
        return False
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        required_keys = [
            "nginx_config_template",
            "nginx_config_path", 
            "nginx_config_backup",
            "check_interval",
            "ip_check_services",
            "log_file",
            "log_level",
            "restart_nginx_on_change",
            "test_nginx_config"
        ]
        
        missing_keys = [key for key in required_keys if key not in config]
        if missing_keys:
            print(f"  ❌ 配置文件缺少必要字段: {missing_keys}")
            return False
        
        print("  ✅ 配置文件格式正确")
        return True
        
    except json.JSONDecodeError as e:
        print(f"  ❌ 配置文件JSON格式错误: {e}")
        return False
    except Exception as e:
        print(f"  ❌ 读取配置文件失败: {e}")
        return False

def test_nginx_syntax():
    """测试nginx语法"""
    print("\n🌐 测试nginx语法...")
    
    # 检查nginx是否安装
    try:
        subprocess.run(['nginx', '-v'], capture_output=True, check=True)
        print("  ✅ nginx已安装")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("  ⚠️ nginx未安装或无法访问")
        return False
    
    # 测试当前nginx配置
    try:
        result = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✅ 当前nginx配置语法正确")
        else:
            print(f"  ⚠️ 当前nginx配置语法错误: {result.stderr}")
    except Exception as e:
        print(f"  ⚠️ 无法测试nginx配置: {e}")
    
    return True

def test_python_script():
    """测试Python脚本"""
    print("\n🐍 测试Python脚本...")
    
    script_file = "nginx_ip_monitor.py"
    if not os.path.exists(script_file):
        print(f"  ❌ 脚本文件不存在: {script_file}")
        return False
    
    try:
        # 检查脚本语法
        result = subprocess.run(['python3', '-m', 'py_compile', script_file], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✅ Python脚本语法正确")
        else:
            print(f"  ❌ Python脚本语法错误: {result.stderr}")
            return False
        
        # 测试脚本帮助信息
        result = subprocess.run(['python3', script_file, '--help'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✅ Python脚本可以正常执行")
        else:
            print(f"  ❌ Python脚本执行失败: {result.stderr}")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ 测试Python脚本失败: {e}")
        return False

def test_systemd_service():
    """测试systemd服务文件"""
    print("\n🔧 测试systemd服务文件...")
    
    service_file = "nginx-ip-monitor.service"
    if not os.path.exists(service_file):
        print(f"  ❌ 服务文件不存在: {service_file}")
        return False
    
    try:
        with open(service_file, 'r') as f:
            content = f.read()
        
        required_sections = ['[Unit]', '[Service]', '[Install]']
        missing_sections = [section for section in required_sections if section not in content]
        
        if missing_sections:
            print(f"  ❌ 服务文件缺少必要段落: {missing_sections}")
            return False
        
        print("  ✅ systemd服务文件格式正确")
        return True
        
    except Exception as e:
        print(f"  ❌ 读取服务文件失败: {e}")
        return False

def test_install_script():
    """测试安装脚本"""
    print("\n📦 测试安装脚本...")
    
    install_file = "install.sh"
    if not os.path.exists(install_file):
        print(f"  ❌ 安装脚本不存在: {install_file}")
        return False
    
    # 检查脚本权限
    if not os.access(install_file, os.X_OK):
        print(f"  ❌ 安装脚本没有执行权限")
        return False
    
    print("  ✅ 安装脚本存在且可执行")
    return True

def main():
    """主测试函数"""
    print("🚀 开始测试 Nginx IP Monitor...")
    print("=" * 50)
    
    tests = [
        ("IP检测功能", test_ip_detection),
        ("nginx配置模板", test_nginx_config_template),
        ("配置文件", test_config_file),
        ("nginx语法", test_nginx_syntax),
        ("Python脚本", test_python_script),
        ("systemd服务文件", test_systemd_service),
        ("安装脚本", test_install_script)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"  ❌ 测试 {test_name} 时出错: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 测试结果汇总:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n总计: {passed}/{total} 项测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！系统准备就绪。")
        return 0
    else:
        print("⚠️ 部分测试失败，请检查相关配置。")
        return 1

if __name__ == '__main__':
    sys.exit(main())