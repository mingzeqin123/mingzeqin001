#!/usr/bin/env python3
"""
Mac邮件关键字抓取机器人
定期检查邮件并提取包含指定关键字的邮件
"""

import imaplib
import email
import json
import logging
import time
import schedule
from datetime import datetime, timedelta
from email.header import decode_header
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import re
from typing import List, Dict, Any
import argparse

class EmailKeywordBot:
    def __init__(self, config_file: str = "config.json"):
        """初始化邮件机器人"""
        self.config = self.load_config(config_file)
        self.setup_logging()
        self.keywords = self.config.get('keywords', [])
        self.email_accounts = self.config.get('email_accounts', [])
        self.notification_settings = self.config.get('notification', {})
        
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # 创建默认配置
            default_config = {
                "email_accounts": [
                    {
                        "name": "Gmail",
                        "imap_server": "imap.gmail.com",
                        "imap_port": 993,
                        "smtp_server": "smtp.gmail.com",
                        "smtp_port": 587,
                        "email": "your_email@gmail.com",
                        "password": "your_app_password",
                        "folders": ["INBOX", "Important"]
                    }
                ],
                "keywords": [
                    "重要",
                    "urgent",
                    "会议",
                    "meeting",
                    "项目",
                    "project"
                ],
                "notification": {
                    "enabled": True,
                    "email_notification": True,
                    "notification_email": "notification@example.com",
                    "check_interval_minutes": 30
                },
                "search_settings": {
                    "days_back": 7,
                    "max_emails_per_check": 50
                }
            }
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=4, ensure_ascii=False)
            return default_config
    
    def setup_logging(self):
        """设置日志记录"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('email_bot.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def decode_email_header(self, header_value):
        """解码邮件头信息"""
        if header_value is None:
            return ""
        
        decoded_parts = decode_header(header_value)
        decoded_string = ""
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    decoded_string += part.decode(encoding)
                else:
                    decoded_string += part.decode('utf-8', errors='ignore')
            else:
                decoded_string += part
        
        return decoded_string
    
    def extract_email_content(self, msg) -> Dict[str, str]:
        """提取邮件内容"""
        content = {
            'subject': '',
            'from': '',
            'to': '',
            'date': '',
            'body': '',
            'attachments': []
        }
        
        # 提取基本信息
        content['subject'] = self.decode_email_header(msg.get('Subject', ''))
        content['from'] = self.decode_email_header(msg.get('From', ''))
        content['to'] = self.decode_email_header(msg.get('To', ''))
        content['date'] = msg.get('Date', '')
        
        # 提取邮件正文
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    body = part.get_payload(decode=True)
                    if body:
                        content['body'] += body.decode('utf-8', errors='ignore')
                elif content_type == "text/html":
                    body = part.get_payload(decode=True)
                    if body:
                        # 简单的HTML标签清理
                        html_body = body.decode('utf-8', errors='ignore')
                        content['body'] += re.sub(r'<[^>]+>', '', html_body)
                elif part.get_filename():
                    content['attachments'].append(part.get_filename())
        else:
            body = msg.get_payload(decode=True)
            if body:
                content['body'] = body.decode('utf-8', errors='ignore')
        
        return content
    
    def search_keywords_in_content(self, content: Dict[str, str]) -> List[str]:
        """在邮件内容中搜索关键字"""
        found_keywords = []
        text_to_search = f"{content['subject']} {content['body']}".lower()
        
        for keyword in self.keywords:
            if keyword.lower() in text_to_search:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def connect_to_email(self, account: Dict[str, Any]) -> imaplib.IMAP4_SSL:
        """连接到邮件服务器"""
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['imap_port'])
            mail.login(account['email'], account['password'])
            return mail
        except Exception as e:
            self.logger.error(f"连接邮件服务器失败 {account['email']}: {e}")
            raise
    
    def check_emails_for_account(self, account: Dict[str, Any]) -> List[Dict[str, Any]]:
        """检查单个邮件账户"""
        matched_emails = []
        
        try:
            mail = self.connect_to_email(account)
            
            for folder in account.get('folders', ['INBOX']):
                try:
                    mail.select(folder)
                    
                    # 搜索最近几天的邮件
                    days_back = self.config.get('search_settings', {}).get('days_back', 7)
                    since_date = (datetime.now() - timedelta(days=days_back)).strftime('%d-%b-%Y')
                    search_criteria = f'(SINCE "{since_date}")'
                    
                    status, messages = mail.search(None, search_criteria)
                    
                    if status != 'OK':
                        self.logger.warning(f"搜索邮件失败 {account['email']} - {folder}")
                        continue
                    
                    email_ids = messages[0].split()
                    max_emails = self.config.get('search_settings', {}).get('max_emails_per_check', 50)
                    
                    for email_id in email_ids[-max_emails:]:  # 只检查最新的邮件
                        try:
                            status, msg_data = mail.fetch(email_id, '(RFC822)')
                            
                            if status != 'OK':
                                continue
                            
                            msg = email.message_from_bytes(msg_data[0][1])
                            content = self.extract_email_content(msg)
                            found_keywords = self.search_keywords_in_content(content)
                            
                            if found_keywords:
                                matched_email = {
                                    'account': account['name'],
                                    'folder': folder,
                                    'email_id': email_id.decode(),
                                    'keywords_found': found_keywords,
                                    'content': content,
                                    'timestamp': datetime.now().isoformat()
                                }
                                matched_emails.append(matched_email)
                                
                                self.logger.info(f"找到匹配邮件: {account['name']} - {content['subject']} - 关键字: {found_keywords}")
                        
                        except Exception as e:
                            self.logger.error(f"处理邮件失败 {email_id}: {e}")
                            continue
                
                except Exception as e:
                    self.logger.error(f"处理文件夹失败 {folder}: {e}")
                    continue
            
            mail.close()
            mail.logout()
            
        except Exception as e:
            self.logger.error(f"检查邮件账户失败 {account['email']}: {e}")
        
        return matched_emails
    
    def send_notification(self, matched_emails: List[Dict[str, Any]]):
        """发送通知"""
        if not self.notification_settings.get('enabled', False):
            return
        
        if not matched_emails:
            return
        
        try:
            # 准备通知内容
            notification_body = f"发现 {len(matched_emails)} 封包含关键字的邮件:\n\n"
            
            for email_info in matched_emails:
                notification_body += f"账户: {email_info['account']}\n"
                notification_body += f"文件夹: {email_info['folder']}\n"
                notification_body += f"主题: {email_info['content']['subject']}\n"
                notification_body += f"发件人: {email_info['content']['from']}\n"
                notification_body += f"关键字: {', '.join(email_info['keywords_found'])}\n"
                notification_body += f"时间: {email_info['timestamp']}\n"
                notification_body += "-" * 50 + "\n"
            
            # 发送邮件通知
            if self.notification_settings.get('email_notification', False):
                self.send_email_notification(notification_body)
            
            # 保存到文件
            self.save_results_to_file(matched_emails)
            
        except Exception as e:
            self.logger.error(f"发送通知失败: {e}")
    
    def send_email_notification(self, body: str):
        """发送邮件通知"""
        try:
            notification_email = self.notification_settings.get('notification_email')
            if not notification_email:
                return
            
            # 使用第一个邮件账户发送通知
            account = self.email_accounts[0]
            
            msg = MIMEMultipart()
            msg['From'] = account['email']
            msg['To'] = notification_email
            msg['Subject'] = f"邮件关键字监控报告 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            server = smtplib.SMTP(account['smtp_server'], account['smtp_port'])
            server.starttls()
            server.login(account['email'], account['password'])
            server.send_message(msg)
            server.quit()
            
            self.logger.info("邮件通知发送成功")
            
        except Exception as e:
            self.logger.error(f"发送邮件通知失败: {e}")
    
    def save_results_to_file(self, matched_emails: List[Dict[str, Any]]):
        """保存结果到文件"""
        try:
            results_file = f"email_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(matched_emails, f, indent=4, ensure_ascii=False)
            self.logger.info(f"结果已保存到 {results_file}")
        except Exception as e:
            self.logger.error(f"保存结果失败: {e}")
    
    def run_check(self):
        """执行一次邮件检查"""
        self.logger.info("开始检查邮件...")
        all_matched_emails = []
        
        for account in self.email_accounts:
            self.logger.info(f"检查账户: {account['name']} ({account['email']})")
            matched_emails = self.check_emails_for_account(account)
            all_matched_emails.extend(matched_emails)
        
        if all_matched_emails:
            self.logger.info(f"总共找到 {len(all_matched_emails)} 封匹配的邮件")
            self.send_notification(all_matched_emails)
        else:
            self.logger.info("未找到包含关键字的邮件")
    
    def start_scheduler(self):
        """启动定期调度"""
        interval_minutes = self.notification_settings.get('check_interval_minutes', 30)
        schedule.every(interval_minutes).minutes.do(self.run_check)
        
        self.logger.info(f"邮件监控已启动，每 {interval_minutes} 分钟检查一次")
        self.logger.info("按 Ctrl+C 停止监控")
        
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # 每分钟检查一次调度
        except KeyboardInterrupt:
            self.logger.info("监控已停止")

def main():
    parser = argparse.ArgumentParser(description='Mac邮件关键字抓取机器人')
    parser.add_argument('--config', default='config.json', help='配置文件路径')
    parser.add_argument('--once', action='store_true', help='只运行一次检查')
    parser.add_argument('--keywords', nargs='+', help='要搜索的关键字')
    
    args = parser.parse_args()
    
    bot = EmailKeywordBot(args.config)
    
    if args.keywords:
        bot.keywords = args.keywords
        bot.logger.info(f"使用命令行关键字: {bot.keywords}")
    
    if args.once:
        bot.run_check()
    else:
        bot.start_scheduler()

if __name__ == "__main__":
    main()