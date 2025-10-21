#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量提取手机号和地址脚本
支持处理多个文件
"""

import os
import sys
import glob
from pathlib import Path
from phone_address_extractor import PhoneAddressExtractor

def batch_extract(input_pattern, output_dir="extracted_results"):
    """批量提取文件中的手机号和地址"""
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取匹配的文件
    files = glob.glob(input_pattern)
    
    if not files:
        print(f"没有找到匹配的文件: {input_pattern}")
        return
    
    print(f"找到 {len(files)} 个文件需要处理")
    print(f"输出目录: {output_dir}")
    
    # 创建提取器
    extractor = PhoneAddressExtractor()
    
    all_phones = set()
    all_addresses = set()
    
    for i, file_path in enumerate(files, 1):
        print(f"\n[{i}/{len(files)}] 处理文件: {file_path}")
        
        try:
            # 提取手机号和地址
            phones, addresses = extractor.process_file_streaming(file_path)
            
            # 合并结果
            all_phones.update(phones)
            all_addresses.update(addresses)
            
            # 保存单个文件的结果
            file_name = Path(file_path).stem
            output_file = os.path.join(output_dir, f"{file_name}_extracted.json")
            extractor.save_results(phones, addresses, output_file)
            
            print(f"  - 手机号: {len(phones)}个")
            print(f"  - 地址: {len(addresses)}个")
            print(f"  - 结果保存到: {output_file}")
            
        except Exception as e:
            print(f"  - 处理失败: {e}")
            continue
    
    # 保存合并结果
    if all_phones or all_addresses:
        merged_output = os.path.join(output_dir, "merged_results.json")
        extractor.save_results(list(all_phones), list(all_addresses), merged_output)
        
        print(f"\n=== 批量处理完成 ===")
        print(f"总手机号数量: {len(all_phones)}")
        print(f"总地址数量: {len(all_addresses)}")
        print(f"合并结果保存到: {merged_output}")

def main():
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python3 batch_extract.py <文件模式> [输出目录]")
        print("")
        print("示例:")
        print("  python3 batch_extract.py '*.txt'")
        print("  python3 batch_extract.py 'data/*.log' results")
        print("  python3 batch_extract.py 'logs/2024*.txt' extracted")
        sys.exit(1)
    
    input_pattern = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "extracted_results"
    
    batch_extract(input_pattern, output_dir)

if __name__ == "__main__":
    main()