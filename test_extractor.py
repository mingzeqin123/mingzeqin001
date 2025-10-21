#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试个人信息提取工具
"""

from extract_personal_data import PersonalDataExtractor
import tempfile
import os

def create_test_file():
    """创建测试文件"""
    test_content = """
    张三，手机号：13812345678，地址：北京市朝阳区建国门外大街1号
    李四的联系方式是13987654321，住在上海市浦东新区陆家嘴金融贸易区
    王五 13711111111 广州市天河区珠江新城花城大道85号
    赵六的电话是+86-13666666666，地址：深圳市南山区科技园南区
    陈七，手机：(13777777777)，住址：杭州市西湖区文三路259号
    刘八 13888888888 成都市锦江区春熙路123号
    杨九的联系电话是13999999999，家庭住址：武汉市江汉区中山大道818号
    黄十，手机号13800000000，地址：西安市雁塔区小寨西路126号
    """
    
    # 创建临时文件
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False, suffix='.txt') as f:
        f.write(test_content)
        return f.name

def test_extractor():
    """测试提取器"""
    print("创建测试文件...")
    test_file = create_test_file()
    
    try:
        print("初始化提取器...")
        extractor = PersonalDataExtractor()
        
        print("开始提取测试...")
        results = extractor.process_file(test_file)
        
        print("\n=== 提取结果 ===")
        print(f"手机号数量: {len(results['phones'])}")
        print("手机号列表:", results['phones'])
        
        print(f"\n地址数量: {len(results['addresses'])}")
        print("地址列表:", results['addresses'])
        
        print(f"\n人名数量: {len(results['names'])}")
        print("人名列表:", results['names'])
        
        print("\n=== 统计信息 ===")
        print(f"总行数: {extractor.stats['total_lines']}")
        print(f"处理行数: {extractor.stats['processed_lines']}")
        
        # 保存结果
        print("\n保存测试结果...")
        extractor.save_results(results, "test_output")
        
        print("\n测试完成！")
        
    finally:
        # 清理临时文件
        if os.path.exists(test_file):
            os.unlink(test_file)

if __name__ == "__main__":
    test_extractor()