#!/usr/bin/env python3
"""
程序监控和自动重启脚本
监控指定程序的运行状态，如果程序崩溃则自动重启
"""

import os
import sys
import time
import signal
import subprocess
import logging
import argparse
import json
from datetime import datetime
from typing import Optional, List, Dict, Any


class ProcessMonitor:
    """程序监控器"""
    
    def __init__(self, config_file: str = None):
        """初始化监控器"""
        self.config = self._load_config(config_file)
        self.running = True
        self.process = None
        self.restart_count = 0
        self.max_restarts = self.config.get('max_restarts', 10)
        self.restart_delay = self.config.get('restart_delay', 5)
        self.check_interval = self.config.get('check_interval', 10)
        
        # 设置日志
        self._setup_logging()
        
        # 注册信号处理器
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """加载配置文件"""
        default_config = {
            'program': '',
            'args': [],
            'working_dir': '.',
            'env': {},
            'check_interval': 10,
            'restart_delay': 5,
            'max_restarts': 10,
            'log_file': 'process_monitor.log',
            'log_level': 'INFO'
        }
        
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                print(f"警告: 无法加载配置文件 {config_file}: {e}")
        
        return default_config
    
    def _setup_logging(self):
        """设置日志记录"""
        log_level = getattr(logging, self.config.get('log_level', 'INFO').upper())
        
        # 创建日志格式
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # 设置根日志记录器
        self.logger = logging.getLogger('ProcessMonitor')
        self.logger.setLevel(log_level)
        
        # 清除现有的处理器
        self.logger.handlers.clear()
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # 文件处理器
        if self.config.get('log_file'):
            file_handler = logging.FileHandler(
                self.config['log_file'], 
                encoding='utf-8'
            )
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
    
    def _signal_handler(self, signum, frame):
        """信号处理器"""
        self.logger.info(f"收到信号 {signum}，正在停止监控...")
        self.running = False
        if self.process:
            self.logger.info("正在终止被监控的程序...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.logger.warning("程序未在5秒内正常退出，强制终止...")
                self.process.kill()
    
    def _is_process_running(self) -> bool:
        """检查进程是否正在运行"""
        if not self.process:
            return False
        
        # 检查进程是否还在运行
        return self.process.poll() is None
    
    def _start_process(self) -> bool:
        """启动被监控的程序"""
        try:
            program = self.config['program']
            args = self.config.get('args', [])
            working_dir = self.config.get('working_dir', '.')
            env = os.environ.copy()
            env.update(self.config.get('env', {}))
            
            if not program:
                self.logger.error("未指定要监控的程序")
                return False
            
            # 检查程序是否存在
            if not os.path.exists(program) and not self._is_command_available(program):
                self.logger.error(f"程序不存在或不可执行: {program}")
                return False
            
            self.logger.info(f"启动程序: {program} {' '.join(args)}")
            
            # 启动进程
            self.process = subprocess.Popen(
                [program] + args,
                cwd=working_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid if os.name != 'nt' else None
            )
            
            self.logger.info(f"程序已启动，PID: {self.process.pid}")
            return True
            
        except Exception as e:
            self.logger.error(f"启动程序失败: {e}")
            return False
    
    def _is_command_available(self, command: str) -> bool:
        """检查命令是否在PATH中可用"""
        try:
            subprocess.run(['which', command], check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    def _restart_process(self):
        """重启进程"""
        if self.restart_count >= self.max_restarts:
            self.logger.error(f"已达到最大重启次数 ({self.max_restarts})，停止监控")
            self.running = False
            return
        
        self.restart_count += 1
        self.logger.warning(f"程序崩溃，准备重启 (第 {self.restart_count} 次)")
        
        # 等待一段时间再重启
        if self.restart_delay > 0:
            self.logger.info(f"等待 {self.restart_delay} 秒后重启...")
            time.sleep(self.restart_delay)
        
        # 启动新进程
        if self._start_process():
            self.logger.info("程序重启成功")
        else:
            self.logger.error("程序重启失败")
    
    def _check_process_health(self) -> bool:
        """检查进程健康状态"""
        if not self._is_process_running():
            return False
        
        # 这里可以添加更多的健康检查逻辑
        # 例如：检查进程的CPU使用率、内存使用率等
        
        return True
    
    def run(self):
        """运行监控器"""
        self.logger.info("启动程序监控器")
        self.logger.info(f"监控程序: {self.config['program']}")
        self.logger.info(f"检查间隔: {self.check_interval} 秒")
        self.logger.info(f"最大重启次数: {self.max_restarts}")
        
        # 启动初始进程
        if not self._start_process():
            self.logger.error("无法启动被监控的程序，退出")
            return
        
        # 监控循环
        while self.running:
            try:
                if not self._check_process_health():
                    self.logger.warning("检测到程序异常，准备重启")
                    self._restart_process()
                    if not self.running:
                        break
                else:
                    # 重置重启计数（程序运行正常）
                    if self.restart_count > 0:
                        self.logger.info("程序运行正常，重置重启计数")
                        self.restart_count = 0
                
                # 等待下次检查
                time.sleep(self.check_interval)
                
            except KeyboardInterrupt:
                self.logger.info("收到键盘中断信号")
                break
            except Exception as e:
                self.logger.error(f"监控过程中发生错误: {e}")
                time.sleep(self.check_interval)
        
        # 清理
        if self.process and self._is_process_running():
            self.logger.info("正在终止被监控的程序...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        
        self.logger.info("程序监控器已停止")


def create_sample_config():
    """创建示例配置文件"""
    sample_config = {
        "program": "/usr/bin/python3",
        "args": ["-c", "import time; time.sleep(10)"],
        "working_dir": ".",
        "env": {
            "PYTHONPATH": "/path/to/your/project"
        },
        "check_interval": 10,
        "restart_delay": 5,
        "max_restarts": 10,
        "log_file": "process_monitor.log",
        "log_level": "INFO"
    }
    
    with open('process_monitor_config.json', 'w', encoding='utf-8') as f:
        json.dump(sample_config, f, indent=2, ensure_ascii=False)
    
    print("已创建示例配置文件: process_monitor_config.json")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='程序监控和自动重启脚本')
    parser.add_argument('-c', '--config', help='配置文件路径')
    parser.add_argument('-p', '--program', help='要监控的程序路径')
    parser.add_argument('-a', '--args', nargs='*', help='程序参数')
    parser.add_argument('-i', '--interval', type=int, help='检查间隔（秒）')
    parser.add_argument('-d', '--delay', type=int, help='重启延迟（秒）')
    parser.add_argument('-m', '--max-restarts', type=int, help='最大重启次数')
    parser.add_argument('--create-config', action='store_true', help='创建示例配置文件')
    
    args = parser.parse_args()
    
    if args.create_config:
        create_sample_config()
        return
    
    # 创建监控器
    monitor = ProcessMonitor(args.config)
    
    # 覆盖命令行参数
    if args.program:
        monitor.config['program'] = args.program
    if args.args is not None:
        monitor.config['args'] = args.args
    if args.interval:
        monitor.config['check_interval'] = args.interval
    if args.delay:
        monitor.config['restart_delay'] = args.delay
    if args.max_restarts:
        monitor.config['max_restarts'] = args.max_restarts
    
    # 验证配置
    if not monitor.config['program']:
        print("错误: 未指定要监控的程序")
        print("使用 -p 参数指定程序路径，或使用 -c 参数指定配置文件")
        print("使用 --create-config 创建示例配置文件")
        sys.exit(1)
    
    # 运行监控器
    try:
        monitor.run()
    except Exception as e:
        print(f"监控器运行失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()