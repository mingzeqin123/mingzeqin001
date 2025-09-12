#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
行政区划爬虫使用示例
演示如何使用RegionCrawler类进行数据爬取和分析
"""

from region_crawler import RegionCrawler
import json


def example_basic_usage():
    """基本使用示例"""
    print("=" * 60)
    print("基本使用示例")
    print("=" * 60)
    
    # 创建爬虫实例
    crawler = RegionCrawler()
    
    # 爬取所有数据（包括区县）
    print("正在爬取数据...")
    regions_data = crawler.crawl_all_regions(include_counties=True)
    
    # 显示统计信息
    stats = crawler.get_statistics()
    print(f"\n数据统计:")
    print(f"省份数量: {stats['total_provinces']}")
    print(f"城市数量: {stats['total_cities']}")
    print(f"区县数量: {stats['total_counties']}")
    print(f"总计: {stats['total_regions']} 个行政区划")
    
    # 保存数据
    crawler.save_to_json("example_regions.json")
    crawler.save_to_csv("example_regions.csv")
    print("\n数据已保存到 example_regions.json 和 example_regions.csv")


def example_province_analysis():
    """省份分析示例"""
    print("\n" + "=" * 60)
    print("省份分析示例")
    print("=" * 60)
    
    # 加载数据
    try:
        with open("regions_data.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("请先运行 region_crawler.py 生成数据文件")
        return
    
    # 分析省份数据
    provinces = data.get('provinces', [])
    print(f"全国共有 {len(provinces)} 个省级行政区")
    
    # 按名称长度排序
    provinces_by_length = sorted(provinces, key=lambda x: len(x['name']), reverse=True)
    print("\n名称最长的省份:")
    for i, province in enumerate(provinces_by_length[:5]):
        print(f"{i+1}. {province['name']} ({len(province['name'])} 个字符)")
    
    # 直辖市和自治区统计
    municipalities = [p for p in provinces if '市' in p['name'] and len(p['name']) <= 3]
    autonomous_regions = [p for p in provinces if '自治区' in p['name']]
    special_regions = [p for p in provinces if '特别行政区' in p['name']]
    
    print(f"\n直辖市: {len(municipalities)} 个")
    for province in municipalities:
        print(f"  - {province['name']}")
    
    print(f"\n自治区: {len(autonomous_regions)} 个")
    for province in autonomous_regions:
        print(f"  - {province['name']}")
    
    print(f"\n特别行政区: {len(special_regions)} 个")
    for province in special_regions:
        print(f"  - {province['name']}")


def example_city_analysis():
    """城市分析示例"""
    print("\n" + "=" * 60)
    print("城市分析示例")
    print("=" * 60)
    
    # 加载数据
    try:
        with open("regions_data.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("请先运行 region_crawler.py 生成数据文件")
        return
    
    cities = data.get('cities', [])
    print(f"全国共有 {len(cities)} 个市级行政区")
    
    # 按省份统计城市数量
    province_city_count = {}
    for city in cities:
        parent_code = city['parent_code']
        for province in data.get('provinces', []):
            if province['code'] == parent_code:
                province_name = province['name']
                province_city_count[province_name] = province_city_count.get(province_name, 0) + 1
                break
    
    # 显示城市数量最多的省份
    sorted_provinces = sorted(province_city_count.items(), key=lambda x: x[1], reverse=True)
    print("\n城市数量最多的省份:")
    for i, (province, count) in enumerate(sorted_provinces[:10]):
        print(f"{i+1:2d}. {province}: {count} 个城市")


def example_county_analysis():
    """区县分析示例"""
    print("\n" + "=" * 60)
    print("区县分析示例")
    print("=" * 60)
    
    # 加载数据
    try:
        with open("regions_data.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("请先运行 region_crawler.py 生成数据文件")
        return
    
    counties = data.get('counties', [])
    print(f"全国共有 {len(counties)} 个区县级行政区")
    
    # 按城市统计区县数量
    city_county_count = {}
    for county in counties:
        parent_code = county['parent_code']
        for city in data.get('cities', []):
            if city['code'] == parent_code:
                city_name = city['name']
                city_county_count[city_name] = city_county_count.get(city_name, 0) + 1
                break
    
    # 显示区县数量最多的城市
    sorted_cities = sorted(city_county_count.items(), key=lambda x: x[1], reverse=True)
    print("\n区县数量最多的城市:")
    for i, (city, count) in enumerate(sorted_cities[:10]):
        print(f"{i+1:2d}. {city}: {count} 个区县")


def example_data_export():
    """数据导出示例"""
    print("\n" + "=" * 60)
    print("数据导出示例")
    print("=" * 60)
    
    # 加载数据
    try:
        with open("regions_data.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("请先运行 region_crawler.py 生成数据文件")
        return
    
    # 导出特定省份的数据
    target_province = "广东省"
    province_code = None
    
    # 找到目标省份
    for province in data.get('provinces', []):
        if province['name'] == target_province:
            province_code = province['code']
            break
    
    if not province_code:
        print(f"找不到省份: {target_province}")
        return
    
    # 收集该省份的所有数据
    province_data = {
        'province': None,
        'cities': [],
        'counties': []
    }
    
    # 添加省份信息
    for province in data.get('provinces', []):
        if province['code'] == province_code:
            province_data['province'] = province
            break
    
    # 添加城市信息
    for city in data.get('cities', []):
        if city['parent_code'] == province_code:
            province_data['cities'].append(city)
    
    # 添加区县信息
    for county in data.get('counties', []):
        for city in province_data['cities']:
            if county['parent_code'] == city['code']:
                province_data['counties'].append(county)
                break
    
    # 保存到文件
    filename = f"{target_province}_regions.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(province_data, f, ensure_ascii=False, indent=2)
    
    print(f"已导出 {target_province} 的行政区划数据到 {filename}")
    print(f"包含 {len(province_data['cities'])} 个城市，{len(province_data['counties'])} 个区县")


def main():
    """主函数"""
    print("行政区划爬虫使用示例")
    print("本示例将演示如何使用RegionCrawler类进行数据爬取和分析")
    
    # 运行各种示例
    example_basic_usage()
    example_province_analysis()
    example_city_analysis()
    example_county_analysis()
    example_data_export()
    
    print("\n" + "=" * 60)
    print("示例运行完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()