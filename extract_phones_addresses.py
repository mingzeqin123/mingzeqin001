#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速手机号和地址提取脚本
简化版本，直接运行即可使用
"""

import sys
import os
from phone_address_extractor import PhoneAddressExtractor

def main():
    if len(sys.argv) < 2:
        print("使用方法: python3 extract_phones_addresses.py <文件路径>")
        print("示例: python3 extract_phones_addresses.py data.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"错误: 文件 {input_file} 不存在")
        sys.exit(1)
    
    print(f"开始处理文件: {input_file}")
    print("正在提取手机号和地址...")
    
    # 创建提取器
    extractor = PhoneAddressExtractor()
    
    # 处理文件
    phones, addresses = extractor.process_file_streaming(input_file)
    
    # 保存结果
    output_file = "extracted_results.json"
    extractor.save_results(phones, addresses, output_file)
    
    # 显示结果
    print(f"\n=== 提取完成 ===")
    print(f"手机号数量: {len(phones)}")
    print(f"地址数量: {len(addresses)}")
    print(f"结果已保存到: {output_file}")
    
    # 显示部分结果
    if phones:
        print(f"\n手机号 (前10个):")
        for phone in sorted(phones)[:10]:
            print(f"  {phone}")
    
    if addresses:
        print(f"\n地址 (前10个):")
        for addr in sorted(addresses)[:10]:
            print(f"  {addr}")

if __name__ == "__main__":
    main()