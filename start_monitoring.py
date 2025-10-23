#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控系统启动脚本
同时启动数据采集和大屏展示
"""

import subprocess
import time
import signal
import sys
import os
import threading
import logging
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MonitoringSystem:
    """监控系统管理器"""
    
    def __init__(self):
        self.processes = []
        self.running = False
    
    def start_collector(self, server_name=None, interval=1):
        """启动数据采集器"""
        try:
            cmd = [sys.executable, 'collector.py']
            if server_name:
                cmd.extend(['--server-name', server_name])
            cmd.extend(['--interval', str(interval)])
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes.append(('collector', process))
            logger.info(f"数据采集器已启动 (PID: {process.pid})")
            return process
            
        except Exception as e:
            logger.error(f"启动数据采集器失败: {e}")
            return None
    
    def start_dashboard(self, port=5000):
        """启动大屏展示"""
        try:
            cmd = [sys.executable, 'dashboard.py']
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes.append(('dashboard', process))
            logger.info(f"大屏展示已启动 (PID: {process.pid})")
            return process
            
        except Exception as e:
            logger.error(f"启动大屏展示失败: {e}")
            return None
    
    def start_system(self, server_name=None, interval=1, port=5000):
        """启动整个监控系统"""
        logger.info("正在启动服务器监控系统...")
        
        # 检查依赖
        if not self.check_dependencies():
            logger.error("依赖检查失败，请安装必要的包")
            return False
        
        # 启动数据采集器
        collector = self.start_collector(server_name, interval)
        if not collector:
            logger.error("无法启动数据采集器")
            return False
        
        # 等待一下让采集器先运行
        time.sleep(2)
        
        # 启动大屏展示
        dashboard = self.start_dashboard(port)
        if not dashboard:
            logger.error("无法启动大屏展示")
            self.stop_all_processes()
            return False
        
        self.running = True
        logger.info("=" * 50)
        logger.info("服务器监控系统已启动！")
        logger.info(f"大屏访问地址: http://localhost:{port}")
        logger.info(f"数据采集间隔: {interval}分钟")
        logger.info("按 Ctrl+C 停止系统")
        logger.info("=" * 50)
        
        return True
    
    def check_dependencies(self):
        """检查依赖包"""
        required_packages = ['psutil', 'flask', 'schedule']
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                missing_packages.append(package)
        
        if missing_packages:
            logger.error(f"缺少依赖包: {', '.join(missing_packages)}")
            logger.error("请运行: pip install -r requirements.txt")
            return False
        
        return True
    
    def stop_all_processes(self):
        """停止所有进程"""
        logger.info("正在停止所有进程...")
        
        for name, process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                logger.info(f"{name} 进程已停止")
            except subprocess.TimeoutExpired:
                process.kill()
                logger.warning(f"{name} 进程强制停止")
            except Exception as e:
                logger.error(f"停止 {name} 进程失败: {e}")
        
        self.processes.clear()
        self.running = False
        logger.info("所有进程已停止")
    
    def monitor_processes(self):
        """监控进程状态"""
        while self.running:
            time.sleep(5)
            
            for name, process in self.processes[:]:
                if process.poll() is not None:
                    logger.error(f"{name} 进程意外退出 (退出码: {process.returncode})")
                    self.processes.remove((name, process))
                    
                    if name == 'collector':
                        logger.error("数据采集器停止，系统将无法正常工作")
                    elif name == 'dashboard':
                        logger.error("大屏展示停止")
    
    def run(self, server_name=None, interval=1, port=5000):
        """运行监控系统"""
        if not self.start_system(server_name, interval, port):
            return
        
        # 启动进程监控
        monitor_thread = threading.Thread(target=self.monitor_processes, daemon=True)
        monitor_thread.start()
        
        try:
            # 保持主线程运行
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("收到停止信号")
        finally:
            self.stop_all_processes()


def signal_handler(signum, frame):
    """信号处理器"""
    logger.info("收到停止信号")
    sys.exit(0)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='服务器监控系统')
    parser.add_argument('--server-name', help='服务器名称', default=None)
    parser.add_argument('--interval', type=int, help='数据采集间隔（分钟）', default=1)
    parser.add_argument('--port', type=int, help='大屏端口', default=5000)
    
    args = parser.parse_args()
    
    # 设置信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # 创建并运行监控系统
    system = MonitoringSystem()
    system.run(
        server_name=args.server_name,
        interval=args.interval,
        port=args.port
    )


if __name__ == "__main__":
    main()