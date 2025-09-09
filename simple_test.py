#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度云模型使用情况统计工具简单测试
不依赖外部库的语法检查
"""

import sys
import os
from datetime import datetime, timedelta

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_import():
    """测试模块导入"""
    try:
        # 测试导入配置模块
        import config
        print("✅ config模块导入成功")
        
        # 测试配置类
        config_obj = config.BaiduCloudConfig()
        print("✅ BaiduCloudConfig类创建成功")
        
        # 测试配置验证
        is_valid = config_obj.validate_config()
        print(f"✅ 配置验证结果: {is_valid}")
        
        return True
    except Exception as e:
        print(f"❌ 导入失败: {e}")
        return False

def test_data_structures():
    """测试数据结构"""
    try:
        # 模拟ModelUsageStats数据结构
        class ModelUsageStats:
            def __init__(self, model_name, total_requests, total_tokens, 
                        success_requests, failed_requests, avg_response_time, date_range):
                self.model_name = model_name
                self.total_requests = total_requests
                self.total_tokens = total_tokens
                self.success_requests = success_requests
                self.failed_requests = failed_requests
                self.avg_response_time = avg_response_time
                self.date_range = date_range
        
        # 创建测试数据
        stats = ModelUsageStats(
            model_name="ernie-bot",
            total_requests=1000,
            total_tokens=50000,
            success_requests=950,
            failed_requests=50,
            avg_response_time=1.2,
            date_range="2024-01-01 至 2024-01-07"
        )
        
        # 验证数据
        assert stats.model_name == "ernie-bot"
        assert stats.total_requests == 1000
        assert stats.total_tokens == 50000
        assert stats.success_requests == 950
        assert stats.failed_requests == 50
        assert stats.avg_response_time == 1.2
        
        print("✅ 数据结构测试通过")
        return True
    except Exception as e:
        print(f"❌ 数据结构测试失败: {e}")
        return False

def test_date_handling():
    """测试日期处理"""
    try:
        # 测试日期计算
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        
        start_date = week_ago.strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
        
        print(f"✅ 日期计算: {start_date} 至 {end_date}")
        
        # 测试日期格式验证
        datetime.strptime(start_date, "%Y-%m-%d")
        datetime.strptime(end_date, "%Y-%m-%d")
        
        print("✅ 日期格式验证通过")
        return True
    except Exception as e:
        print(f"❌ 日期处理测试失败: {e}")
        return False

def test_string_formatting():
    """测试字符串格式化"""
    try:
        # 测试数字格式化
        total_requests = 1234567
        formatted = f"{total_requests:,}"
        assert formatted == "1,234,567"
        
        # 测试百分比计算
        success_requests = 950
        total_requests = 1000
        success_rate = (success_requests / total_requests * 100) if total_requests > 0 else 0
        assert abs(success_rate - 95.0) < 0.1
        
        print("✅ 字符串格式化测试通过")
        return True
    except Exception as e:
        print(f"❌ 字符串格式化测试失败: {e}")
        return False

def test_file_operations():
    """测试文件操作"""
    try:
        # 测试文件写入
        test_content = "测试内容\n第二行"
        test_filename = "test_output.txt"
        
        with open(test_filename, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        # 测试文件读取
        with open(test_filename, 'r', encoding='utf-8') as f:
            read_content = f.read()
        
        assert read_content == test_content
        
        # 清理测试文件
        os.remove(test_filename)
        
        print("✅ 文件操作测试通过")
        return True
    except Exception as e:
        print(f"❌ 文件操作测试失败: {e}")
        return False

def test_syntax_check():
    """测试主程序语法"""
    try:
        # 读取主程序文件
        with open('baidu_cloud_model_stats.py', 'r', encoding='utf-8') as f:
            code = f.read()
        
        # 编译检查语法
        compile(code, 'baidu_cloud_model_stats.py', 'exec')
        
        print("✅ 主程序语法检查通过")
        return True
    except SyntaxError as e:
        print(f"❌ 语法错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 语法检查失败: {e}")
        return False

def main():
    """主测试函数"""
    print("开始运行百度云模型统计工具简单测试...")
    print("=" * 50)
    
    tests = [
        ("模块导入测试", test_import),
        ("数据结构测试", test_data_structures),
        ("日期处理测试", test_date_handling),
        ("字符串格式化测试", test_string_formatting),
        ("文件操作测试", test_file_operations),
        ("语法检查测试", test_syntax_check),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n运行 {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} 失败")
    
    print("\n" + "=" * 50)
    print(f"测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 所有测试通过！")
        print("\n使用说明:")
        print("1. 安装依赖: pip install requests")
        print("2. 设置API密钥环境变量:")
        print("   export BAIDU_API_KEY=your_api_key")
        print("   export BAIDU_SECRET_KEY=your_secret_key")
        print("3. 运行主程序: python3 baidu_cloud_model_stats.py")
    else:
        print("❌ 部分测试失败，请检查代码")
    
    return passed == total

if __name__ == "__main__":
    main()