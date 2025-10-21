#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建大文件用于测试性能
"""

import random
import os

def generate_phone():
    """生成随机手机号"""
    prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                '150', '151', '152', '153', '155', '156', '157', '158', '159',
                '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
    prefix = random.choice(prefixes)
    suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return prefix + suffix

def generate_address():
    """生成随机地址"""
    provinces = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市', '西安市', '重庆市']
    districts = ['朝阳区', '海淀区', '浦东新区', '天河区', '南山区', '西湖区', '鼓楼区', '锦江区', '江汉区', '雁塔区']
    streets = ['建国路', '中山路', '人民路', '解放路', '和平路', '胜利路', '光明路', '友谊路', '文化路', '科技路']
    buildings = ['国际大厦', '金融中心', '商业广场', '科技园', '写字楼', '商务中心', '现代城', '时代广场', '环球中心', '世纪大厦']
    
    province = random.choice(provinces)
    district = random.choice(districts)
    street = random.choice(streets)
    building = random.choice(buildings)
    number = random.randint(1, 999)
    floor = random.randint(1, 50)
    room = random.randint(1, 50)
    
    return f"{province}{district}{street}{number}号{building}{floor}楼{room:02d}室"

def create_large_file(filename, size_mb=10):
    """创建指定大小的测试文件"""
    print(f"创建 {size_mb}MB 的测试文件: {filename}")
    
    sample_texts = [
        "客户信息记录：",
        "联系人详情：",
        "用户资料：",
        "会员信息：",
        "业务联系：",
        "个人档案：",
        "企业信息：",
        "合作伙伴：",
        "供应商资料：",
        "员工信息："
    ]
    
    target_size = size_mb * 1024 * 1024  # 转换为字节
    current_size = 0
    
    with open(filename, 'w', encoding='utf-8') as f:
        while current_size < target_size:
            # 添加标题
            title = random.choice(sample_texts)
            f.write(f"\n{title}\n")
            
            # 添加几条记录
            for _ in range(random.randint(3, 8)):
                name = f"用户{random.randint(1000, 9999)}"
                phone = generate_phone()
                address = generate_address()
                
                # 随机选择格式
                formats = [
                    f"{name}，手机：{phone}，地址：{address}",
                    f"姓名：{name}\n手机号码：{phone}\n住址：{address}",
                    f"{name} 联系方式：{phone} 工作地点：{address}",
                    f"客户：{name}，电话：{phone}，居住地址：{address}",
                ]
                
                line = random.choice(formats) + "\n"
                f.write(line)
                current_size += len(line.encode('utf-8'))
                
                if current_size >= target_size:
                    break
            
            # 添加一些噪音数据
            noise_lines = [
                "备注：重要客户",
                "状态：已验证",
                "创建时间：2024-01-01",
                "更新时间：2024-10-21",
                "分类：VIP客户",
                "来源：网站注册",
                "等级：金牌会员",
                "积分：1000",
            ]
            
            for _ in range(random.randint(1, 3)):
                noise = random.choice(noise_lines) + "\n"
                f.write(noise)
                current_size += len(noise.encode('utf-8'))
                
                if current_size >= target_size:
                    break
            
            f.write("\n" + "="*50 + "\n")
            current_size += 52  # 分隔线的字节数
    
    actual_size = os.path.getsize(filename)
    print(f"文件创建完成，实际大小：{actual_size / (1024*1024):.2f} MB")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        size_mb = int(sys.argv[1])
    else:
        size_mb = 10
    
    filename = f"test_data_{size_mb}mb.txt"
    create_large_file(filename, size_mb)
    print(f"\n可以使用以下命令测试：")
    print(f"python3 extract_phone_address.py {filename}")
    print(f"python3 extract_phone_address.py {filename} --chunk-size 32768")