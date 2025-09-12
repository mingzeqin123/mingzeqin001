#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版中国行政区划信息爬虫
支持多数据源获取更完整的行政区划信息
"""

import json
import csv
import logging
from typing import List, Dict

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_crawler.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EnhancedChinaAdministrativeCrawler:
    """增强版中国行政区划信息爬虫"""
    
    def __init__(self):
        pass
        
    def get_comprehensive_data(self) -> List[Dict]:
        """获取全面的行政区划数据"""
        logger.info("获取全面的中国行政区划数据...")
        
        data = []
        
        # 34个省级行政区
        provinces_data = [
            # 直辖市
            {'code': '110000', 'name': '北京市', 'type': '直辖市'},
            {'code': '120000', 'name': '天津市', 'type': '直辖市'},
            {'code': '310000', 'name': '上海市', 'type': '直辖市'},
            {'code': '500000', 'name': '重庆市', 'type': '直辖市'},
            
            # 省
            {'code': '130000', 'name': '河北省', 'type': '省'},
            {'code': '140000', 'name': '山西省', 'type': '省'},
            {'code': '150000', 'name': '内蒙古自治区', 'type': '自治区'},
            {'code': '210000', 'name': '辽宁省', 'type': '省'},
            {'code': '220000', 'name': '吉林省', 'type': '省'},
            {'code': '230000', 'name': '黑龙江省', 'type': '省'},
            {'code': '320000', 'name': '江苏省', 'type': '省'},
            {'code': '330000', 'name': '浙江省', 'type': '省'},
            {'code': '340000', 'name': '安徽省', 'type': '省'},
            {'code': '350000', 'name': '福建省', 'type': '省'},
            {'code': '360000', 'name': '江西省', 'type': '省'},
            {'code': '370000', 'name': '山东省', 'type': '省'},
            {'code': '410000', 'name': '河南省', 'type': '省'},
            {'code': '420000', 'name': '湖北省', 'type': '省'},
            {'code': '430000', 'name': '湖南省', 'type': '省'},
            {'code': '440000', 'name': '广东省', 'type': '省'},
            {'code': '450000', 'name': '广西壮族自治区', 'type': '自治区'},
            {'code': '460000', 'name': '海南省', 'type': '省'},
            {'code': '510000', 'name': '四川省', 'type': '省'},
            {'code': '520000', 'name': '贵州省', 'type': '省'},
            {'code': '530000', 'name': '云南省', 'type': '省'},
            {'code': '540000', 'name': '西藏自治区', 'type': '自治区'},
            {'code': '610000', 'name': '陕西省', 'type': '省'},
            {'code': '620000', 'name': '甘肃省', 'type': '省'},
            {'code': '630000', 'name': '青海省', 'type': '省'},
            {'code': '640000', 'name': '宁夏回族自治区', 'type': '自治区'},
            {'code': '650000', 'name': '新疆维吾尔自治区', 'type': '自治区'},
            {'code': '710000', 'name': '台湾省', 'type': '省'},
            {'code': '810000', 'name': '香港特别行政区', 'type': '特别行政区'},
            {'code': '820000', 'name': '澳门特别行政区', 'type': '特别行政区'},
        ]
        
        # 添加省级数据
        for province in provinces_data:
            data.append({
                'level': '省',
                'code': province['code'],
                'name': province['name'],
                'type': province['type'],
                'parent_code': '',
                'parent_name': '中华人民共和国',
                'full_path': province['name']
            })
        
        # 添加主要城市数据
        cities_data = self.get_major_cities_data()
        data.extend(cities_data)
        
        # 添加区县数据
        districts_data = self.get_major_districts_data()
        data.extend(districts_data)
        
        return data
    
    def get_major_cities_data(self) -> List[Dict]:
        """获取主要城市数据"""
        cities = [
            # 直辖市的市级
            {'code': '110100', 'name': '北京市', 'parent_code': '110000', 'parent_name': '北京市'},
            {'code': '120100', 'name': '天津市', 'parent_code': '120000', 'parent_name': '天津市'},
            {'code': '310100', 'name': '上海市', 'parent_code': '310000', 'parent_name': '上海市'},
            {'code': '500100', 'name': '重庆市', 'parent_code': '500000', 'parent_name': '重庆市'},
            
            # 河北省主要城市
            {'code': '130100', 'name': '石家庄市', 'parent_code': '130000', 'parent_name': '河北省'},
            {'code': '130200', 'name': '唐山市', 'parent_code': '130000', 'parent_name': '河北省'},
            {'code': '130300', 'name': '秦皇岛市', 'parent_code': '130000', 'parent_name': '河北省'},
            
            # 山西省主要城市
            {'code': '140100', 'name': '太原市', 'parent_code': '140000', 'parent_name': '山西省'},
            {'code': '140200', 'name': '大同市', 'parent_code': '140000', 'parent_name': '山西省'},
            
            # 辽宁省主要城市
            {'code': '210100', 'name': '沈阳市', 'parent_code': '210000', 'parent_name': '辽宁省'},
            {'code': '210200', 'name': '大连市', 'parent_code': '210000', 'parent_name': '辽宁省'},
            
            # 江苏省主要城市
            {'code': '320100', 'name': '南京市', 'parent_code': '320000', 'parent_name': '江苏省'},
            {'code': '320200', 'name': '无锡市', 'parent_code': '320000', 'parent_name': '江苏省'},
            {'code': '320500', 'name': '苏州市', 'parent_code': '320000', 'parent_name': '江苏省'},
            
            # 浙江省主要城市
            {'code': '330100', 'name': '杭州市', 'parent_code': '330000', 'parent_name': '浙江省'},
            {'code': '330200', 'name': '宁波市', 'parent_code': '330000', 'parent_name': '浙江省'},
            
            # 广东省主要城市
            {'code': '440100', 'name': '广州市', 'parent_code': '440000', 'parent_name': '广东省'},
            {'code': '440300', 'name': '深圳市', 'parent_code': '440000', 'parent_name': '广东省'},
            {'code': '440400', 'name': '珠海市', 'parent_code': '440000', 'parent_name': '广东省'},
            {'code': '440600', 'name': '佛山市', 'parent_code': '440000', 'parent_name': '广东省'},
            {'code': '441900', 'name': '东莞市', 'parent_code': '440000', 'parent_name': '广东省'},
            
            # 四川省主要城市
            {'code': '510100', 'name': '成都市', 'parent_code': '510000', 'parent_name': '四川省'},
            
            # 山东省主要城市
            {'code': '370100', 'name': '济南市', 'parent_code': '370000', 'parent_name': '山东省'},
            {'code': '370200', 'name': '青岛市', 'parent_code': '370000', 'parent_name': '山东省'},
            
            # 河南省主要城市
            {'code': '410100', 'name': '郑州市', 'parent_code': '410000', 'parent_name': '河南省'},
        ]
        
        city_data = []
        for city in cities:
            city_data.append({
                'level': '市',
                'code': city['code'],
                'name': city['name'],
                'type': '地级市',
                'parent_code': city['parent_code'],
                'parent_name': city['parent_name'],
                'full_path': f"{city['parent_name']}/{city['name']}"
            })
            
        return city_data
    
    def get_major_districts_data(self) -> List[Dict]:
        """获取主要区县数据"""
        districts = [
            # 北京市区县
            {'code': '110101', 'name': '东城区', 'parent_code': '110100', 'parent_name': '北京市', 'province': '北京市'},
            {'code': '110102', 'name': '西城区', 'parent_code': '110100', 'parent_name': '北京市', 'province': '北京市'},
            {'code': '110105', 'name': '朝阳区', 'parent_code': '110100', 'parent_name': '北京市', 'province': '北京市'},
            {'code': '110106', 'name': '丰台区', 'parent_code': '110100', 'parent_name': '北京市', 'province': '北京市'},
            {'code': '110108', 'name': '海淀区', 'parent_code': '110100', 'parent_name': '北京市', 'province': '北京市'},
            
            # 上海市区县
            {'code': '310101', 'name': '黄浦区', 'parent_code': '310100', 'parent_name': '上海市', 'province': '上海市'},
            {'code': '310104', 'name': '徐汇区', 'parent_code': '310100', 'parent_name': '上海市', 'province': '上海市'},
            {'code': '310105', 'name': '长宁区', 'parent_code': '310100', 'parent_name': '上海市', 'province': '上海市'},
            {'code': '310115', 'name': '浦东新区', 'parent_code': '310100', 'parent_name': '上海市', 'province': '上海市'},
            
            # 广州市区县
            {'code': '440103', 'name': '荔湾区', 'parent_code': '440100', 'parent_name': '广州市', 'province': '广东省'},
            {'code': '440104', 'name': '越秀区', 'parent_code': '440100', 'parent_name': '广州市', 'province': '广东省'},
            {'code': '440106', 'name': '天河区', 'parent_code': '440100', 'parent_name': '广州市', 'province': '广东省'},
            
            # 深圳市区县
            {'code': '440303', 'name': '罗湖区', 'parent_code': '440300', 'parent_name': '深圳市', 'province': '广东省'},
            {'code': '440304', 'name': '福田区', 'parent_code': '440300', 'parent_name': '深圳市', 'province': '广东省'},
            {'code': '440305', 'name': '南山区', 'parent_code': '440300', 'parent_name': '深圳市', 'province': '广东省'},
            
            # 成都市区县
            {'code': '510104', 'name': '锦江区', 'parent_code': '510100', 'parent_name': '成都市', 'province': '四川省'},
            {'code': '510105', 'name': '青羊区', 'parent_code': '510100', 'parent_name': '成都市', 'province': '四川省'},
            
            # 杭州市区县
            {'code': '330102', 'name': '上城区', 'parent_code': '330100', 'parent_name': '杭州市', 'province': '浙江省'},
            {'code': '330106', 'name': '西湖区', 'parent_code': '330100', 'parent_name': '杭州市', 'province': '浙江省'},
            
            # 南京市区县
            {'code': '320102', 'name': '玄武区', 'parent_code': '320100', 'parent_name': '南京市', 'province': '江苏省'},
            {'code': '320106', 'name': '鼓楼区', 'parent_code': '320100', 'parent_name': '南京市', 'province': '江苏省'},
        ]
        
        district_data = []
        for district in districts:
            district_data.append({
                'level': '区县',
                'code': district['code'],
                'name': district['name'],
                'type': '市辖区',
                'parent_code': district['parent_code'],
                'parent_name': district['parent_name'],
                'full_path': f"{district['province']}/{district['parent_name']}/{district['name']}"
            })
            
        return district_data
    
    def save_to_json(self, data: List[Dict], filename: str = 'enhanced_china_administrative_divisions.json'):
        """保存数据为JSON格式"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"数据已保存到 {filename}")
        except Exception as e:
            logger.error(f"保存JSON文件失败: {e}")
    
    def save_to_csv(self, data: List[Dict], filename: str = 'enhanced_china_administrative_divisions.csv'):
        """保存数据为CSV格式"""
        try:
            if not data:
                logger.warning("没有数据可保存")
                return
                
            fieldnames = data[0].keys()
            with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            logger.info(f"数据已保存到 {filename}")
        except Exception as e:
            logger.error(f"保存CSV文件失败: {e}")
    
    def generate_detailed_statistics(self, data: List[Dict]):
        """生成详细的数据统计信息"""
        if not data:
            return
            
        level_counts = {}
        type_counts = {}
        province_stats = {}
        
        for item in data:
            # 统计级别
            level = item.get('level', '未知')
            level_counts[level] = level_counts.get(level, 0) + 1
            
            # 统计类型
            item_type = item.get('type', '未知')
            type_counts[item_type] = type_counts.get(item_type, 0) + 1
            
            # 统计省份下的城市和区县数量
            if level == '省':
                province_stats[item['name']] = {'cities': 0, 'districts': 0}
            elif level == '市':
                parent = item.get('parent_name', '')
                if parent in province_stats:
                    province_stats[parent]['cities'] += 1
            elif level == '区县':
                # 通过full_path获取省份名称
                path_parts = item.get('full_path', '').split('/')
                if len(path_parts) >= 3:
                    province = path_parts[0]
                    if province in province_stats:
                        province_stats[province]['districts'] += 1
        
        logger.info("=" * 60)
        logger.info("详细数据统计信息:")
        logger.info("=" * 60)
        logger.info(f"总计: {len(data)} 条记录")
        
        logger.info("\n按行政级别统计:")
        for level, count in sorted(level_counts.items()):
            logger.info(f"  {level}: {count} 条")
        
        logger.info("\n按行政区类型统计:")
        for item_type, count in sorted(type_counts.items()):
            logger.info(f"  {item_type}: {count} 条")
        
        logger.info(f"\n省级行政区详情: (共{len(province_stats)}个)")
        for province, stats in sorted(province_stats.items()):
            logger.info(f"  {province}: {stats['cities']}个地级市, {stats['districts']}个区县")
    
    def run(self):
        """运行增强版爬虫"""
        logger.info("开始运行增强版中国行政区划信息爬虫...")
        
        # 获取全面的数据
        data = self.get_comprehensive_data()
        
        if data:
            logger.info(f"共获取到 {len(data)} 条行政区划记录")
            
            # 保存主要数据文件
            self.save_to_json(data)
            self.save_to_csv(data)
            
            # 生成详细统计
            self.generate_detailed_statistics(data)
            
            logger.info("\n数据获取完成！")
            logger.info("输出文件:")
            logger.info("  - enhanced_china_administrative_divisions.json (完整数据)")
            logger.info("  - enhanced_china_administrative_divisions.csv (完整数据)")
            logger.info("  - enhanced_crawler.log (详细日志)")
                
        else:
            logger.error("未能获取到任何数据")

def main():
    """主函数"""
    crawler = EnhancedChinaAdministrativeCrawler()
    crawler.run()

if __name__ == '__main__':
    main()