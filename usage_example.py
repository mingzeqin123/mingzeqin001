#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
个人信息提取工具使用示例
演示如何处理不同大小的文件
"""

import os
import sys
from extract_personal_data import PersonalDataExtractor
from create_test_data import generate_test_data

def demo_small_file():
    """演示处理小文件"""
    print("=== 演示1: 处理小文件 (1MB) ===")
    
    # 生成1MB测试文件
    test_file = "small_test.txt"
    generate_test_data(test_file, 1)
    
    # 提取数据
    extractor = PersonalDataExtractor()
    extractor.process_file(test_file)
    extractor.print_summary()
    extractor.save_results("small_results")
    
    # 清理
    os.remove(test_file)
    print("\n")

def demo_medium_file():
    """演示处理中等文件"""
    print("=== 演示2: 处理中等文件 (50MB) ===")
    
    # 生成50MB测试文件
    test_file = "medium_test.txt"
    generate_test_data(test_file, 50)
    
    # 提取数据
    extractor = PersonalDataExtractor()
    extractor.process_file(test_file, chunk_size=16384)  # 更大的块大小
    extractor.print_summary()
    extractor.save_results("medium_results")
    
    # 清理
    os.remove(test_file)
    print("\n")

def demo_large_file():
    """演示处理大文件 (仅创建，不实际处理以节省时间)"""
    print("=== 演示3: 大文件处理说明 ===")
    
    print("对于1GB+的大文件，使用以下命令:")
    print("python3 extract_personal_data.py your_large_file.txt -c 32768")
    print()
    print("性能建议:")
    print("- SSD存储: chunk_size = 32768 或更大")
    print("- 机械硬盘: chunk_size = 8192")
    print("- 网络存储: chunk_size = 4096")
    print()
    print("内存使用:")
    print("- 无论文件多大，内存占用都很小(几MB)")
    print("- 可以处理TB级别的文件")
    print("\n")

def demo_custom_patterns():
    """演示自定义提取模式"""
    print("=== 演示4: 自定义提取模式 ===")
    
    # 创建自定义提取器
    class CustomExtractor(PersonalDataExtractor):
        def __init__(self):
            super().__init__()
            # 添加自定义模式
            self.phone_patterns.extend([
                r'电话[:：]\s*(\d{3,4}-\d{7,8})',  # 固定电话
                r'TEL[:：]\s*(\d{11})',  # 英文标签
            ])
            
            self.name_patterns.extend([
                r'Mr\.?\s*([\u4e00-\u9fa5]{2,4})',  # 英文敬语
                r'联系人[:：]\s*([\u4e00-\u9fa5]{2,4})',  # 联系人标签
            ])
            
            # 重新编译正则表达式
            self.compiled_patterns = {
                'phones': [re.compile(pattern) for pattern in self.phone_patterns],
                'names': [re.compile(pattern) for pattern in self.name_patterns],
                'addresses': [re.compile(pattern) for pattern in self.address_patterns]
            }
    
    # 创建包含自定义格式的测试数据
    test_content = """
    客户信息记录:
    姓名: 张三 电话: 021-12345678 手机: 13812345678
    Mr. 李四 TEL: 15987654321
    联系人: 王五 地址: 上海市浦东新区张江高科技园区
    """
    
    with open("custom_test.txt", "w", encoding="utf-8") as f:
        f.write(test_content * 100)  # 重复内容
    
    # 使用自定义提取器
    extractor = CustomExtractor()
    extractor.process_file("custom_test.txt")
    extractor.print_summary()
    
    # 清理
    os.remove("custom_test.txt")
    print("\n")

def performance_comparison():
    """性能对比测试"""
    print("=== 演示5: 性能对比 ===")
    
    import time
    
    # 生成测试文件
    test_file = "perf_test.txt"
    generate_test_data(test_file, 10)
    
    chunk_sizes = [4096, 8192, 16384, 32768]
    
    for chunk_size in chunk_sizes:
        extractor = PersonalDataExtractor()
        start_time = time.time()
        
        extractor.process_file(test_file, chunk_size=chunk_size)
        
        end_time = time.time()
        processing_time = end_time - start_time
        speed = extractor.stats['lines_processed'] / processing_time
        
        print(f"块大小 {chunk_size:5d}: {processing_time:.2f}秒, {speed:.0f} 行/秒")
    
    # 清理
    os.remove(test_file)
    print("\n")

def main():
    """主函数"""
    print("个人信息提取工具 - 使用示例")
    print("=" * 50)
    
    try:
        # 运行各种演示
        demo_small_file()
        demo_custom_patterns()
        demo_large_file()
        performance_comparison()
        
        print("所有演示完成!")
        print("\n使用说明:")
        print("1. 基本用法: python3 extract_personal_data.py your_file.txt")
        print("2. 指定输出: python3 extract_personal_data.py your_file.txt -o results")
        print("3. 调整性能: python3 extract_personal_data.py your_file.txt -c 16384")
        
    except KeyboardInterrupt:
        print("\n演示被用户中断")
    except Exception as e:
        print(f"演示过程中出错: {e}")

if __name__ == "__main__":
    main()