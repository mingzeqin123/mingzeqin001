#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控数据采集器
定时采集服务器指标并保存到文件
"""

import time
import schedule
import threading
from server_monitor import ServerMonitor
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MetricsCollector:
    """指标采集器"""
    
    def __init__(self, server_name: str = None, interval_minutes: int = 1):
        self.monitor = ServerMonitor(server_name)
        self.interval_minutes = interval_minutes
        self.running = False
        self.thread = None
    
    def collect_metrics(self):
        """采集一次指标"""
        try:
            logger.info(f"开始采集服务器 {self.monitor.server_name} 的指标...")
            
            # 采集指标
            metrics = self.monitor.collect_all_metrics()
            
            # 保存指标
            if self.monitor.save_metrics(metrics):
                logger.info(f"服务器 {self.monitor.server_name} 指标采集完成")
            else:
                logger.error(f"服务器 {self.monitor.server_name} 指标保存失败")
                
        except Exception as e:
            logger.error(f"采集服务器 {self.monitor.server_name} 指标失败: {e}")
    
    def start_collection(self):
        """开始定时采集"""
        if self.running:
            logger.warning("采集器已在运行中")
            return
        
        self.running = True
        logger.info(f"启动指标采集器，服务器: {self.monitor.server_name}, 间隔: {self.interval_minutes}分钟")
        
        # 立即采集一次
        self.collect_metrics()
        
        # 设置定时任务
        schedule.every(self.interval_minutes).minutes.do(self.collect_metrics)
        
        # 在单独线程中运行调度器
        def run_scheduler():
            while self.running:
                schedule.run_pending()
                time.sleep(1)
        
        self.thread = threading.Thread(target=run_scheduler, daemon=True)
        self.thread.start()
    
    def stop_collection(self):
        """停止采集"""
        if not self.running:
            logger.warning("采集器未在运行")
            return
        
        self.running = False
        schedule.clear()
        logger.info("指标采集器已停止")
    
    def get_status(self):
        """获取采集器状态"""
        return {
            "running": self.running,
            "server_name": self.monitor.server_name,
            "interval_minutes": self.interval_minutes,
            "data_file": self.monitor.data_file
        }


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='服务器监控数据采集器')
    parser.add_argument('--server-name', help='服务器名称', default=None)
    parser.add_argument('--interval', type=int, help='采集间隔（分钟）', default=1)
    parser.add_argument('--once', action='store_true', help='只采集一次，不启动定时任务')
    
    args = parser.parse_args()
    
    # 创建采集器
    collector = MetricsCollector(
        server_name=args.server_name,
        interval_minutes=args.interval
    )
    
    if args.once:
        # 只采集一次
        collector.collect_metrics()
    else:
        # 启动定时采集
        try:
            collector.start_collection()
            logger.info("采集器已启动，按 Ctrl+C 停止")
            
            # 保持程序运行
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("收到停止信号")
            collector.stop_collection()
            logger.info("采集器已停止")


if __name__ == "__main__":
    main()