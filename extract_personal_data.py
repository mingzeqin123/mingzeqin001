#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大文件个人信息提取工具
从1GB+的大文件中提取手机号、地址、人名等个人信息
支持内存高效的流式处理
"""

import re
import os
import sys
import json
import argparse
from typing import Set, Dict, List, Iterator
from collections import defaultdict
import time

class PersonalDataExtractor:
    """个人数据提取器"""
    
    def __init__(self):
        # 中国手机号正则表达式 (11位，1开头)
        self.phone_patterns = [
            r'1[3-9]\d{9}',  # 标准11位手机号
            r'1[3-9]\d{4}\s*\d{4}',  # 带空格的手机号
            r'1[3-9]\d{4}-\d{4}',  # 带横线的手机号
            r'\+86\s*1[3-9]\d{9}',  # 带国际区号
        ]
        
        # 中文姓名正则表达式
        self.name_patterns = [
            r'(?:姓名|名字|客户|联系人|收货人|用户)[:：]\s*([\u4e00-\u9fa5]{2,4})',  # 带标签的姓名
            r'([\u4e00-\u9fa5]{2,3})(?:先生|女士)',  # 姓名+敬语
            r'(?<=[，。：；\s])([\u4e00-\u9fa5]{2,4})(?=[，。：；\s])',  # 独立的2-4个汉字
        ]
        
        # 地址正则表达式
        self.address_patterns = [
            # 完整地址格式
            r'[\u4e00-\u9fa5]{2,}(?:省|市|区|县|镇|乡|街道|路|巷|弄|号|室|栋|楼|层)[\u4e00-\u9fa5\d\-\s]{5,50}',
            # 带标签的地址
            r'(?:地址|住址|联系地址|详细地址)[:：]\s*[\u4e00-\u9fa5\d\-\s]{10,100}',
            # 邮编+地址
            r'\d{6}\s*[\u4e00-\u9fa5]{2,}(?:省|市|区|县)[\u4e00-\u9fa5\d\-\s]{5,50}',
        ]
        
        # 编译正则表达式以提高性能
        self.compiled_patterns = {
            'phones': [re.compile(pattern) for pattern in self.phone_patterns],
            'names': [re.compile(pattern) for pattern in self.name_patterns],
            'addresses': [re.compile(pattern) for pattern in self.address_patterns]
        }
        
        # 存储提取的数据
        self.extracted_data = {
            'phones': set(),
            'names': set(),
            'addresses': set()
        }
        
        # 统计信息
        self.stats = {
            'lines_processed': 0,
            'phones_found': 0,
            'names_found': 0,
            'addresses_found': 0,
            'processing_time': 0
        }

    def extract_phones(self, text: str) -> Set[str]:
        """提取手机号"""
        phones = set()
        for pattern in self.compiled_patterns['phones']:
            matches = pattern.findall(text)
            for match in matches:
                # 清理手机号格式
                clean_phone = re.sub(r'[\s\-\+86]', '', match)
                if len(clean_phone) == 11 and clean_phone.startswith('1'):
                    phones.add(clean_phone)
        return phones

    def extract_names(self, text: str) -> Set[str]:
        """提取中文姓名"""
        names = set()
        for pattern in self.compiled_patterns['names']:
            matches = pattern.findall(text)
            for match in matches:
                # 清理姓名
                if isinstance(match, tuple):
                    # 取第一个非空捕获组
                    match = next((m for m in match if m), match[0])
                clean_name = match.strip('：: ')
                if 2 <= len(clean_name) <= 4 and all('\u4e00' <= c <= '\u9fa5' for c in clean_name):
                    # 过滤常见非姓名词汇
                    excluded_words = {
                        '公司', '先生', '女士', '客服', '经理', '总监', '系统', '用户', '信息', 
                        '数据', '记录', '文件', '配置', '参数', '结果', '状态', '处理',
                        '订单', '地址', '电话', '手机', '联系', '方式', '收货', '发货'
                    }
                    if clean_name not in excluded_words:
                        names.add(clean_name)
        return names

    def extract_addresses(self, text: str) -> Set[str]:
        """提取地址信息"""
        addresses = set()
        for pattern in self.compiled_patterns['addresses']:
            matches = pattern.findall(text)
            for match in matches:
                clean_address = match.strip('：: ')
                if len(clean_address) >= 10:  # 地址长度至少10个字符
                    addresses.add(clean_address)
        return addresses

    def process_line(self, line: str) -> None:
        """处理单行文本"""
        self.stats['lines_processed'] += 1
        
        # 提取手机号
        phones = self.extract_phones(line)
        self.extracted_data['phones'].update(phones)
        self.stats['phones_found'] += len(phones)
        
        # 提取姓名
        names = self.extract_names(line)
        self.extracted_data['names'].update(names)
        self.stats['names_found'] += len(names)
        
        # 提取地址
        addresses = self.extract_addresses(line)
        self.extracted_data['addresses'].update(addresses)
        self.stats['addresses_found'] += len(addresses)

    def process_file(self, file_path: str, chunk_size: int = 8192) -> None:
        """
        流式处理大文件
        
        Args:
            file_path: 文件路径
            chunk_size: 每次读取的字节数
        """
        start_time = time.time()
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        file_size = os.path.getsize(file_path)
        print(f"开始处理文件: {file_path}")
        print(f"文件大小: {file_size / (1024**3):.2f} GB")
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                buffer = ""
                bytes_processed = 0
                
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    
                    bytes_processed += len(chunk.encode('utf-8'))
                    buffer += chunk
                    
                    # 按行处理
                    lines = buffer.split('\n')
                    buffer = lines[-1]  # 保留最后一行的不完整部分
                    
                    for line in lines[:-1]:
                        if line.strip():  # 跳过空行
                            self.process_line(line)
                    
                    # 显示进度
                    if self.stats['lines_processed'] % 10000 == 0:
                        progress = (bytes_processed / file_size) * 100
                        print(f"进度: {progress:.1f}% - 已处理 {self.stats['lines_processed']} 行")
                
                # 处理最后一行
                if buffer.strip():
                    self.process_line(buffer)
        
        except Exception as e:
            print(f"处理文件时出错: {e}")
            raise
        
        self.stats['processing_time'] = time.time() - start_time
        print(f"文件处理完成，耗时: {self.stats['processing_time']:.2f} 秒")

    def save_results(self, output_dir: str = "extracted_data") -> None:
        """保存提取结果"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # 保存手机号
        phones_file = os.path.join(output_dir, "phones.txt")
        with open(phones_file, 'w', encoding='utf-8') as f:
            for phone in sorted(self.extracted_data['phones']):
                f.write(f"{phone}\n")
        
        # 保存姓名
        names_file = os.path.join(output_dir, "names.txt")
        with open(names_file, 'w', encoding='utf-8') as f:
            for name in sorted(self.extracted_data['names']):
                f.write(f"{name}\n")
        
        # 保存地址
        addresses_file = os.path.join(output_dir, "addresses.txt")
        with open(addresses_file, 'w', encoding='utf-8') as f:
            for address in sorted(self.extracted_data['addresses']):
                f.write(f"{address}\n")
        
        # 保存统计信息
        stats_file = os.path.join(output_dir, "statistics.json")
        with open(stats_file, 'w', encoding='utf-8') as f:
            stats_with_counts = {
                **self.stats,
                'unique_phones': len(self.extracted_data['phones']),
                'unique_names': len(self.extracted_data['names']),
                'unique_addresses': len(self.extracted_data['addresses'])
            }
            json.dump(stats_with_counts, f, ensure_ascii=False, indent=2)
        
        print(f"\n结果已保存到: {output_dir}/")
        print(f"- 手机号: {phones_file} ({len(self.extracted_data['phones'])} 个)")
        print(f"- 姓名: {names_file} ({len(self.extracted_data['names'])} 个)")
        print(f"- 地址: {addresses_file} ({len(self.extracted_data['addresses'])} 个)")
        print(f"- 统计: {stats_file}")

    def print_summary(self) -> None:
        """打印提取摘要"""
        print("\n" + "="*50)
        print("数据提取摘要")
        print("="*50)
        print(f"处理行数: {self.stats['lines_processed']:,}")
        print(f"处理时间: {self.stats['processing_time']:.2f} 秒")
        print(f"处理速度: {self.stats['lines_processed']/self.stats['processing_time']:.0f} 行/秒")
        print()
        print(f"找到手机号: {len(self.extracted_data['phones'])} 个唯一号码")
        print(f"找到姓名: {len(self.extracted_data['names'])} 个唯一姓名")
        print(f"找到地址: {len(self.extracted_data['addresses'])} 个唯一地址")
        print()
        
        # 显示前几个示例
        if self.extracted_data['phones']:
            print("手机号示例:")
            for phone in list(self.extracted_data['phones'])[:5]:
                print(f"  {phone}")
        
        if self.extracted_data['names']:
            print("姓名示例:")
            for name in list(self.extracted_data['names'])[:5]:
                print(f"  {name}")
        
        if self.extracted_data['addresses']:
            print("地址示例:")
            for addr in list(self.extracted_data['addresses'])[:3]:
                print(f"  {addr[:50]}...")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="从大文件中提取个人信息")
    parser.add_argument("file_path", help="要处理的文件路径")
    parser.add_argument("-o", "--output", default="extracted_data", 
                       help="输出目录 (默认: extracted_data)")
    parser.add_argument("-c", "--chunk-size", type=int, default=8192,
                       help="读取块大小 (默认: 8192)")
    
    args = parser.parse_args()
    
    # 创建提取器
    extractor = PersonalDataExtractor()
    
    try:
        # 处理文件
        extractor.process_file(args.file_path, args.chunk_size)
        
        # 显示摘要
        extractor.print_summary()
        
        # 保存结果
        extractor.save_results(args.output)
        
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()