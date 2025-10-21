#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建测试数据文件
生成包含手机号、姓名、地址的测试文件
"""

import random
import os

def generate_test_data(filename="test_data.txt", size_mb=10):
    """
    生成测试数据文件
    
    Args:
        filename: 输出文件名
        size_mb: 文件大小(MB)
    """
    
    # 示例数据
    surnames = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡", "林", "郭", "何", "高", "罗"]
    given_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
    
    provinces = ["北京市", "上海市", "广东省", "江苏省", "浙江省", "山东省", "河南省", "四川省", "湖北省", "湖南省"]
    cities = ["海淀区", "朝阳区", "浦东新区", "天河区", "南山区", "西湖区", "历下区", "金水区", "武昌区", "岳麓区"]
    streets = ["中山路", "人民路", "建设路", "解放路", "和平路", "胜利路", "文化路", "学院路", "科技路", "商业街"]
    
    phone_prefixes = ["130", "131", "132", "133", "134", "135", "136", "137", "138", "139",
                     "150", "151", "152", "153", "155", "156", "157", "158", "159",
                     "180", "181", "182", "183", "184", "185", "186", "187", "188", "189"]
    
    target_size = size_mb * 1024 * 1024  # 转换为字节
    current_size = 0
    
    print(f"开始生成 {size_mb}MB 的测试数据文件: {filename}")
    
    with open(filename, 'w', encoding='utf-8') as f:
        line_count = 0
        
        while current_size < target_size:
            # 生成随机数据行
            line_type = random.choice(["contact", "log", "mixed", "noise"])
            
            if line_type == "contact":
                # 联系人信息格式
                name = random.choice(surnames) + random.choice(given_names)
                phone = random.choice(phone_prefixes) + str(random.randint(10000000, 99999999))
                province = random.choice(provinces)
                city = random.choice(cities)
                street = random.choice(streets)
                number = random.randint(1, 999)
                
                line = f"姓名: {name}, 电话: {phone}, 地址: {province}{city}{street}{number}号\n"
                
            elif line_type == "log":
                # 日志格式
                name = random.choice(surnames) + random.choice(given_names)
                phone = random.choice(phone_prefixes) + str(random.randint(10000000, 99999999))
                timestamp = f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
                
                line = f"[{timestamp}] 用户 {name} (手机: {phone}) 登录系统\n"
                
            elif line_type == "mixed":
                # 混合格式
                name = random.choice(surnames) + random.choice(given_names)
                phone = random.choice(phone_prefixes) + str(random.randint(10000000, 99999999))
                province = random.choice(provinces)
                city = random.choice(cities)
                
                formats = [
                    f"客户信息 - {name} 联系方式:{phone} 住址:{province}{city}\n",
                    f"订单记录: 收货人{name} 手机号码{phone} 收货地址{province}{city}某某街道\n",
                    f"{name}先生/女士，您的手机号{phone}，地址为{province}{city}，请确认信息\n"
                ]
                line = random.choice(formats)
                
            else:
                # 噪音数据
                noise_words = ["系统", "处理", "数据", "信息", "记录", "文件", "配置", "参数", "结果", "状态"]
                line = " ".join(random.choices(noise_words, k=random.randint(5, 15))) + "\n"
            
            f.write(line)
            current_size += len(line.encode('utf-8'))
            line_count += 1
            
            if line_count % 10000 == 0:
                progress = (current_size / target_size) * 100
                print(f"进度: {progress:.1f}% - 已生成 {line_count} 行")
    
    actual_size = os.path.getsize(filename)
    print(f"测试文件生成完成!")
    print(f"文件: {filename}")
    print(f"大小: {actual_size / (1024*1024):.2f} MB")
    print(f"行数: {line_count}")

if __name__ == "__main__":
    # 生成10MB的测试文件
    generate_test_data("test_data.txt", 10)
    
    # 如果需要生成更大的文件，可以调整大小
    # generate_test_data("large_test_data.txt", 100)  # 100MB