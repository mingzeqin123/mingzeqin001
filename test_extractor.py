#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
手机号和地址提取器测试脚本
"""

import os
import tempfile
from phone_address_extractor import PhoneAddressExtractor

def create_test_file():
    """创建一个测试文件，包含手机号和地址信息"""
    test_content = """
用户信息表
姓名: 张三
手机号: 13812345678
地址: 北京市朝阳区建国门外大街1号

姓名: 李四  
手机: 15987654321
住址: 上海市浦东新区陆家嘴环路1000号

联系人: 王五
电话: 18612345678
地址: 广东省深圳市南山区科技园南区深南大道9988号

客户信息:
姓名: 赵六
手机号码: 17712345678
详细地址: 江苏省南京市鼓楼区中山路321号

测试数据:
手机: 18888888888
地址: 浙江省杭州市西湖区文三路259号

联系方式: 13999999999
位置: 四川省成都市武侯区天府大道中段1388号

其他信息:
电话: 15555555555
住址: 湖北省武汉市江汉区解放大道688号

手机号: 13333333333
地址: 陕西省西安市雁塔区高新路88号

联系电话: 14444444444
地址: 山东省济南市历下区经十路12345号

手机: 16666666666
地址: 河南省郑州市金水区花园路1号
"""
    
    # 创建临时文件
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False, suffix='.txt') as f:
        f.write(test_content)
        return f.name

def test_extractor():
    """测试提取器功能"""
    print("=== 手机号和地址提取器测试 ===\n")
    
    # 创建测试文件
    test_file = create_test_file()
    print(f"创建测试文件: {test_file}")
    
    try:
        # 创建提取器
        extractor = PhoneAddressExtractor()
        
        # 读取测试文件
        with open(test_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取手机号
        phones = extractor.extract_phones(content)
        print(f"\n提取到的手机号 ({len(phones)}个):")
        for phone in sorted(phones):
            print(f"  {phone}")
        
        # 提取地址
        addresses = extractor.extract_addresses(content)
        print(f"\n提取到的地址 ({len(addresses)}个):")
        for addr in sorted(addresses):
            print(f"  {addr}")
        
        # 测试流式处理
        print(f"\n=== 测试流式处理 ===")
        phones_stream, addresses_stream = extractor.process_file_streaming(test_file, chunk_size=100)
        
        print(f"流式处理结果:")
        print(f"  手机号: {len(phones_stream)}个")
        print(f"  地址: {len(addresses_stream)}个")
        
        # 保存结果
        output_file = "test_results.json"
        extractor.save_results(phones_stream, addresses_stream, output_file)
        print(f"\n结果已保存到: {output_file}")
        
    finally:
        # 清理测试文件
        os.unlink(test_file)
        print(f"\n已清理测试文件: {test_file}")

if __name__ == "__main__":
    test_extractor()