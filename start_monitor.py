#!/usr/bin/env python3
"""
服务器监控系统启动脚本
自动检查依赖、创建配置、启动服务
"""

import os
import sys
import subprocess
import importlib
import json
from pathlib import Path


def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 7):
        print("❌ 错误: 需要Python 3.7或更高版本")
        print(f"当前版本: {sys.version}")
        return False
    print(f"✅ Python版本检查通过: {sys.version_info.major}.{sys.version_info.minor}")
    return True


def check_dependencies():
    """检查并安装依赖"""
    required_packages = [
        'psutil',
        'flask',
        'flask_cors',
        'aiohttp'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            importlib.import_module(package.replace('-', '_'))
            print(f"✅ {package} 已安装")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} 未安装")
    
    if missing_packages:
        print(f"\n正在安装缺失的依赖包: {', '.join(missing_packages)}")
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
            ])
            print("✅ 依赖安装完成")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ 依赖安装失败: {e}")
            print("请手动运行: pip install -r requirements.txt")
            return False
    
    return True


def create_directories():
    """创建必要的目录"""
    directories = [
        'templates',
        'static',
        'static/css',
        'static/js',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ 目录已创建: {directory}")


def check_config_files():
    """检查配置文件"""
    config_files = {
        'servers_config.json': '服务器配置文件',
        'templates/dashboard.html': 'Web界面模板',
        'static/css/dashboard.css': '样式文件',
        'static/js/dashboard.js': 'JavaScript文件'
    }
    
    missing_files = []
    
    for file_path, description in config_files.items():
        if os.path.exists(file_path):
            print(f"✅ {description}: {file_path}")
        else:
            missing_files.append((file_path, description))
            print(f"❌ 缺失 {description}: {file_path}")
    
    return len(missing_files) == 0


def create_example_config():
    """创建示例配置文件"""
    if not os.path.exists('example_servers_config.json'):
        from config import create_example_config
        create_example_config()
        print("✅ 已创建示例配置文件: example_servers_config.json")


def show_startup_info():
    """显示启动信息"""
    print("\n" + "="*60)
    print("🚀 服务器监控系统")
    print("="*60)
    print("📊 功能特性:")
    print("  • 实时监控 CPU、内存、磁盘、网络")
    print("  • 支持多服务器监控")
    print("  • 现代化Web界面")
    print("  • 告警系统")
    print("  • 历史数据分析")
    print("\n🌐 访问地址:")
    print("  • 监控大屏: http://localhost:5000")
    print("  • API文档: http://localhost:5000/api/health")
    print("\n📝 配置文件:")
    print("  • servers_config.json - 服务器配置")
    print("  • example_servers_config.json - 配置示例")
    print("\n🔧 管理命令:")
    print("  • Ctrl+C - 停止服务")
    print("  • 查看日志了解运行状态")
    print("="*60)


def main():
    """主函数"""
    print("🔍 正在检查系统环境...")
    
    # 检查Python版本
    if not check_python_version():
        sys.exit(1)
    
    # 检查依赖
    if not check_dependencies():
        print("\n❌ 依赖检查失败，请先安装所需依赖")
        sys.exit(1)
    
    # 创建目录
    create_directories()
    
    # 检查配置文件
    if not check_config_files():
        print("\n⚠️  部分文件缺失，但系统仍可运行")
    
    # 创建示例配置
    create_example_config()
    
    # 显示启动信息
    show_startup_info()
    
    # 启动服务器
    print("\n🚀 正在启动监控服务...")
    try:
        # 导入并启动API服务器
        from api_server import main as start_api_server
        start_api_server()
    except KeyboardInterrupt:
        print("\n\n👋 服务已停止")
    except Exception as e:
        print(f"\n❌ 启动失败: {e}")
        print("请检查错误信息并重试")
        sys.exit(1)


if __name__ == "__main__":
    main()