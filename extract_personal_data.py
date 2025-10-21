#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大文件个人信息提取工具
从大文件中提取手机号、地址、人名等个人信息
"""

import re
import jieba
import jieba.posseg as pseg
import os
import sys
from typing import List, Dict, Set, Tuple
import argparse
from tqdm import tqdm
import json
import csv
from collections import defaultdict

class PersonalDataExtractor:
    def __init__(self):
        """初始化提取器"""
        self.phone_patterns = self._init_phone_patterns()
        self.address_keywords = self._init_address_keywords()
        self.name_keywords = self._init_name_keywords()
        
        # 统计信息
        self.stats = {
            'phones': set(),
            'addresses': set(),
            'names': set(),
            'total_lines': 0,
            'processed_lines': 0
        }
    
    def _init_phone_patterns(self) -> List[re.Pattern]:
        """初始化手机号正则表达式"""
        patterns = [
            # 中国手机号：11位，1开头，第二位为3-9
            r'1[3-9]\d{9}',
            # 带分隔符的手机号
            r'1[3-9]\d{4}[\s\-\.]?\d{4}',
            # 带国际区号的手机号
            r'\+?86[\s\-]?1[3-9]\d{9}',
            # 带括号的手机号
            r'\(1[3-9]\d{9}\)',
            # 其他常见格式
            r'1[3-9]\d{1,4}[\s\-\.]?\d{4,5}',
        ]
        return [re.compile(pattern) for pattern in patterns]
    
    def _init_address_keywords(self) -> Set[str]:
        """初始化地址关键词"""
        # 省市区县关键词
        provinces = ['省', '自治区', '特别行政区']
        cities = ['市', '州', '盟', '地区']
        districts = ['区', '县', '旗', '镇', '乡', '街道', '村', '社区']
        
        # 具体地址关键词
        address_words = [
            '路', '街', '巷', '弄', '号', '栋', '单元', '室', '层', '楼',
            '小区', '花园', '广场', '中心', '大厦', '写字楼', '商场',
            '学校', '医院', '银行', '超市', '市场', '公园', '车站',
            '机场', '码头', '港口', '火车站', '汽车站', '地铁站',
            '东', '西', '南', '北', '中', '内', '外', '前', '后', '左', '右'
        ]
        
        # 中国省份和城市（部分）
        locations = [
            '北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
            '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
            '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃',
            '青海', '宁夏', '新疆', '内蒙古', '香港', '澳门', '台湾'
        ]
        
        keywords = set()
        keywords.update(provinces)
        keywords.update(cities)
        keywords.update(districts)
        keywords.update(address_words)
        keywords.update(locations)
        
        return keywords
    
    def _init_name_keywords(self) -> Set[str]:
        """初始化姓名关键词"""
        # 常见姓氏
        surnames = [
            '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
            '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
            '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
            '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
            '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎'
        ]
        
        # 常见名字用字
        name_chars = [
            '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军',
            '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
            '平', '刚', '桂英', '华', '文', '红', '玉', '秀珍', '秀华',
            '建国', '建华', '志强', '志明', '志华', '志军', '志平', '志刚'
        ]
        
        keywords = set()
        keywords.update(surnames)
        keywords.update(name_chars)
        
        return keywords
    
    def extract_phones(self, text: str) -> List[str]:
        """提取手机号"""
        phones = []
        for pattern in self.phone_patterns:
            matches = pattern.findall(text)
            for match in matches:
                # 清理手机号格式
                clean_phone = re.sub(r'[\s\-\.\(\)\+]', '', match)
                if len(clean_phone) == 11 and clean_phone.startswith('1'):
                    phones.append(clean_phone)
        return phones
    
    def extract_addresses(self, text: str) -> List[str]:
        """提取地址信息"""
        addresses = []
        
        # 使用jieba分词
        words = pseg.cut(text)
        
        # 寻找包含地址关键词的片段
        current_address = []
        for word, flag in words:
            if any(keyword in word for keyword in self.address_keywords):
                current_address.append(word)
                # 如果当前片段足够长，认为是一个地址
                if len(current_address) >= 3:
                    address = ''.join(current_address)
                    if len(address) >= 6:  # 地址至少6个字符
                        addresses.append(address)
                        current_address = []
            else:
                if current_address:
                    # 如果遇到非地址词，检查当前累积的是否是有效地址
                    if len(current_address) >= 2:
                        address = ''.join(current_address)
                        if len(address) >= 4:
                            addresses.append(address)
                    current_address = []
        
        # 处理最后剩余的地址片段
        if current_address and len(current_address) >= 2:
            address = ''.join(current_address)
            if len(address) >= 4:
                addresses.append(address)
        
        return addresses
    
    def extract_names(self, text: str) -> List[str]:
        """提取人名"""
        names = []
        
        # 使用jieba分词
        words = pseg.cut(text)
        
        # 寻找可能的姓名
        for word, flag in words:
            if flag == 'nr' or (len(word) >= 2 and len(word) <= 4):
                # 检查是否包含姓氏关键词
                if any(surname in word for surname in self.name_keywords):
                    # 进一步验证是否为合理的人名
                    if self._is_valid_name(word):
                        names.append(word)
        
        return names
    
    def _is_valid_name(self, word: str) -> bool:
        """验证是否为有效的人名"""
        if len(word) < 2 or len(word) > 4:
            return False
        
        # 检查是否包含常见姓氏
        has_surname = any(surname in word for surname in self.name_keywords)
        if not has_surname:
            return False
        
        # 检查是否包含非中文字符
        if not re.match(r'^[\u4e00-\u9fff]+$', word):
            return False
        
        return True
    
    def process_line(self, line: str) -> Dict[str, List[str]]:
        """处理单行文本"""
        result = {
            'phones': self.extract_phones(line),
            'addresses': self.extract_addresses(line),
            'names': self.extract_names(line)
        }
        
        # 更新统计信息
        self.stats['phones'].update(result['phones'])
        self.stats['addresses'].update(result['addresses'])
        self.stats['names'].update(result['names'])
        self.stats['processed_lines'] += 1
        
        return result
    
    def process_file(self, file_path: str, chunk_size: int = 1024 * 1024) -> Dict[str, List[str]]:
        """处理大文件"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        file_size = os.path.getsize(file_path)
        print(f"文件大小: {file_size / (1024*1024):.2f} MB")
        
        results = {
            'phones': set(),
            'addresses': set(),
            'names': set()
        }
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            with tqdm(total=file_size, unit='B', unit_scale=True, desc="处理进度") as pbar:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    
                    # 按行分割处理
                    lines = chunk.split('\n')
                    for line in lines:
                        if line.strip():
                            line_result = self.process_line(line)
                            results['phones'].update(line_result['phones'])
                            results['addresses'].update(line_result['addresses'])
                            results['names'].update(line_result['names'])
                            self.stats['total_lines'] += 1
                    
                    pbar.update(len(chunk))
        
        # 转换为列表
        for key in results:
            results[key] = list(results[key])
        
        return results
    
    def save_results(self, results: Dict[str, List[str]], output_dir: str = "extracted_data"):
        """保存提取结果"""
        os.makedirs(output_dir, exist_ok=True)
        
        # 保存为JSON格式
        json_file = os.path.join(output_dir, "extracted_data.json")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        # 保存为CSV格式
        for data_type, data_list in results.items():
            csv_file = os.path.join(output_dir, f"{data_type}.csv")
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([data_type])
                for item in data_list:
                    writer.writerow([item])
        
        # 保存统计信息
        stats_file = os.path.join(output_dir, "statistics.txt")
        with open(stats_file, 'w', encoding='utf-8') as f:
            f.write("提取统计信息\n")
            f.write("=" * 50 + "\n")
            f.write(f"总行数: {self.stats['total_lines']}\n")
            f.write(f"处理行数: {self.stats['processed_lines']}\n")
            f.write(f"手机号数量: {len(results['phones'])}\n")
            f.write(f"地址数量: {len(results['addresses'])}\n")
            f.write(f"人名数量: {len(results['names'])}\n")
        
        print(f"\n结果已保存到目录: {output_dir}")
        print(f"JSON文件: {json_file}")
        print(f"统计信息: {stats_file}")

def main():
    parser = argparse.ArgumentParser(description='从大文件中提取个人信息')
    parser.add_argument('file_path', help='要处理的文件路径')
    parser.add_argument('--output', '-o', default='extracted_data', help='输出目录')
    parser.add_argument('--chunk-size', '-c', type=int, default=1024*1024, help='处理块大小（字节）')
    
    args = parser.parse_args()
    
    try:
        extractor = PersonalDataExtractor()
        print("开始提取个人信息...")
        
        results = extractor.process_file(args.file_path, args.chunk_size)
        
        print(f"\n提取完成！")
        print(f"手机号: {len(results['phones'])} 个")
        print(f"地址: {len(results['addresses'])} 个")
        print(f"人名: {len(results['names'])} 个")
        
        # 保存结果
        extractor.save_results(results, args.output)
        
        # 显示部分结果
        print("\n部分提取结果:")
        print("手机号示例:", results['phones'][:5])
        print("地址示例:", results['addresses'][:5])
        print("人名示例:", results['names'][:5])
        
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()