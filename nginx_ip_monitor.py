#!/usr/bin/env python3
"""
Nginx IP Monitor - 监控服务器IP变化并自动更新nginx配置
"""

import os
import sys
import time
import json
import logging
import subprocess
import requests
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

class NginxIPMonitor:
    def __init__(self, config_file: str = "/etc/nginx-ip-monitor/config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.current_ip = None
        self.logger = self.setup_logging()
        
    def load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        default_config = {
            "nginx_config_template": "/etc/nginx-ip-monitor/nginx.conf.template",
            "nginx_config_path": "/etc/nginx/nginx.conf",
            "nginx_config_backup": "/etc/nginx-ip-monitor/nginx.conf.backup",
            "check_interval": 60,  # 检查间隔（秒）
            "ip_check_services": [
                "https://api.ipify.org",
                "https://ipv4.icanhazip.com",
                "https://checkip.amazonaws.com"
            ],
            "log_file": "/var/log/nginx-ip-monitor.log",
            "log_level": "INFO",
            "restart_nginx_on_change": True,
            "test_nginx_config": True,
            "email_notifications": {
                "enabled": False,
                "smtp_server": "",
                "smtp_port": 587,
                "username": "",
                "password": "",
                "to_addresses": []
            }
        }
        
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                print(f"警告: 无法加载配置文件 {self.config_file}: {e}")
                print("使用默认配置")
        
        return default_config
    
    def setup_logging(self) -> logging.Logger:
        """设置日志"""
        logger = logging.getLogger('nginx_ip_monitor')
        logger.setLevel(getattr(logging, self.config['log_level']))
        
        # 创建日志目录
        log_file = self.config['log_file']
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        # 文件处理器
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # 格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def get_current_ip(self) -> Optional[str]:
        """获取当前公网IP"""
        for service in self.config['ip_check_services']:
            try:
                response = requests.get(service, timeout=10)
                if response.status_code == 200:
                    ip = response.text.strip()
                    # 验证IP格式
                    if self.is_valid_ip(ip):
                        return ip
            except Exception as e:
                self.logger.warning(f"从 {service} 获取IP失败: {e}")
                continue
        
        return None
    
    def is_valid_ip(self, ip: str) -> bool:
        """验证IP地址格式"""
        import re
        pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if not re.match(pattern, ip):
            return False
        
        parts = ip.split('.')
        return all(0 <= int(part) <= 255 for part in parts)
    
    def get_current_ip_from_file(self) -> Optional[str]:
        """从文件读取当前IP"""
        ip_file = "/tmp/nginx_monitor_current_ip"
        if os.path.exists(ip_file):
            try:
                with open(ip_file, 'r') as f:
                    return f.read().strip()
            except Exception:
                pass
        return None
    
    def save_current_ip(self, ip: str):
        """保存当前IP到文件"""
        ip_file = "/tmp/nginx_monitor_current_ip"
        try:
            with open(ip_file, 'w') as f:
                f.write(ip)
        except Exception as e:
            self.logger.error(f"保存IP到文件失败: {e}")
    
    def update_nginx_config(self, new_ip: str) -> bool:
        """更新nginx配置"""
        try:
            # 读取模板文件
            template_path = self.config['nginx_config_template']
            if not os.path.exists(template_path):
                self.logger.error(f"nginx配置模板文件不存在: {template_path}")
                return False
            
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # 替换IP地址
            updated_content = template_content.replace('{{SERVER_IP}}', new_ip)
            
            # 备份当前配置
            nginx_config_path = self.config['nginx_config_path']
            backup_path = self.config['nginx_config_backup']
            
            if os.path.exists(nginx_config_path):
                os.makedirs(os.path.dirname(backup_path), exist_ok=True)
                subprocess.run(['cp', nginx_config_path, backup_path], check=True)
                self.logger.info(f"已备份nginx配置到: {backup_path}")
            
            # 写入新配置
            with open(nginx_config_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            self.logger.info(f"已更新nginx配置，新IP: {new_ip}")
            return True
            
        except Exception as e:
            self.logger.error(f"更新nginx配置失败: {e}")
            return False
    
    def test_nginx_config(self) -> bool:
        """测试nginx配置"""
        try:
            result = subprocess.run(
                ['nginx', '-t'], 
                capture_output=True, 
                text=True, 
                check=True
            )
            self.logger.info("nginx配置测试通过")
            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(f"nginx配置测试失败: {e.stderr}")
            return False
    
    def restart_nginx(self) -> bool:
        """重启nginx"""
        try:
            # 测试配置
            if self.config['test_nginx_config'] and not self.test_nginx_config():
                self.logger.error("nginx配置测试失败，跳过重启")
                return False
            
            # 重启nginx
            subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
            self.logger.info("nginx已重新加载配置")
            return True
            
        except subprocess.CalledProcessError as e:
            self.logger.error(f"重启nginx失败: {e}")
            return False
    
    def send_notification(self, old_ip: str, new_ip: str):
        """发送通知"""
        if not self.config['email_notifications']['enabled']:
            return
        
        # 这里可以添加邮件通知逻辑
        self.logger.info(f"IP变化通知: {old_ip} -> {new_ip}")
    
    def run_once(self) -> bool:
        """执行一次检查"""
        try:
            # 获取当前IP
            new_ip = self.get_current_ip()
            if not new_ip:
                self.logger.error("无法获取当前IP地址")
                return False
            
            # 获取上次记录的IP
            old_ip = self.get_current_ip_from_file()
            
            if old_ip == new_ip:
                self.logger.debug(f"IP未变化: {new_ip}")
                return True
            
            self.logger.info(f"检测到IP变化: {old_ip} -> {new_ip}")
            
            # 更新nginx配置
            if not self.update_nginx_config(new_ip):
                return False
            
            # 重启nginx
            if self.config['restart_nginx_on_change']:
                if not self.restart_nginx():
                    return False
            
            # 保存新IP
            self.save_current_ip(new_ip)
            
            # 发送通知
            self.send_notification(old_ip, new_ip)
            
            self.logger.info("IP更新完成")
            return True
            
        except Exception as e:
            self.logger.error(f"执行检查时出错: {e}")
            return False
    
    def run_daemon(self):
        """以守护进程模式运行"""
        self.logger.info("启动nginx IP监控守护进程")
        
        while True:
            try:
                self.run_once()
                time.sleep(self.config['check_interval'])
            except KeyboardInterrupt:
                self.logger.info("收到中断信号，退出")
                break
            except Exception as e:
                self.logger.error(f"守护进程运行出错: {e}")
                time.sleep(60)  # 出错后等待1分钟再继续

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Nginx IP Monitor')
    parser.add_argument('--config', '-c', 
                       default='/etc/nginx-ip-monitor/config.json',
                       help='配置文件路径')
    parser.add_argument('--daemon', '-d', 
                       action='store_true',
                       help='以守护进程模式运行')
    parser.add_argument('--once', '-o', 
                       action='store_true',
                       help='只执行一次检查')
    
    args = parser.parse_args()
    
    # 检查是否以root权限运行
    if os.geteuid() != 0:
        print("错误: 此脚本需要root权限运行")
        sys.exit(1)
    
    monitor = NginxIPMonitor(args.config)
    
    if args.once:
        success = monitor.run_once()
        sys.exit(0 if success else 1)
    elif args.daemon:
        monitor.run_daemon()
    else:
        print("请指定 --daemon 或 --once 参数")
        parser.print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()