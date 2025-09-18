#!/usr/bin/env python3
"""
测试应用程序 - 用于演示监控脚本功能
"""

import time
import random
import sys
import signal
import os

class TestApp:
    def __init__(self):
        self.running = True
        self.crash_probability = 0.1  # 10% 概率崩溃
        self.run_time = 0
        
        # 设置信号处理
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        print(f"\n收到信号 {signum}，正在优雅退出...")
        self.running = False
    
    def run(self):
        print(f"测试应用启动，PID: {os.getpid()}")
        print("应用将随机崩溃来演示监控脚本的重启功能")
        
        while self.running:
            self.run_time += 1
            print(f"应用运行中... 时间: {self.run_time}s")
            
            # 随机崩溃模拟
            if random.random() < self.crash_probability and self.run_time > 10:
                print("💥 模拟程序崩溃!")
                sys.exit(1)
            
            time.sleep(1)
        
        print("应用正常退出")

if __name__ == "__main__":
    app = TestApp()
    try:
        app.run()
    except KeyboardInterrupt:
        print("\n收到中断信号，退出应用")
    except Exception as e:
        print(f"应用发生异常: {e}")
        sys.exit(1)