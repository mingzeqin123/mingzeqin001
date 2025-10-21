#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大文件手机号和地址提取工具
支持从1GB+大文件中高效提取手机号码和地址信息
"""

import re
import os
import sys
import json
import argparse
from typing import Set, List, Dict, Tuple
from collections import defaultdict

class PhoneAddressExtractor:
    def __init__(self):
        # 中国手机号正则表达式（11位，1开头）
        self.phone_patterns = [
            r'1[3-9]\d{9}',  # 标准11位手机号
            r'(\+86\s*)?1[3-9]\d{9}',  # 带国际区号
            r'1[3-9]\d{4}\s*\d{4}',  # 中间有空格
            r'1[3-9]\d{4}-\d{4}',  # 中间有横线
        ]
        
        # 地址关键词和模式
        self.address_keywords = [
            '省', '市', '区', '县', '镇', '乡', '村', '街道', '路', '街', '巷', '弄', 
            '号', '栋', '楼', '室', '单元', '层', '门牌', '小区', '社区', '开发区',
            '工业园', '科技园', '商业区', '住宅区', '新区', '高新区', '经济区'
        ]
        
        # 地址正则模式
        self.address_patterns = [
            # 完整地址格式：省市区+详细地址
            r'[^\s\d]{2,10}[省市区县][^\s\d]{2,20}[市区县镇乡村][^\s]{2,50}[路街巷弄号栋楼室][^\s\n]{0,30}',
            # 简化地址格式
            r'[^\s\d]{2,20}[路街巷弄][^\s]{1,20}号[^\s\n]{0,20}',
            # 小区地址格式
            r'[^\s\d]{2,20}小区[^\s]{0,30}[栋楼][^\s]{0,10}[室号][^\s\n]{0,10}',
        ]
        
        self.found_phones = set()
        self.found_addresses = set()
        
    def extract_phones(self, text: str) -> Set[str]:
        """提取手机号码"""
        phones = set()
        for pattern in self.phone_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # 清理手机号（去除空格、横线、国际区号）
                clean_phone = re.sub(r'[^\d]', '', str(match))
                if len(clean_phone) == 11 and clean_phone.startswith('1'):
                    phones.add(clean_phone)
        return phones
    
    def extract_addresses(self, text: str) -> Set[str]:
        """提取地址信息"""
        addresses = set()
        
        # 基于关键词的地址提取（主要方法）
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if any(keyword in line for keyword in self.address_keywords):
                # 检查是否包含足够的地址特征
                keyword_count = sum(1 for keyword in self.address_keywords if keyword in line)
                if keyword_count >= 2 and len(line) > 15 and len(line) < 200:
                    # 提取地址部分（去除前面的标签）
                    address_part = line
                    # 尝试提取"地址："、"住址："等后面的内容
                    for prefix in ['地址：', '住址：', '居住地址：', '家庭住址：', '工作地址：', '居住地：', '工作地点：', '住所：', '地址信息：']:
                        if prefix in line:
                            parts = line.split(prefix, 1)
                            if len(parts) > 1:
                                address_part = parts[1].strip()
                                break
                    
                    # 进一步清理，移除可能的联系方式
                    address_part = re.sub(r'[，,]\s*手机[：:][^\s]*', '', address_part)
                    address_part = re.sub(r'[，,]\s*电话[：:][^\s]*', '', address_part)
                    address_part = re.sub(r'[，,]\s*联系[^\s]*[：:][^\s]*', '', address_part)
                    
                    if len(address_part) > 10 and keyword_count >= 2:
                        addresses.add(address_part)
        
        # 使用正则模式提取（辅助方法）
        for pattern in self.address_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # 清理地址（去除多余空格）
                clean_address = re.sub(r'\s+', ' ', match.strip())
                if len(clean_address) > 15:  # 过滤太短的匹配
                    addresses.add(clean_address)
        
        return addresses
    
    def process_large_file(self, file_path: str, chunk_size: int = 8192) -> Dict:
        """
        分块处理大文件
        
        Args:
            file_path: 文件路径
            chunk_size: 每次读取的字节数（默认8KB）
        
        Returns:
            包含提取结果的字典
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        file_size = os.path.getsize(file_path)
        print(f"开始处理文件: {file_path}")
        print(f"文件大小: {file_size / (1024*1024*1024):.2f} GB")
        
        processed_bytes = 0
        buffer = ""  # 用于处理跨块的文本
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                while True:
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    
                    # 处理缓冲区中的文本
                    text = buffer + chunk
                    
                    # 找到最后一个完整行的位置
                    last_newline = text.rfind('\n')
                    if last_newline != -1:
                        # 处理完整的行
                        complete_text = text[:last_newline]
                        buffer = text[last_newline + 1:]
                    else:
                        # 如果没有换行符，保留部分文本到缓冲区
                        if len(text) > chunk_size * 2:
                            complete_text = text[:-1000]  # 保留最后1000字符到缓冲区
                            buffer = text[-1000:]
                        else:
                            buffer = text
                            complete_text = ""
                    
                    if complete_text:
                        # 提取手机号和地址
                        phones = self.extract_phones(complete_text)
                        addresses = self.extract_addresses(complete_text)
                        
                        self.found_phones.update(phones)
                        self.found_addresses.update(addresses)
                    
                    processed_bytes += len(chunk.encode('utf-8'))
                    
                    # 显示进度
                    if processed_bytes % (1024 * 1024 * 10) == 0:  # 每10MB显示一次
                        progress = (processed_bytes / file_size) * 100
                        print(f"处理进度: {progress:.1f}% ({processed_bytes / (1024*1024):.1f} MB)")
                
                # 处理最后的缓冲区
                if buffer:
                    phones = self.extract_phones(buffer)
                    addresses = self.extract_addresses(buffer)
                    self.found_phones.update(phones)
                    self.found_addresses.update(addresses)
        
        except UnicodeDecodeError:
            print("检测到编码问题，尝试使用GBK编码...")
            return self._process_with_encoding(file_path, 'gbk', chunk_size)
        except Exception as e:
            print(f"处理文件时出错: {e}")
            return {"error": str(e)}
        
        return {
            "phones": sorted(list(self.found_phones)),
            "addresses": sorted(list(self.found_addresses)),
            "stats": {
                "phone_count": len(self.found_phones),
                "address_count": len(self.found_addresses),
                "file_size_gb": file_size / (1024*1024*1024)
            }
        }
    
    def _process_with_encoding(self, file_path: str, encoding: str, chunk_size: int) -> Dict:
        """使用指定编码处理文件"""
        try:
            with open(file_path, 'r', encoding=encoding, errors='ignore') as file:
                buffer = ""
                while True:
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    
                    text = buffer + chunk
                    last_newline = text.rfind('\n')
                    if last_newline != -1:
                        complete_text = text[:last_newline]
                        buffer = text[last_newline + 1:]
                    else:
                        if len(text) > chunk_size * 2:
                            complete_text = text[:-1000]
                            buffer = text[-1000:]
                        else:
                            buffer = text
                            complete_text = ""
                    
                    if complete_text:
                        phones = self.extract_phones(complete_text)
                        addresses = self.extract_addresses(complete_text)
                        self.found_phones.update(phones)
                        self.found_addresses.update(addresses)
                
                if buffer:
                    phones = self.extract_phones(buffer)
                    addresses = self.extract_addresses(buffer)
                    self.found_phones.update(phones)
                    self.found_addresses.update(addresses)
        
        except Exception as e:
            return {"error": f"使用{encoding}编码处理失败: {e}"}
        
        file_size = os.path.getsize(file_path)
        return {
            "phones": sorted(list(self.found_phones)),
            "addresses": sorted(list(self.found_addresses)),
            "stats": {
                "phone_count": len(self.found_phones),
                "address_count": len(self.found_addresses),
                "file_size_gb": file_size / (1024*1024*1024)
            }
        }
    
    def save_results(self, results: Dict, output_dir: str = "extraction_results"):
        """保存提取结果到文件"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # 保存手机号
        if results.get("phones"):
            phone_file = os.path.join(output_dir, "extracted_phones.txt")
            with open(phone_file, 'w', encoding='utf-8') as f:
                for phone in results["phones"]:
                    f.write(f"{phone}\n")
            print(f"手机号保存到: {phone_file}")
        
        # 保存地址
        if results.get("addresses"):
            address_file = os.path.join(output_dir, "extracted_addresses.txt")
            with open(address_file, 'w', encoding='utf-8') as f:
                for address in results["addresses"]:
                    f.write(f"{address}\n")
            print(f"地址保存到: {address_file}")
        
        # 保存统计信息
        stats_file = os.path.join(output_dir, "extraction_stats.json")
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(results.get("stats", {}), f, ensure_ascii=False, indent=2)
        print(f"统计信息保存到: {stats_file}")

def main():
    parser = argparse.ArgumentParser(description="从大文件中提取手机号和地址")
    parser.add_argument("file_path", help="要处理的文件路径")
    parser.add_argument("--chunk-size", type=int, default=8192, 
                       help="每次读取的字节数 (默认: 8192)")
    parser.add_argument("--output-dir", default="extraction_results",
                       help="输出目录 (默认: extraction_results)")
    
    args = parser.parse_args()
    
    extractor = PhoneAddressExtractor()
    
    print("=" * 50)
    print("大文件手机号和地址提取工具")
    print("=" * 50)
    
    try:
        results = extractor.process_large_file(args.file_path, args.chunk_size)
        
        if "error" in results:
            print(f"错误: {results['error']}")
            return 1
        
        print("\n提取完成!")
        print(f"找到手机号: {results['stats']['phone_count']} 个")
        print(f"找到地址: {results['stats']['address_count']} 个")
        
        # 显示部分结果预览
        if results["phones"]:
            print(f"\n手机号预览 (前10个):")
            for phone in results["phones"][:10]:
                print(f"  {phone}")
            if len(results["phones"]) > 10:
                print(f"  ... 还有 {len(results['phones']) - 10} 个")
        
        if results["addresses"]:
            print(f"\n地址预览 (前5个):")
            for addr in results["addresses"][:5]:
                print(f"  {addr}")
            if len(results["addresses"]) > 5:
                print(f"  ... 还有 {len(results['addresses']) - 5} 个")
        
        # 保存结果
        extractor.save_results(results, args.output_dir)
        
        return 0
        
    except Exception as e:
        print(f"程序执行出错: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())