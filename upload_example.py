#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OSS上传工具使用示例
"""

from oss_uploader import OSSUploader
import os

def example_upload_files():
    """示例：上传指定文件"""
    print("=== 上传指定文件示例 ===")
    
    # 创建上传器
    uploader = OSSUploader("oss_config.json")
    
    # 要上传的文件列表
    files_to_upload = [
        "README.md",
        "requirements.txt",
        "app.js"
    ]
    
    # 过滤存在的文件
    existing_files = [f for f in files_to_upload if os.path.exists(f)]
    
    if existing_files:
        print(f"准备上传文件: {existing_files}")
        results = uploader.upload_files(existing_files, custom_prefix="examples/")
        
        # 显示结果
        for file_path, success in results.items():
            status = "成功" if success else "失败"
            print(f"  {file_path}: {status}")
    else:
        print("没有找到要上传的文件")

def example_upload_directory():
    """示例：上传整个目录"""
    print("\n=== 上传目录示例 ===")
    
    # 创建上传器
    uploader = OSSUploader("oss_config.json")
    
    # 上传pages目录
    directory = "pages"
    if os.path.exists(directory):
        print(f"准备上传目录: {directory}")
        results = uploader.upload_directory(
            directory, 
            custom_prefix="pages/",
            file_extensions=['.js', '.json', '.wxml', '.wxss']  # 只上传特定类型的文件
        )
        
        # 显示结果
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        print(f"上传完成: {successful}/{total} 个文件成功")
    else:
        print(f"目录不存在: {directory}")

def example_upload_with_detection():
    """示例：演示文件类型自动检测"""
    print("\n=== 文件类型检测示例 ===")
    
    uploader = OSSUploader("oss_config.json")
    
    # 测试不同类型的文件
    test_files = []
    for root, dirs, files in os.walk("."):
        for file in files[:5]:  # 只取前5个文件作为示例
            file_path = os.path.join(root, file)
            if os.path.isfile(file_path):
                test_files.append(file_path)
                if len(test_files) >= 5:
                    break
        if len(test_files) >= 5:
            break
    
    print("检测到的文件类型:")
    for file_path in test_files:
        extension, mime_type = uploader._detect_file_type(file_path)
        print(f"  {file_path}")
        print(f"    扩展名: {extension}")
        print(f"    MIME类型: {mime_type}")
        print()

if __name__ == "__main__":
    print("OSS上传工具使用示例")
    print("=" * 50)
    
    # 检查配置文件
    if not os.path.exists("oss_config.json"):
        print("请先配置 oss_config.json 文件")
        print("配置文件包含以下必需字段:")
        print("  - access_key_id: 阿里云AccessKey ID")
        print("  - access_key_secret: 阿里云AccessKey Secret")
        print("  - endpoint: OSS服务端点")
        print("  - bucket_name: 存储桶名称")
        return
    
    # 运行示例
    example_upload_with_detection()
    example_upload_files()
    example_upload_directory()
    
    print("\n使用说明:")
    print("1. 修改 oss_config.json 配置文件")
    print("2. 运行: python oss_uploader.py --files file1.txt file2.jpg")
    print("3. 或运行: python oss_uploader.py --directory /path/to/directory")
    print("4. 查看详细帮助: python oss_uploader.py --help")