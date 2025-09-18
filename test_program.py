#!/usr/bin/env python3
"""
测试程序 - 用于演示监控器功能
这个程序会随机崩溃，用于测试监控器的重启功能
"""

import time
import random
import sys
import signal

def signal_handler(signum, frame):
    print(f"收到信号 {signum}，程序退出")
    sys.exit(0)

# 注册信号处理器
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def main():
    print("测试程序启动")
    print(f"PID: {os.getpid()}")
    
    # 模拟程序运行
    for i in range(100):
        print(f"运行中... {i+1}/100")
        time.sleep(1)
        
        # 随机崩溃（10%概率）
        if random.random() < 0.1:
            print("程序崩溃！")
            sys.exit(1)
    
    print("程序正常结束")

if __name__ == '__main__':
    import os
    main()