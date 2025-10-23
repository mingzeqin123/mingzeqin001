#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控系统测试脚本
用于验证各个模块的功能
"""

import json
import time
import os
from server_monitor import ServerMonitor
from dashboard import DashboardManager

def test_server_monitor():
    """测试服务器监控模块"""
    print("=" * 50)
    print("测试服务器监控模块")
    print("=" * 50)
    
    monitor = ServerMonitor("test-server")
    
    # 测试CPU信息
    print("\n1. 测试CPU信息采集...")
    cpu_info = monitor.get_cpu_usage()
    print(f"CPU使用率: {cpu_info.get('total_usage', 'N/A')}%")
    print(f"CPU核心数: {cpu_info.get('core_count', 'N/A')}")
    
    # 测试内存信息
    print("\n2. 测试内存信息采集...")
    memory_info = monitor.get_memory_usage()
    print(f"内存使用率: {memory_info.get('usage_percent', 'N/A')}%")
    print(f"总内存: {memory_info.get('total', 'N/A')}GB")
    print(f"已使用: {memory_info.get('used', 'N/A')}GB")
    
    # 测试磁盘信息
    print("\n3. 测试磁盘信息采集...")
    disk_info = monitor.get_disk_usage()
    print(f"磁盘分区数量: {len(disk_info)}")
    for disk in disk_info[:3]:  # 只显示前3个分区
        if 'error' not in disk:
            print(f"  {disk['device']}: {disk['usage_percent']}%")
    
    # 测试网络信息
    print("\n4. 测试网络信息采集...")
    network_info = monitor.get_network_usage()
    print(f"网络连接数: {network_info.get('connections', 'N/A')}")
    
    # 测试系统信息
    print("\n5. 测试系统信息采集...")
    system_info = monitor.get_system_info()
    print(f"操作系统: {system_info.get('platform', 'N/A')}")
    print(f"运行时间: {system_info.get('uptime_days', 'N/A')}天")
    
    # 测试完整指标采集
    print("\n6. 测试完整指标采集...")
    all_metrics = monitor.collect_all_metrics()
    print(f"采集时间: {all_metrics['timestamp']}")
    print(f"服务器名称: {all_metrics['server_name']}")
    
    # 测试数据保存
    print("\n7. 测试数据保存...")
    if monitor.save_metrics(all_metrics):
        print("✓ 数据保存成功")
    else:
        print("✗ 数据保存失败")
    
    # 测试数据读取
    print("\n8. 测试数据读取...")
    latest_metrics = monitor.get_latest_metrics()
    if latest_metrics:
        print("✓ 数据读取成功")
        print(f"最新数据时间: {latest_metrics.get('timestamp', 'N/A')}")
    else:
        print("✗ 数据读取失败")
    
    return True

def test_dashboard_manager():
    """测试大屏管理模块"""
    print("\n" + "=" * 50)
    print("测试大屏管理模块")
    print("=" * 50)
    
    dashboard = DashboardManager()
    
    # 测试服务器列表获取
    print("\n1. 测试服务器列表获取...")
    servers = dashboard.get_all_servers()
    print(f"发现服务器数量: {len(servers)}")
    for server in servers:
        print(f"  - {server['name']} (最后更新: {server['last_update']})")
    
    # 测试指标获取
    if servers:
        server_name = servers[0]['name']
        print(f"\n2. 测试获取服务器 {server_name} 的指标...")
        
        latest_metrics = dashboard.get_server_latest_metrics(server_name)
        if latest_metrics:
            print("✓ 获取最新指标成功")
            print(f"  CPU使用率: {latest_metrics.get('cpu', {}).get('total_usage', 'N/A')}%")
            print(f"  内存使用率: {latest_metrics.get('memory', {}).get('usage_percent', 'N/A')}%")
        else:
            print("✗ 获取最新指标失败")
        
        print(f"\n3. 测试获取服务器 {server_name} 的历史数据...")
        history = dashboard.get_server_metrics_history(server_name, hours=1)
        print(f"历史数据条数: {len(history)}")
    
    return True

def test_data_files():
    """测试数据文件"""
    print("\n" + "=" * 50)
    print("测试数据文件")
    print("=" * 50)
    
    # 查找数据文件
    import glob
    data_files = glob.glob("server_data_*.json")
    print(f"发现数据文件数量: {len(data_files)}")
    
    for file_path in data_files:
        print(f"\n文件: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"  服务器名称: {data.get('server_name', 'N/A')}")
                print(f"  指标数量: {len(data.get('metrics', []))}")
                
                if data.get('metrics'):
                    latest = data['metrics'][-1]
                    print(f"  最新数据时间: {latest.get('timestamp', 'N/A')}")
        except Exception as e:
            print(f"  读取失败: {e}")

def test_web_interface():
    """测试Web界面（需要手动验证）"""
    print("\n" + "=" * 50)
    print("Web界面测试说明")
    print("=" * 50)
    print("1. 运行以下命令启动大屏:")
    print("   python dashboard.py")
    print("2. 在浏览器中访问: http://localhost:5000")
    print("3. 检查以下功能:")
    print("   - 页面是否正常加载")
    print("   - 服务器卡片是否显示")
    print("   - 指标数据是否正确")
    print("   - 图表是否正常显示")
    print("   - 自动刷新是否工作")

def main():
    """主测试函数"""
    print("服务器监控系统功能测试")
    print("=" * 50)
    
    try:
        # 测试服务器监控模块
        test_server_monitor()
        
        # 测试大屏管理模块
        test_dashboard_manager()
        
        # 测试数据文件
        test_data_files()
        
        # 测试Web界面说明
        test_web_interface()
        
        print("\n" + "=" * 50)
        print("测试完成！")
        print("=" * 50)
        print("如果所有测试都通过，说明监控系统工作正常。")
        print("可以运行 'python start_monitoring.py' 启动完整系统。")
        
    except Exception as e:
        print(f"\n测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()