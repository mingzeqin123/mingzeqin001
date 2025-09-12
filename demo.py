#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中国行政区划爬虫演示脚本
展示如何使用不同版本的爬虫获取数据
"""

import json
import sys
import os

def demo_simple_crawler():
    """演示简化版爬虫"""
    print("=" * 50)
    print("演示：简化版爬虫")
    print("=" * 50)
    
    try:
        from simple_china_crawler import SimpleChinaAdministrativeCrawler
        
        crawler = SimpleChinaAdministrativeCrawler()
        print("✅ 简化版爬虫初始化成功")
        
        # 获取预定义数据
        data = crawler.get_predefined_data()
        print(f"📊 获取到 {len(data)} 条记录")
        
        # 显示前5条数据
        print("\n前5条数据示例：")
        for i, item in enumerate(data[:5]):
            print(f"{i+1}. {item['full_path']} ({item['level']})")
            
        return True
        
    except Exception as e:
        print(f"❌ 简化版爬虫演示失败: {e}")
        return False

def demo_enhanced_crawler():
    """演示增强版爬虫"""
    print("\n" + "=" * 50)
    print("演示：增强版爬虫")
    print("=" * 50)
    
    try:
        from enhanced_china_crawler import EnhancedChinaAdministrativeCrawler
        
        crawler = EnhancedChinaAdministrativeCrawler()
        print("✅ 增强版爬虫初始化成功")
        
        # 获取全面数据
        data = crawler.get_comprehensive_data()
        print(f"📊 获取到 {len(data)} 条记录")
        
        # 统计各级别数量
        level_counts = {}
        for item in data:
            level = item.get('level', '未知')
            level_counts[level] = level_counts.get(level, 0) + 1
        
        print("\n按级别统计：")
        for level, count in sorted(level_counts.items()):
            print(f"  {level}: {count} 条")
        
        # 显示各省份
        provinces = [item for item in data if item['level'] == '省']
        print(f"\n34个省级行政区：")
        for i, province in enumerate(provinces, 1):
            print(f"{i:2d}. {province['name']} ({province['type']})")
            
        return True
        
    except Exception as e:
        print(f"❌ 增强版爬虫演示失败: {e}")
        return False

def demo_data_analysis():
    """演示数据分析"""
    print("\n" + "=" * 50)
    print("演示：数据分析")
    print("=" * 50)
    
    try:
        # 尝试读取已生成的数据文件
        json_files = [
            'enhanced_china_administrative_divisions.json',
            'china_administrative_divisions.json'
        ]
        
        data = None
        for filename in json_files:
            if os.path.exists(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print(f"✅ 成功读取数据文件: {filename}")
                break
        
        if not data:
            print("⚠️  没有找到数据文件，请先运行爬虫")
            return False
        
        print(f"📊 数据总量: {len(data)} 条记录")
        
        # 分析数据结构
        print("\n数据结构分析：")
        if data:
            sample = data[0]
            print("字段列表：")
            for key, value in sample.items():
                print(f"  - {key}: {type(value).__name__} (示例: {value})")
        
        # 地区分布分析
        print("\n地区分布分析：")
        provinces = {}
        for item in data:
            if item['level'] == '省':
                provinces[item['name']] = {'cities': 0, 'districts': 0}
        
        for item in data:
            if item['level'] == '市':
                parent = item.get('parent_name', '')
                if parent in provinces:
                    provinces[parent]['cities'] += 1
            elif item['level'] == '区县':
                path_parts = item.get('full_path', '').split('/')
                if len(path_parts) >= 1 and path_parts[0] in provinces:
                    provinces[path_parts[0]]['districts'] += 1
        
        # 显示数据最多的省份
        sorted_provinces = sorted(provinces.items(), 
                                key=lambda x: x[1]['cities'] + x[1]['districts'], 
                                reverse=True)
        
        print("数据最多的前10个省份：")
        for i, (province, stats) in enumerate(sorted_provinces[:10], 1):
            total = stats['cities'] + stats['districts']
            print(f"{i:2d}. {province}: {total}条 (市:{stats['cities']}, 区县:{stats['districts']})")
        
        return True
        
    except Exception as e:
        print(f"❌ 数据分析演示失败: {e}")
        return False

def main():
    """主演示函数"""
    print("🇨🇳 中国行政区划爬虫演示")
    print("本演示将展示不同版本爬虫的功能和用法")
    
    # 演示简化版爬虫
    success1 = demo_simple_crawler()
    
    # 演示增强版爬虫
    success2 = demo_enhanced_crawler()
    
    # 演示数据分析
    success3 = demo_data_analysis()
    
    # 总结
    print("\n" + "=" * 50)
    print("演示总结")
    print("=" * 50)
    
    results = [
        ("简化版爬虫", success1),
        ("增强版爬虫", success2),
        ("数据分析", success3)
    ]
    
    for name, success in results:
        status = "✅ 成功" if success else "❌ 失败"
        print(f"{name}: {status}")
    
    successful_count = sum(1 for _, success in results if success)
    print(f"\n演示完成！成功 {successful_count}/{len(results)} 项")
    
    if successful_count == len(results):
        print("\n🎉 所有演示都成功完成！")
        print("\n📝 使用建议：")
        print("1. 新手用户推荐使用简化版爬虫")
        print("2. 需要完整数据推荐使用增强版爬虫")
        print("3. 可以根据需要修改代码以适应特定需求")
    else:
        print("\n⚠️  部分演示未成功，请检查环境配置")

if __name__ == '__main__':
    main()