#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件类型检测器测试示例
"""

import base64
from file_type_detector import FileTypeDetector


def create_test_data():
    """创建测试用的base64数据"""
    test_cases = {}
    
    # 创建一个简单的PNG图片的base64数据（1x1像素的透明PNG）
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
    test_cases['PNG'] = base64.b64encode(png_data).decode('utf-8')
    
    # 创建一个简单的JPEG图片的base64数据（1x1像素的JPEG）
    jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
    test_cases['JPEG'] = base64.b64encode(jpeg_data).decode('utf-8')
    
    # 创建一个简单的PDF文件的base64数据
    pdf_data = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF'
    test_cases['PDF'] = base64.b64encode(pdf_data).decode('utf-8')
    
    # 创建一个简单的ZIP文件的base64数据
    zip_data = b'PK\x03\x04\x14\x00\x00\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05\x00\x00\x00test.txtHello WorldPK\x01\x02\x14\x00\x14\x00\x00\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00test.txtPK\x05\x06\x00\x00\x00\x00\x01\x00\x01\x00\x1e\x00\x00\x00\x1e\x00\x00\x00\x00\x00'
    test_cases['ZIP'] = base64.b64encode(zip_data).decode('utf-8')
    
    # 创建一个简单的文本文件的base64数据
    text_data = b'Hello, World!\nThis is a test text file.\n'
    test_cases['TXT'] = base64.b64encode(text_data).decode('utf-8')
    
    # 创建一个简单的HTML文件的base64数据
    html_data = b'<html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>'
    test_cases['HTML'] = base64.b64encode(html_data).decode('utf-8')
    
    return test_cases


def test_file_detection():
    """测试文件类型检测功能"""
    print("=== 文件类型检测器测试 ===\n")
    
    # 创建测试数据
    test_cases = create_test_data()
    
    # 测试每种文件类型
    for expected_type, base64_data in test_cases.items():
        print(f"测试 {expected_type} 文件:")
        print(f"Base64数据长度: {len(base64_data)} 字符")
        print(f"Base64数据前50字符: {base64_data[:50]}...")
        
        # 检测文件类型
        detected_type, message, details = FileTypeDetector.detect_file_type(base64_data)
        
        print(f"检测结果: {message}")
        print(f"文件大小: {details.get('file_size', 'N/A')} 字节")
        print(f"文件头(十六进制): {details.get('header_hex', 'N/A')}")
        print(f"检测是否正确: {'✓' if detected_type == expected_type else '✗'}")
        print("-" * 50)
    
    # 测试无效的base64数据
    print("\n测试无效的base64数据:")
    invalid_base64 = "这不是有效的base64数据!"
    detected_type, message, details = FileTypeDetector.detect_file_type(invalid_base64)
    print(f"检测结果: {message}")
    print(f"是否有效base64: {details.get('is_valid_base64', 'N/A')}")
    print("-" * 50)


def test_detailed_analysis():
    """测试详细分析功能"""
    print("\n=== 详细分析测试 ===\n")
    
    # 使用PNG文件进行详细分析
    test_cases = create_test_data()
    png_base64 = test_cases['PNG']
    
    print("PNG文件详细分析:")
    detailed_result = FileTypeDetector.analyze_base64_detailed(png_base64)
    
    for key, value in detailed_result.items():
        print(f"  {key}: {value}")


def interactive_test():
    """交互式测试"""
    print("\n=== 交互式测试 ===")
    print("请输入base64数据（输入 'quit' 退出）:")
    
    while True:
        user_input = input("\nBase64数据: ").strip()
        
        if user_input.lower() == 'quit':
            break
        
        if not user_input:
            continue
        
        # 检测文件类型
        detected_type, message, details = FileTypeDetector.detect_file_type(user_input)
        print(f"\n检测结果: {message}")
        
        # 显示详细信息
        if details.get('is_valid_base64', False):
            print(f"文件大小: {details.get('file_size', 'N/A')} 字节")
            print(f"文件头(十六进制): {details.get('header_hex', 'N/A')}")
            
            # 详细分析
            detailed_result = FileTypeDetector.analyze_base64_detailed(user_input)
            print(f"MIME类型提示: {detailed_result.get('mime_type_hint', 'N/A')}")
            print(f"是否为文本文件: {detailed_result.get('is_text_file', 'N/A')}")


def show_supported_types():
    """显示支持的文件类型"""
    print("\n=== 支持的文件类型 ===")
    supported_types = FileTypeDetector.get_supported_types()
    
    # 按类别分组显示
    categories = {
        '图片格式': ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'TIFF', 'ICO', 'SVG'],
        '文档格式': ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'],
        '压缩文件': ['ZIP', 'RAR', '7Z', 'TAR', 'GZIP'],
        '音频格式': ['MP3', 'WAV', 'FLAC', 'OGG', 'AAC'],
        '视频格式': ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'MKV'],
        '文本格式': ['TXT', 'XML', 'HTML', 'CSS'],
        '可执行文件': ['EXE', 'ELF', 'MACHO'],
        '其他格式': ['SQLITE', 'SWF', 'PSD', 'EPS']
    }
    
    for category, types in categories.items():
        print(f"\n{category}:")
        for file_type in types:
            if file_type in supported_types:
                print(f"  ✓ {file_type}")
    
    print(f"\n总共支持 {len(supported_types)} 种文件类型")


if __name__ == "__main__":
    # 运行所有测试
    test_file_detection()
    test_detailed_analysis()
    show_supported_types()
    
    # 可选：运行交互式测试
    # interactive_test()