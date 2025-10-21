#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
手机号和地址提取工具演示脚本
"""

import os
from extract_phone_address import PhoneAddressExtractor

def demo():
    print("=" * 60)
    print("大文件手机号和地址提取工具演示")
    print("=" * 60)
    
    # 创建提取器实例
    extractor = PhoneAddressExtractor()
    
    # 演示文本
    demo_text = """
    客户信息记录：
    
    张三，手机：13812345678，地址：北京市朝阳区建国路88号SOHO现代城A座1201室
    李四，电话：+86 13987654321，住址：上海市浦东新区陆家嘴金融贸易区世纪大道100号环球金融中心50楼
    王五，联系方式：139 8765 4321，工作地点：广州市天河区珠江新城花城大道85号高德置地广场B2栋2801室
    
    其他联系信息：
    手机号码：15012345678
    地址：深圳市南山区科技园南区深南大道9988号
    电话：186-1234-5678
    住所：杭州市西湖区文三路259号昌地火炬大厦1号楼15层
    
    特殊格式测试：
    手机：(+86)138-8888-8888
    地址：苏州市工业园区苏州大道东278号领汇广场1幢2201室
    """
    
    print("演示文本：")
    print(demo_text)
    print("\n" + "="*60)
    
    # 提取手机号
    phones = extractor.extract_phones(demo_text)
    print(f"\n提取到的手机号 ({len(phones)} 个):")
    for i, phone in enumerate(sorted(phones), 1):
        print(f"  {i}. {phone}")
    
    # 提取地址
    addresses = extractor.extract_addresses(demo_text)
    print(f"\n提取到的地址 ({len(addresses)} 个):")
    for i, address in enumerate(sorted(addresses), 1):
        print(f"  {i}. {address}")
    
    print("\n" + "="*60)
    print("演示完成！")
    print("\n使用方法：")
    print("python3 extract_phone_address.py <文件路径>")
    print("python3 extract_phone_address.py sample_data.txt")
    print("python3 extract_phone_address.py large_file.txt --chunk-size 32768")

if __name__ == "__main__":
    demo()