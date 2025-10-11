#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的OSS上传工具测试
"""

import os
import tempfile
from pathlib import Path

def test_file_detection():
    """测试文件类型检测功能"""
    print("=== 测试文件类型检测 ===")
    
    # 创建测试文件
    test_files = {
        "test.txt": "这是一个测试文本文件\n包含中文内容",
        "test.json": '{"name": "测试", "type": "json文件"}',
        "test.html": "<html><body><h1>测试HTML文件</h1></body></html>",
        "test.py": "#!/usr/bin/env python3\nprint('Hello, World!')",
        "test.md": "# 测试Markdown文件\n\n这是一个测试文档。"
    }
    
    # 文件类型映射
    mime_type_map = {
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.html': 'text/html',
        '.py': 'text/x-python',
        '.md': 'text/markdown',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
    }
    
    def detect_file_type(file_path):
        """检测文件类型"""
        import mimetypes
        
        file_path = Path(file_path)
        extension = file_path.suffix.lower()
        
        # 首先尝试从扩展名获取MIME类型
        if extension in mime_type_map:
            return extension, mime_type_map[extension]
        
        # 尝试使用python-magic检测
        try:
            import magic
            mime_type = magic.from_file(str(file_path), mime=True)
            return extension, mime_type
        except (ImportError, OSError, Exception):
            pass
        
        # 使用mimetypes模块
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type:
            return extension, mime_type
        
        # 默认类型
        return extension, 'application/octet-stream'
    
    # 创建临时目录和文件
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"创建临时测试目录: {temp_dir}")
        
        created_files = []
        for filename, content in test_files.items():
            file_path = os.path.join(temp_dir, filename)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            created_files.append(file_path)
            print(f"创建测试文件: {file_path}")
        
        print("\n文件类型检测结果:")
        for file_path in created_files:
            extension, mime_type = detect_file_type(file_path)
            print(f"  {os.path.basename(file_path)}")
            print(f"    扩展名: {extension}")
            print(f"    MIME类型: {mime_type}")
            print()

def test_oss_key_generation():
    """测试OSS键名生成"""
    print("=== 测试OSS键名生成 ===")
    
    from datetime import datetime
    
    def generate_oss_key(file_path, custom_prefix=None):
        """生成OSS对象键名"""
        file_path = Path(file_path)
        prefix = custom_prefix or "uploads/"
        
        # 确保前缀以/结尾
        if not prefix.endswith('/'):
            prefix += '/'
        
        # 添加时间戳避免重名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = file_path.stem
        extension = file_path.suffix
        
        return f"{prefix}{timestamp}_{filename}{extension}"
    
    test_files = [
        "test.txt",
        "images/photo.jpg",
        "documents/report.pdf"
    ]
    
    print("OSS键名生成结果:")
    for file_path in test_files:
        oss_key = generate_oss_key(file_path, "test/")
        print(f"  {file_path} -> {oss_key}")

def main():
    """主测试函数"""
    print("OSS上传工具功能测试")
    print("=" * 50)
    
    try:
        # 测试文件类型检测
        test_file_detection()
        
        # 测试OSS键名生成
        test_oss_key_generation()
        
        print("所有测试完成!")
        print("\n注意: 要测试实际上传功能，请:")
        print("1. 配置正确的 oss_config.json 文件")
        print("2. 运行: python3 oss_uploader.py --files file1.txt file2.jpg")
        
    except Exception as e:
        print(f"测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()