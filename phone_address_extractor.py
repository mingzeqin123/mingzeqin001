#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大文件手机号和地址提取工具
支持从1GB+的大文件中高效提取中国手机号和地址信息
"""

import re
import sys
import argparse
import json
from typing import List, Tuple, Iterator
from pathlib import Path
import time

class PhoneAddressExtractor:
    def __init__(self):
        # 中国手机号正则表达式
        # 支持11位手机号，以1开头，第二位为3,4,5,6,7,8,9
        self.phone_pattern = re.compile(
            r'(?<!\d)1[3-9]\d{9}(?!\d)'
        )
        
        # 地址相关正则表达式
        # 匹配省市区县街道等地址信息
        self.address_patterns = [
            # 省市区县
            re.compile(r'[\u4e00-\u9fff]{2,4}[省市县区]'),
            # 街道、路、巷、号
            re.compile(r'[\u4e00-\u9fff]+[街道路巷号]'),
            # 小区、大厦、广场等
            re.compile(r'[\u4e00-\u9fff]+[小区大厦广场中心]'),
            # 门牌号
            re.compile(r'\d+号'),
            # 邮政编码
            re.compile(r'\d{6}'),
        ]
        
        # 常见地址关键词
        self.address_keywords = [
            '省', '市', '县', '区', '街道', '路', '巷', '号', '小区', 
            '大厦', '广场', '中心', '村', '镇', '乡', '组', '队'
        ]
    
    def extract_phones(self, text: str) -> List[str]:
        """提取文本中的所有手机号"""
        phones = self.phone_pattern.findall(text)
        return list(set(phones))  # 去重
    
    def extract_addresses(self, text: str) -> List[str]:
        """提取文本中的地址信息"""
        addresses = []
        
        # 使用正则表达式匹配
        for pattern in self.address_patterns:
            matches = pattern.findall(text)
            addresses.extend(matches)
        
        # 基于关键词的地址识别
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if len(line) > 5:  # 过滤太短的行
                # 检查是否包含地址关键词
                keyword_count = sum(1 for keyword in self.address_keywords if keyword in line)
                if keyword_count >= 2:  # 包含至少2个地址关键词
                    addresses.append(line)
        
        # 去重并过滤
        unique_addresses = []
        for addr in set(addresses):
            if len(addr) >= 4:  # 地址至少4个字符
                unique_addresses.append(addr)
        
        return unique_addresses
    
    def process_file_streaming(self, file_path: str, chunk_size: int = 1024 * 1024) -> Tuple[List[str], List[str]]:
        """流式处理大文件，避免内存溢出"""
        all_phones = set()
        all_addresses = set()
        
        print(f"开始处理文件: {file_path}")
        print(f"块大小: {chunk_size // 1024}KB")
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                chunk_count = 0
                while True:
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    
                    chunk_count += 1
                    print(f"处理第 {chunk_count} 块...", end='\r')
                    
                    # 提取手机号
                    phones = self.extract_phones(chunk)
                    all_phones.update(phones)
                    
                    # 提取地址
                    addresses = self.extract_addresses(chunk)
                    all_addresses.update(addresses)
        
        except UnicodeDecodeError:
            # 如果UTF-8解码失败，尝试其他编码
            print("\n尝试使用GBK编码...")
            with open(file_path, 'r', encoding='gbk', errors='ignore') as file:
                chunk_count = 0
                while True:
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    
                    chunk_count += 1
                    print(f"处理第 {chunk_count} 块...", end='\r')
                    
                    phones = self.extract_phones(chunk)
                    all_phones.update(phones)
                    
                    addresses = self.extract_addresses(chunk)
                    all_addresses.update(addresses)
        
        print(f"\n处理完成! 共处理 {chunk_count} 个数据块")
        return list(all_phones), list(all_addresses)
    
    def save_results(self, phones: List[str], addresses: List[str], output_file: str):
        """保存提取结果到文件"""
        results = {
            'phones': phones,
            'addresses': addresses,
            'phone_count': len(phones),
            'address_count': len(addresses),
            'extraction_time': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # 保存为JSON格式
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        # 同时保存为文本格式
        txt_file = output_file.replace('.json', '.txt')
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("=== 提取的手机号 ===\n")
            for phone in sorted(phones):
                f.write(f"{phone}\n")
            
            f.write(f"\n=== 提取的地址 ===\n")
            for addr in sorted(addresses):
                f.write(f"{addr}\n")
        
        print(f"结果已保存到: {output_file} 和 {txt_file}")

def main():
    parser = argparse.ArgumentParser(description='从大文件中提取手机号和地址')
    parser.add_argument('input_file', help='输入文件路径')
    parser.add_argument('-o', '--output', default='extracted_results.json', 
                       help='输出文件路径 (默认: extracted_results.json)')
    parser.add_argument('-c', '--chunk-size', type=int, default=1024*1024,
                       help='处理块大小，单位字节 (默认: 1MB)')
    parser.add_argument('--phones-only', action='store_true',
                       help='只提取手机号')
    parser.add_argument('--addresses-only', action='store_true',
                       help='只提取地址')
    
    args = parser.parse_args()
    
    # 检查输入文件是否存在
    if not Path(args.input_file).exists():
        print(f"错误: 文件 {args.input_file} 不存在")
        sys.exit(1)
    
    # 创建提取器
    extractor = PhoneAddressExtractor()
    
    # 开始提取
    start_time = time.time()
    
    try:
        phones, addresses = extractor.process_file_streaming(
            args.input_file, 
            args.chunk_size
        )
        
        # 根据参数过滤结果
        if args.phones_only:
            addresses = []
        elif args.addresses_only:
            phones = []
        
        # 保存结果
        extractor.save_results(phones, addresses, args.output)
        
        # 显示统计信息
        end_time = time.time()
        print(f"\n=== 提取完成 ===")
        print(f"手机号数量: {len(phones)}")
        print(f"地址数量: {len(addresses)}")
        print(f"处理时间: {end_time - start_time:.2f} 秒")
        
        # 显示部分结果预览
        if phones:
            print(f"\n手机号示例 (前10个):")
            for phone in sorted(phones)[:10]:
                print(f"  {phone}")
        
        if addresses:
            print(f"\n地址示例 (前10个):")
            for addr in sorted(addresses)[:10]:
                print(f"  {addr}")
    
    except Exception as e:
        print(f"处理过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()