#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OSS上传工具快速启动脚本
帮助用户快速配置和测试OSS上传功能
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def print_banner():
    """打印欢迎横幅"""
    print("=" * 60)
    print("🚀 OSS批量文件上传工具 - 快速启动")
    print("=" * 60)
    print()

def check_dependencies():
    """检查依赖包"""
    print("📦 检查依赖包...")
    
    required_packages = ['oss2', 'tqdm']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ❌ {package} (缺失)")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  缺少依赖包: {', '.join(missing_packages)}")
        print("请运行: pip3 install -r requirements.txt")
        return False
    
    print("  ✓ 所有依赖包已安装")
    return True

def create_sample_config():
    """创建示例配置文件"""
    print("\n📝 创建示例配置文件...")
    
    config_file = "oss_config.json"
    
    if os.path.exists(config_file):
        print(f"  ✓ 配置文件 {config_file} 已存在")
        return True
    
    sample_config = {
        "access_key_id": "your_access_key_id",
        "access_key_secret": "your_access_key_secret",
        "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
        "bucket_name": "your_bucket_name",
        "upload_prefix": "uploads/",
        "overwrite": False,
        "max_retries": 3,
        "chunk_size": 8192
    }
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(sample_config, f, indent=4, ensure_ascii=False)
    
    print(f"  ✓ 已创建示例配置文件: {config_file}")
    print("  ⚠️  请编辑配置文件，填入你的阿里云OSS信息")
    return True

def create_demo_files():
    """创建演示文件"""
    print("\n📁 创建演示文件...")
    
    demo_dir = "demo_uploads"
    os.makedirs(demo_dir, exist_ok=True)
    
    demo_files = {
        "sample.txt": "这是一个演示文本文件\n用于测试OSS上传功能\n\n创建时间: 2024年",
        "data.json": '{\n  "name": "OSS上传工具演示",\n  "version": "1.0.0",\n  "features": [\n    "批量上传",\n    "自动检测文件类型",\n    "支持多种文件格式"\n  ]\n}',
        "readme.md": "# OSS上传工具演示\n\n这是一个Markdown文档，用于演示文件类型自动检测功能。\n\n## 功能特性\n\n- 批量上传文件\n- 自动识别文件类型\n- 支持多种文件格式\n- 实时进度显示\n\n## 使用方法\n\n```bash\npython3 oss_uploader.py --files demo_uploads/sample.txt\n```"
    }
    
    created_files = []
    for filename, content in demo_files.items():
        file_path = os.path.join(demo_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        created_files.append(file_path)
        print(f"  ✓ 创建: {file_path}")
    
    return created_files, demo_dir

def test_file_detection():
    """测试文件类型检测"""
    print("\n🔍 测试文件类型检测...")
    
    try:
        from oss_uploader import OSSUploader
        
        # 创建临时配置用于测试
        temp_config = {
            "access_key_id": "test",
            "access_key_secret": "test",
            "endpoint": "https://test.oss.com",
            "bucket_name": "test-bucket"
        }
        
        # 创建上传器实例
        uploader = OSSUploader.__new__(OSSUploader)
        uploader.config = temp_config
        uploader.mime_type_map = {
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.md': 'text/markdown',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf'
        }
        
        # 测试文件
        test_files = ["demo_uploads/sample.txt", "demo_uploads/data.json", "demo_uploads/readme.md"]
        
        for file_path in test_files:
            if os.path.exists(file_path):
                extension, mime_type = uploader._detect_file_type(file_path)
                print(f"  ✓ {os.path.basename(file_path)}: {extension} -> {mime_type}")
        
        print("  ✓ 文件类型检测功能正常")
        return True
        
    except Exception as e:
        print(f"  ❌ 文件类型检测测试失败: {e}")
        return False

def show_usage_examples():
    """显示使用示例"""
    print("\n📚 使用示例:")
    print()
    
    examples = [
        ("上传指定文件", "python3 oss_uploader.py --files demo_uploads/sample.txt demo_uploads/data.json"),
        ("上传整个目录", "python3 oss_uploader.py --directory demo_uploads"),
        ("只上传特定类型", "python3 oss_uploader.py --directory demo_uploads --extensions .txt .json"),
        ("使用自定义前缀", "python3 oss_uploader.py --files demo_uploads/sample.txt --prefix 'test/2024/'"),
        ("查看帮助", "python3 oss_uploader.py --help")
    ]
    
    for i, (desc, cmd) in enumerate(examples, 1):
        print(f"  {i}. {desc}:")
        print(f"     {cmd}")
        print()

def check_config_status():
    """检查配置状态"""
    print("\n⚙️  检查配置状态...")
    
    config_file = "oss_config.json"
    
    if not os.path.exists(config_file):
        print(f"  ❌ 配置文件 {config_file} 不存在")
        return False
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        required_keys = ['access_key_id', 'access_key_secret', 'endpoint', 'bucket_name']
        missing_keys = []
        
        for key in required_keys:
            if not config.get(key) or config[key] == f"your_{key}":
                missing_keys.append(key)
        
        if missing_keys:
            print(f"  ⚠️  需要配置: {', '.join(missing_keys)}")
            print(f"  📝 请编辑 {config_file} 文件")
            return False
        else:
            print(f"  ✓ 配置文件 {config_file} 已正确配置")
            return True
            
    except Exception as e:
        print(f"  ❌ 配置文件格式错误: {e}")
        return False

def main():
    """主函数"""
    print_banner()
    
    # 检查依赖
    if not check_dependencies():
        print("\n❌ 请先安装依赖包")
        return
    
    # 创建示例配置
    create_sample_config()
    
    # 创建演示文件
    demo_files, demo_dir = create_demo_files()
    
    # 测试文件类型检测
    test_file_detection()
    
    # 检查配置状态
    config_ready = check_config_status()
    
    # 显示使用示例
    show_usage_examples()
    
    # 总结
    print("🎉 快速启动完成!")
    print()
    
    if config_ready:
        print("✅ 所有配置已完成，可以开始使用OSS上传工具")
        print(f"📁 演示文件已创建在 {demo_dir} 目录中")
        print("\n🚀 立即开始:")
        print(f"   python3 oss_uploader.py --files {demo_dir}/sample.txt")
    else:
        print("⚠️  请先配置 oss_config.json 文件中的阿里云OSS信息")
        print("📖 详细说明请查看 setup_guide.md")
    
    print("\n📚 更多信息:")
    print("   - 详细文档: README_OSS_UPLOADER.md")
    print("   - 设置指南: setup_guide.md")
    print("   - 功能测试: python3 simple_test.py")

if __name__ == "__main__":
    main()