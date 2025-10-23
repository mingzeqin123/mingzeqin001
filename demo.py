#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控系统演示脚本
展示如何使用监控系统
"""

import time
import subprocess
import threading
from server_monitor import ServerMonitor

def collect_sample_data():
    """采集一些示例数据用于演示"""
    print("正在采集示例数据...")
    
    monitor = ServerMonitor("demo-server")
    
    # 采集5次数据，每次间隔10秒
    for i in range(5):
        print(f"第 {i+1} 次数据采集...")
        
        # 采集指标
        metrics = monitor.collect_all_metrics()
        
        # 保存数据
        if monitor.save_metrics(metrics):
            print(f"✓ 数据采集成功 - CPU: {metrics['cpu']['total_usage']}%, 内存: {metrics['memory']['usage_percent']}%")
        else:
            print("✗ 数据采集失败")
        
        if i < 4:  # 不是最后一次
            time.sleep(10)
    
    print("示例数据采集完成！")

def start_dashboard():
    """启动大屏展示"""
    print("启动大屏展示...")
    try:
        subprocess.run([
            "python3", "-c", 
            "from dashboard import app; app.run(host='0.0.0.0', port=5002, debug=False)"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"启动大屏失败: {e}")

def main():
    """主演示函数"""
    print("=" * 60)
    print("🖥️  服务器监控系统演示")
    print("=" * 60)
    
    print("\n这个演示将展示以下功能：")
    print("1. 采集服务器指标数据")
    print("2. 启动Web大屏展示")
    print("3. 展示实时监控界面")
    
    print("\n开始演示...")
    
    # 在后台启动大屏
    dashboard_thread = threading.Thread(target=start_dashboard, daemon=True)
    dashboard_thread.start()
    
    # 等待大屏启动
    print("等待大屏启动...")
    time.sleep(3)
    
    # 采集示例数据
    collect_sample_data()
    
    print("\n" + "=" * 60)
    print("演示完成！")
    print("=" * 60)
    print("现在您可以：")
    print("1. 在浏览器中访问: http://localhost:5002")
    print("2. 查看服务器监控大屏")
    print("3. 观察实时数据更新")
    print("\n按 Ctrl+C 停止演示")
    
    try:
        # 保持程序运行
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n演示结束")

if __name__ == "__main__":
    main()