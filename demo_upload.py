#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OSS上传工具演示脚本
展示如何使用OSS上传工具批量上传文件
"""

import os
import subprocess
import sys
from pathlib import Path

def create_demo_files():
    """创建演示文件"""
    demo_dir = "demo_files"
    os.makedirs(demo_dir, exist_ok=True)
    
    # 创建不同类型的演示文件
    demo_files = {
        "readme.txt": "这是一个演示文本文件\n用于测试OSS上传功能",
        "config.json": '{"app": "OSS上传工具", "version": "1.0.0", "features": ["批量上传", "自动检测文件类型"]}',
        "index.html": "<!DOCTYPE html>\n<html>\n<head><title>演示页面</title></head>\n<body><h1>OSS上传工具演示</h1></body>\n</html>",
        "script.py": "#!/usr/bin/env python3\n# 演示Python脚本\nprint('Hello from OSS uploader demo!')\n",
        "data.csv": "姓名,年龄,城市\n张三,25,北京\n李四,30,上海\n王五,28,广州\n",
        "document.md": "# OSS上传工具演示\n\n这是一个Markdown文档，用于演示文件类型自动检测功能。\n\n## 功能特性\n\n- 批量上传文件\n- 自动识别文件类型\n- 支持多种文件格式\n"
    }
    
    created_files = []
    for filename, content in demo_files.items():
        file_path = os.path.join(demo_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        created_files.append(file_path)
        print(f"✓ 创建演示文件: {file_path}")
    
    return created_files, demo_dir

def show_file_types():
    """显示支持的文件类型"""
    print("\n=== 支持的文件类型 ===")
    
    file_types = {
        "图片文件": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
        "文档文件": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
        "文本文件": [".txt", ".csv", ".json", ".xml", ".html", ".css", ".js", ".md"],
        "压缩文件": [".zip", ".rar", ".7z"],
        "音视频文件": [".mp4", ".avi", ".mov", ".mp3", ".wav", ".flac"],
        "编程文件": [".py", ".java", ".cpp", ".c", ".h"]
    }
    
    for category, extensions in file_types.items():
        print(f"\n{category}:")
        print(f"  {', '.join(extensions)}")

def demo_commands():
    """演示各种命令用法"""
    print("\n=== 命令使用示例 ===")
    
    commands = [
        {
            "description": "上传指定文件",
            "command": "python3 oss_uploader.py --files demo_files/readme.txt demo_files/config.json"
        },
        {
            "description": "上传整个目录",
            "command": "python3 oss_uploader.py --directory demo_files"
        },
        {
            "description": "只上传特定类型的文件",
            "command": "python3 oss_uploader.py --directory demo_files --extensions .txt .json .md"
        },
        {
            "description": "使用自定义前缀上传",
            "command": "python3 oss_uploader.py --files demo_files/readme.txt --prefix 'documents/2024/'"
        },
        {
            "description": "使用自定义配置文件",
            "command": "python3 oss_uploader.py --files demo_files/readme.txt --config my_config.json"
        }
    ]
    
    for i, cmd in enumerate(commands, 1):
        print(f"\n{i}. {cmd['description']}:")
        print(f"   {cmd['command']}")

def check_config():
    """检查配置文件"""
    config_file = "oss_config.json"
    
    if not os.path.exists(config_file):
        print(f"\n❌ 配置文件 {config_file} 不存在")
        print("请先配置OSS连接信息")
        return False
    
    try:
        import json
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        required_keys = ['access_key_id', 'access_key_secret', 'endpoint', 'bucket_name']
        missing_keys = [key for key in required_keys if not config.get(key) or config[key] == f"your_{key}"]
        
        if missing_keys:
            print(f"\n❌ 配置文件缺少或未正确设置: {', '.join(missing_keys)}")
            print("请修改 oss_config.json 文件中的配置信息")
            return False
        else:
            print(f"\n✓ 配置文件 {config_file} 检查通过")
            return True
            
    except Exception as e:
        print(f"\n❌ 配置文件格式错误: {e}")
        return False

def main():
    """主函数"""
    print("OSS批量文件上传工具演示")
    print("=" * 50)
    
    # 检查配置文件
    if not check_config():
        print("\n请先配置 oss_config.json 文件，然后重新运行此演示")
        return
    
    # 创建演示文件
    print("\n=== 创建演示文件 ===")
    demo_files, demo_dir = create_demo_files()
    
    # 显示支持的文件类型
    show_file_types()
    
    # 演示命令用法
    demo_commands()
    
    # 显示文件检测结果
    print("\n=== 文件类型检测演示 ===")
    from oss_uploader import OSSUploader
    
    try:
        uploader = OSSUploader("oss_config.json")
        print("检测演示文件的类型:")
        for file_path in demo_files:
            extension, mime_type = uploader._detect_file_type(file_path)
            print(f"  {os.path.basename(file_path)}: {extension} -> {mime_type}")
    except Exception as e:
        print(f"文件类型检测失败: {e}")
    
    print(f"\n=== 演示完成 ===")
    print(f"演示文件已创建在 {demo_dir} 目录中")
    print("你可以使用上述命令来测试上传功能")
    print("\n注意: 确保你的OSS配置正确，并且有足够的权限进行上传操作")

if __name__ == "__main__":
    main()