#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
行政区划数据查看工具
用于查看和分析爬取的行政区划数据
"""

import json
import csv
import sys
from typing import Dict, List


def load_json_data(filename: str = "regions_data.json") -> Dict:
    """加载JSON格式的数据"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误：找不到文件 {filename}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误：JSON文件格式错误 - {e}")
        sys.exit(1)


def load_csv_data(filename: str = "regions_data.csv") -> List[Dict]:
    """加载CSV格式的数据"""
    try:
        data = []
        with open(filename, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
        return data
    except FileNotFoundError:
        print(f"错误：找不到文件 {filename}")
        sys.exit(1)


def show_statistics(data: Dict):
    """显示数据统计信息"""
    print("=" * 50)
    print("行政区划数据统计")
    print("=" * 50)
    
    provinces_count = len(data.get('provinces', []))
    cities_count = len(data.get('cities', []))
    counties_count = len(data.get('counties', []))
    total_count = provinces_count + cities_count + counties_count
    
    print(f"省份数量: {provinces_count}")
    print(f"城市数量: {cities_count}")
    print(f"区县数量: {counties_count}")
    print(f"总计: {total_count} 个行政区划")
    print()


def show_provinces(data: Dict, limit: int = 10):
    """显示省份列表"""
    print("=" * 50)
    print("省份列表")
    print("=" * 50)
    
    provinces = data.get('provinces', [])
    for i, province in enumerate(provinces[:limit]):
        print(f"{i+1:2d}. {province['name']} ({province['code']})")
    
    if len(provinces) > limit:
        print(f"... 还有 {len(provinces) - limit} 个省份")
    print()


def show_cities_by_province(data: Dict, province_name: str, limit: int = 10):
    """显示指定省份的城市列表"""
    print("=" * 50)
    print(f"{province_name} 的城市列表")
    print("=" * 50)
    
    # 找到省份代码
    province_code = None
    for province in data.get('provinces', []):
        if province['name'] == province_name:
            province_code = province['code']
            break
    
    if not province_code:
        print(f"错误：找不到省份 '{province_name}'")
        return
    
    # 找到该省份的城市
    cities = []
    for city in data.get('cities', []):
        if city['parent_code'] == province_code:
            cities.append(city)
    
    if not cities:
        print(f"没有找到 {province_name} 的城市数据")
        return
    
    for i, city in enumerate(cities[:limit]):
        print(f"{i+1:2d}. {city['name']} ({city['code']})")
    
    if len(cities) > limit:
        print(f"... 还有 {len(cities) - limit} 个城市")
    print()


def show_counties_by_city(data: Dict, city_name: str, limit: int = 10):
    """显示指定城市的区县列表"""
    print("=" * 50)
    print(f"{city_name} 的区县列表")
    print("=" * 50)
    
    # 找到城市代码
    city_code = None
    for city in data.get('cities', []):
        if city['name'] == city_name:
            city_code = city['code']
            break
    
    if not city_code:
        print(f"错误：找不到城市 '{city_name}'")
        return
    
    # 找到该城市的区县
    counties = []
    for county in data.get('counties', []):
        if county['parent_code'] == city_code:
            counties.append(county)
    
    if not counties:
        print(f"没有找到 {city_name} 的区县数据")
        return
    
    for i, county in enumerate(counties[:limit]):
        print(f"{i+1:2d}. {county['name']} ({county['code']})")
    
    if len(counties) > limit:
        print(f"... 还有 {len(counties) - limit} 个区县")
    print()


def search_region(data: Dict, keyword: str):
    """搜索行政区划"""
    print("=" * 50)
    print(f"搜索结果：'{keyword}'")
    print("=" * 50)
    
    results = []
    
    # 搜索省份
    for province in data.get('provinces', []):
        if keyword in province['name']:
            results.append(('省份', province))
    
    # 搜索城市
    for city in data.get('cities', []):
        if keyword in city['name']:
            results.append(('城市', city))
    
    # 搜索区县
    for county in data.get('counties', []):
        if keyword in county['name']:
            results.append(('区县', county))
    
    if not results:
        print(f"没有找到包含 '{keyword}' 的行政区划")
        return
    
    for level, region in results:
        print(f"{level}: {region['name']} ({region['code']})")
    print()


def show_help():
    """显示帮助信息"""
    print("=" * 50)
    print("行政区划数据查看工具")
    print("=" * 50)
    print("使用方法:")
    print("  python3 view_regions.py [命令] [参数]")
    print()
    print("可用命令:")
    print("  stats                    - 显示数据统计")
    print("  provinces [数量]         - 显示省份列表")
    print("  cities <省份名> [数量]   - 显示指定省份的城市")
    print("  counties <城市名> [数量] - 显示指定城市的区县")
    print("  search <关键词>          - 搜索行政区划")
    print("  help                     - 显示此帮助信息")
    print()
    print("示例:")
    print("  python3 view_regions.py stats")
    print("  python3 view_regions.py provinces 20")
    print("  python3 view_regions.py cities 北京市")
    print("  python3 view_regions.py counties 广州市")
    print("  python3 view_regions.py search 北京")
    print()


def main():
    """主函数"""
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    # 加载数据
    try:
        data = load_json_data()
    except:
        return
    
    if command == "stats":
        show_statistics(data)
    
    elif command == "provinces":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        show_provinces(data, limit)
    
    elif command == "cities":
        if len(sys.argv) < 3:
            print("错误：请指定省份名称")
            print("用法: python3 view_regions.py cities <省份名> [数量]")
            return
        province_name = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        show_cities_by_province(data, province_name, limit)
    
    elif command == "counties":
        if len(sys.argv) < 3:
            print("错误：请指定城市名称")
            print("用法: python3 view_regions.py counties <城市名> [数量]")
            return
        city_name = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        show_counties_by_city(data, city_name, limit)
    
    elif command == "search":
        if len(sys.argv) < 3:
            print("错误：请指定搜索关键词")
            print("用法: python3 view_regions.py search <关键词>")
            return
        keyword = sys.argv[2]
        search_region(data, keyword)
    
    elif command == "help":
        show_help()
    
    else:
        print(f"错误：未知命令 '{command}'")
        show_help()


if __name__ == "__main__":
    main()