#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
手机号和地址提取器使用示例
"""

import subprocess
import sys
import os

def run_extractor_example():
    """运行提取器示例"""
    print("=== 手机号和地址提取器使用示例 ===\n")
    
    # 检查主脚本是否存在
    if not os.path.exists('phone_address_extractor.py'):
        print("错误: phone_address_extractor.py 文件不存在")
        return
    
    print("1. 基本用法示例:")
    print("   python3 phone_address_extractor.py your_file.txt")
    print()
    
    print("2. 指定输出文件:")
    print("   python3 phone_address_extractor.py your_file.txt -o results.json")
    print()
    
    print("3. 只提取手机号:")
    print("   python3 phone_address_extractor.py your_file.txt --phones-only")
    print()
    
    print("4. 只提取地址:")
    print("   python3 phone_address_extractor.py your_file.txt --addresses-only")
    print()
    
    print("5. 调整处理块大小 (2MB):")
    print("   python3 phone_address_extractor.py your_file.txt -c 2097152")
    print()
    
    print("6. 查看帮助信息:")
    print("   python3 phone_address_extractor.py --help")
    print()
    
    # 显示帮助信息
    print("=== 帮助信息 ===")
    try:
        result = subprocess.run([
            'python3', 'phone_address_extractor.py', '--help'
        ], capture_output=True, text=True)
        print(result.stdout)
    except Exception as e:
        print(f"无法运行帮助命令: {e}")

def create_sample_data():
    """创建示例数据文件"""
    sample_data = """
客户信息数据库
================

客户001:
姓名: 张三
手机: 13812345678
地址: 北京市朝阳区建国门外大街1号国贸大厦A座

客户002:
姓名: 李四
电话: 15987654321
住址: 上海市浦东新区陆家嘴环路1000号上海中心大厦

客户003:
联系人: 王五
手机号: 18612345678
详细地址: 广东省深圳市南山区科技园南区深南大道9988号

客户004:
姓名: 赵六
联系电话: 17712345678
地址: 江苏省南京市鼓楼区中山路321号

客户005:
客户: 钱七
手机: 18888888888
位置: 四川省成都市武侯区天府大道中段1388号

客户006:
姓名: 孙八
电话: 15555555555
住址: 湖北省武汉市江汉区解放大道688号

客户007:
联系人: 周九
手机号码: 13333333333
地址: 陕西省西安市雁塔区高新路88号

客户008:
客户: 吴十
手机: 14444444444
住址: 山东省济南市历下区经十路12345号

客户009:
姓名: 郑十一
电话: 16666666666
地址: 河南省郑州市金水区花园路1号

客户010:
客户: 王十二
手机: 19999999999
住址: 浙江省杭州市西湖区文三路259号
"""
    
    with open('sample_data.txt', 'w', encoding='utf-8') as f:
        f.write(sample_data)
    
    print("已创建示例数据文件: sample_data.txt")
    return 'sample_data.txt'

def demo_extraction():
    """演示提取过程"""
    print("\n=== 演示提取过程 ===")
    
    # 创建示例数据
    sample_file = create_sample_data()
    
    try:
        # 运行提取器
        print(f"\n正在处理文件: {sample_file}")
        result = subprocess.run([
            'python3', 'phone_address_extractor.py', 
            sample_file, 
            '-o', 'demo_results.json'
        ], capture_output=True, text=True)
        
        print("提取器输出:")
        print(result.stdout)
        
        if result.stderr:
            print("错误信息:")
            print(result.stderr)
        
        # 显示结果
        if os.path.exists('demo_results.json'):
            print("\n=== 提取结果 ===")
            with open('demo_results.json', 'r', encoding='utf-8') as f:
                import json
                data = json.load(f)
                print(f"手机号数量: {data['phone_count']}")
                print(f"地址数量: {data['address_count']}")
                print(f"提取时间: {data['extraction_time']}")
                
                print(f"\n手机号列表:")
                for phone in sorted(data['phones']):
                    print(f"  {phone}")
                
                print(f"\n地址列表 (前10个):")
                for addr in sorted(data['addresses'])[:10]:
                    print(f"  {addr}")
    
    finally:
        # 清理文件
        if os.path.exists(sample_file):
            os.remove(sample_file)
        print(f"\n已清理示例文件: {sample_file}")

if __name__ == "__main__":
    run_extractor_example()
    demo_extraction()