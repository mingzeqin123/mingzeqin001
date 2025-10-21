#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速个人信息提取脚本
简化版本，用于快速提取大文件中的个人信息
"""

import re
import sys
import os

def quick_extract(file_path):
    """快速提取个人信息"""
    
    # 简化的正则表达式
    phone_pattern = re.compile(r'1[3-9]\d{9}')
    name_pattern = re.compile(r'(?:姓名|客户|联系人)[:：]\s*([\u4e00-\u9fa5]{2,4})')
    address_pattern = re.compile(r'[\u4e00-\u9fa5]{2,}(?:省|市|区|县)[\u4e00-\u9fa5\d\s]{10,50}')
    
    phones = set()
    names = set()
    addresses = set()
    
    print(f"正在处理文件: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            line_count = 0
            for line in f:
                line_count += 1
                
                # 提取手机号
                phones.update(phone_pattern.findall(line))
                
                # 提取姓名
                name_matches = name_pattern.findall(line)
                names.update(name_matches)
                
                # 提取地址
                addresses.update(address_pattern.findall(line))
                
                if line_count % 50000 == 0:
                    print(f"已处理 {line_count} 行...")
        
        print(f"\n提取完成! 共处理 {line_count} 行")
        print(f"手机号: {len(phones)} 个")
        print(f"姓名: {len(names)} 个")
        print(f"地址: {len(addresses)} 个")
        
        # 快速保存结果
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        
        with open(f"{base_name}_phones.txt", 'w', encoding='utf-8') as f:
            for phone in sorted(phones):
                f.write(f"{phone}\n")
        
        with open(f"{base_name}_names.txt", 'w', encoding='utf-8') as f:
            for name in sorted(names):
                f.write(f"{name}\n")
        
        with open(f"{base_name}_addresses.txt", 'w', encoding='utf-8') as f:
            for addr in sorted(addresses):
                f.write(f"{addr}\n")
        
        print(f"\n结果已保存:")
        print(f"- {base_name}_phones.txt")
        print(f"- {base_name}_names.txt")
        print(f"- {base_name}_addresses.txt")
        
    except Exception as e:
        print(f"处理文件时出错: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python3 quick_extract.py <文件路径>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"文件不存在: {file_path}")
        sys.exit(1)
    
    quick_extract(file_path)