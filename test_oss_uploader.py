#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OSS上传工具测试脚本
"""

import os
import tempfile
from pathlib import Path
from oss_uploader import OSSUploader

def create_test_files():
    """创建测试文件"""
    test_dir = "test_files"
    os.makedirs(test_dir, exist_ok=True)
    
    # 创建不同类型的测试文件
    test_files = {
        "test.txt": "这是一个测试文本文件\n包含中文内容",
        "test.json": '{"name": "测试", "type": "json文件"}',
        "test.html": "<html><body><h1>测试HTML文件</h1></body></html>",
        "test.py": "#!/usr/bin/env python3\nprint('Hello, World!')",
        "test.md": "# 测试Markdown文件\n\n这是一个测试文档。"
    }
    
    created_files = []
    for filename, content in test_files.items():
        file_path = os.path.join(test_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        created_files.append(file_path)
        print(f"创建测试文件: {file_path}")
    
    return created_files, test_dir

def test_file_detection():
    """测试文件类型检测"""
    print("=== 测试文件类型检测 ===")
    
    # 创建测试文件
    test_files, test_dir = create_test_files()
    
    # 直接测试文件类型检测，不创建OSS连接
    from oss_uploader import OSSUploader
    
    # 创建一个临时的配置用于测试
    temp_config = {
        "access_key_id": "test",
        "access_key_secret": "test", 
        "endpoint": "https://test.oss.com",
        "bucket_name": "test-bucket"
    }
    
    # 创建上传器实例但不初始化OSS连接
    uploader = OSSUploader.__new__(OSSUploader)
    uploader.config = temp_config
    uploader.mime_type_map = OSSUploader(None)._mime_type_map if hasattr(OSSUploader(None), '_mime_type_map') else {}
    
    print("\n文件类型检测结果:")
    for file_path in test_files:
        extension, mime_type = uploader._detect_file_type(file_path)
        print(f"  {file_path}")
        print(f"    扩展名: {extension}")
        print(f"    MIME类型: {mime_type}")
        print()

def test_oss_key_generation():
    """测试OSS键名生成"""
    print("=== 测试OSS键名生成 ===")
    
    uploader = OSSUploader("oss_config.json")
    
    test_files = [
        "test.txt",
        "images/photo.jpg",
        "documents/report.pdf"
    ]
    
    print("OSS键名生成结果:")
    for file_path in test_files:
        oss_key = uploader._generate_oss_key(file_path, "test/")
        print(f"  {file_path} -> {oss_key}")

def test_config_validation():
    """测试配置验证"""
    print("=== 测试配置验证 ===")
    
    # 测试默认配置创建
    config_file = "test_config.json"
    if os.path.exists(config_file):
        os.remove(config_file)
    
    try:
        uploader = OSSUploader(config_file)
        print("配置验证失败 - 应该创建默认配置文件")
    except SystemExit:
        print("配置验证成功 - 创建了默认配置文件")
    
    # 清理测试配置文件
    if os.path.exists(config_file):
        os.remove(config_file)

def cleanup_test_files():
    """清理测试文件"""
    import shutil
    
    test_dir = "test_files"
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"清理测试目录: {test_dir}")

def main():
    """主测试函数"""
    print("OSS上传工具测试")
    print("=" * 50)
    
    try:
        # 测试配置验证
        test_config_validation()
        print()
        
        # 测试文件类型检测
        test_file_detection()
        
        # 测试OSS键名生成
        test_oss_key_generation()
        print()
        
        print("所有测试完成!")
        print("\n注意: 要测试实际上传功能，请:")
        print("1. 配置正确的 oss_config.json 文件")
        print("2. 运行: python oss_uploader.py --files test_files/test.txt")
        
    finally:
        # 清理测试文件
        cleanup_test_files()

if __name__ == "__main__":
    main()