#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Nginx IP Monitor - 监控服务器IP变化并自动更新nginx配置
当服务器IP发生变化时，自动更新nginx配置文件并重启nginx服务
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


class IPMonitor:
    """IP变化监控器"""
    
    def __init__(self, config_file: str = "nginx_monitor_config.json"):
        """
        初始化IP监控器
        
        Args:
            config_file: 配置文件路径
        """
        self.config_file = config_file
        self.config = self._load_config()
        self.current_ip = None
        self.logger = self._setup_logger()
        
    def _load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        default_config = {
            "check_interval": 300,  # 检查间隔（秒）
            "nginx_config_path": "/etc/nginx/sites-available/default",
            "nginx_config_template": "/etc/nginx/sites-available/default.template",
            "ip_check_urls": [
                "https://api.ipify.org",
                "https://icanhazip.com",
                "https://ifconfig.me/ip"
            ],
            "log_file": "/var/log/nginx_ip_monitor.log",
            "log_level": "INFO",
            "backup_config": True,
            "test_nginx_config": True,
            "restart_nginx": True,
            "server_name_placeholder": "SERVER_IP",
            "notification": {
                "enabled": False,
                "webhook_url": "",
                "email": {
                    "enabled": False,
                    "smtp_server": "",
                    "smtp_port": 587,
                    "username": "",
                    "password": "",
                    "to_email": ""
                }
            }
        }
        
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                print(f"警告: 无法加载配置文件 {self.config_file}: {e}")
                print("使用默认配置...")
        else:
            # 创建默认配置文件
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            print(f"已创建默认配置文件: {self.config_file}")
            
        return default_config
    
    def _setup_logger(self) -> logging.Logger:
        """设置日志记录器"""
        logger = logging.getLogger('nginx_ip_monitor')
        logger.setLevel(getattr(logging, self.config['log_level']))
        
        # 创建日志目录
        log_file = Path(self.config['log_file'])
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 文件处理器
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(getattr(logging, self.config['log_level']))
        
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
        """获取当前公网IP地址"""
        for url in self.config['ip_check_urls']:
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    ip = response.text.strip()
                    self.logger.debug(f"从 {url} 获取到IP: {ip}")
                    return ip
            except Exception as e:
                self.logger.warning(f"从 {url} 获取IP失败: {e}")
                continue
        
        self.logger.error("无法获取当前IP地址")
        return None
    
    def backup_nginx_config(self) -> bool:
        """备份nginx配置文件"""
        if not self.config['backup_config']:
            return True
            
        try:
            config_path = Path(self.config['nginx_config_path'])
            if not config_path.exists():
                self.logger.error(f"nginx配置文件不存在: {config_path}")
                return False
                
            backup_path = config_path.with_suffix(
                f".backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
            
            subprocess.run(['cp', str(config_path), str(backup_path)], 
                         check=True, capture_output=True)
            self.logger.info(f"已备份nginx配置到: {backup_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"备份nginx配置失败: {e}")
            return False
    
    def update_nginx_config(self, new_ip: str) -> bool:
        """更新nginx配置文件"""
        try:
            config_path = Path(self.config['nginx_config_path'])
            template_path = Path(self.config['nginx_config_template'])
            
            # 如果有模板文件，使用模板
            if template_path.exists():
                with open(template_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 替换占位符
                content = content.replace(self.config['server_name_placeholder'], new_ip)
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                self.logger.info(f"使用模板更新nginx配置，新IP: {new_ip}")
                
            else:
                # 如果没有模板，直接替换现有配置中的IP
                if not config_path.exists():
                    self.logger.error(f"nginx配置文件不存在: {config_path}")
                    return False
                
                with open(config_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 简单的IP替换（这里可能需要根据具体配置调整）
                if self.current_ip:
                    content = content.replace(self.current_ip, new_ip)
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                self.logger.info(f"直接替换nginx配置中的IP，从 {self.current_ip} 到 {new_ip}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"更新nginx配置失败: {e}")
            return False
    
    def test_nginx_config(self) -> bool:
        """测试nginx配置文件语法"""
        if not self.config['test_nginx_config']:
            return True
            
        try:
            result = subprocess.run(['nginx', '-t'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                self.logger.info("nginx配置文件语法检查通过")
                return True
            else:
                self.logger.error(f"nginx配置文件语法错误: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"测试nginx配置失败: {e}")
            return False
    
    def restart_nginx(self) -> bool:
        """重启nginx服务"""
        if not self.config['restart_nginx']:
            self.logger.info("配置中禁用了nginx重启")
            return True
            
        try:
            # 尝试使用systemctl重启
            result = subprocess.run(['systemctl', 'restart', 'nginx'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                self.logger.info("nginx服务重启成功")
                return True
            else:
                self.logger.error(f"nginx重启失败: {result.stderr}")
                
                # 尝试使用service命令
                result = subprocess.run(['service', 'nginx', 'restart'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    self.logger.info("nginx服务重启成功 (使用service命令)")
                    return True
                else:
                    self.logger.error(f"nginx重启失败 (service): {result.stderr}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"重启nginx服务失败: {e}")
            return False
    
    def send_notification(self, message: str):
        """发送通知"""
        if not self.config['notification']['enabled']:
            return
            
        # Webhook通知
        webhook_url = self.config['notification']['webhook_url']
        if webhook_url:
            try:
                payload = {
                    'text': f"Nginx IP Monitor: {message}",
                    'timestamp': datetime.now().isoformat()
                }
                requests.post(webhook_url, json=payload, timeout=10)
                self.logger.info("已发送webhook通知")
            except Exception as e:
                self.logger.error(f"发送webhook通知失败: {e}")
        
        # 邮件通知
        email_config = self.config['notification']['email']
        if email_config['enabled']:
            try:
                import smtplib
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart
                
                msg = MIMEMultipart()
                msg['From'] = email_config['username']
                msg['To'] = email_config['to_email']
                msg['Subject'] = "Nginx IP Monitor 通知"
                
                msg.attach(MIMEText(message, 'plain', 'utf-8'))
                
                server = smtplib.SMTP(email_config['smtp_server'], 
                                    email_config['smtp_port'])
                server.starttls()
                server.login(email_config['username'], email_config['password'])
                server.send_message(msg)
                server.quit()
                
                self.logger.info("已发送邮件通知")
            except Exception as e:
                self.logger.error(f"发送邮件通知失败: {e}")
    
    def check_and_update(self):
        """检查IP变化并更新配置"""
        new_ip = self.get_current_ip()
        
        if not new_ip:
            self.logger.error("无法获取当前IP，跳过此次检查")
            return
        
        if self.current_ip is None:
            self.current_ip = new_ip
            self.logger.info(f"初始化当前IP: {new_ip}")
            return
        
        if new_ip != self.current_ip:
            self.logger.info(f"检测到IP变化: {self.current_ip} -> {new_ip}")
            
            # 备份配置
            if not self.backup_nginx_config():
                self.logger.error("备份配置失败，中止更新")
                return
            
            # 更新配置
            if not self.update_nginx_config(new_ip):
                self.logger.error("更新nginx配置失败")
                return
            
            # 测试配置
            if not self.test_nginx_config():
                self.logger.error("nginx配置测试失败，不重启服务")
                return
            
            # 重启nginx
            if self.restart_nginx():
                self.current_ip = new_ip
                message = f"IP变化处理成功: {self.current_ip} -> {new_ip}"
                self.logger.info(message)
                self.send_notification(message)
            else:
                self.logger.error("nginx重启失败")
        else:
            self.logger.debug(f"IP未变化: {new_ip}")
    
    def run(self):
        """运行监控循环"""
        self.logger.info("开始运行nginx IP监控器")
        self.logger.info(f"检查间隔: {self.config['check_interval']} 秒")
        
        try:
            while True:
                self.check_and_update()
                time.sleep(self.config['check_interval'])
                
        except KeyboardInterrupt:
            self.logger.info("收到中断信号，停止监控")
        except Exception as e:
            self.logger.error(f"监控过程中发生错误: {e}")
            raise


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Nginx IP Monitor - 监控IP变化并更新nginx配置')
    parser.add_argument('-c', '--config', default='nginx_monitor_config.json',
                       help='配置文件路径 (默认: nginx_monitor_config.json)')
    parser.add_argument('-d', '--daemon', action='store_true',
                       help='以守护进程模式运行')
    parser.add_argument('--check-once', action='store_true',
                       help='只检查一次，不进入循环')
    
    args = parser.parse_args()
    
    # 检查是否以root权限运行
    if os.geteuid() != 0:
        print("警告: 建议以root权限运行此脚本以确保能够修改nginx配置和重启服务")
    
    monitor = IPMonitor(args.config)
    
    if args.check_once:
        monitor.check_and_update()
    elif args.daemon:
        # 简单的守护进程实现
        import daemon
        with daemon.DaemonContext():
            monitor.run()
    else:
        monitor.run()


if __name__ == '__main__':
    main()