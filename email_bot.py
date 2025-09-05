#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件机器人主程序
整合邮件客户端、关键字提取和调度功能
"""

import os
import sys
import yaml
import json
import logging
import schedule
import time
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv

# 导入自定义模块
from email_client import EmailClient
from keyword_extractor import KeywordExtractor


class EmailBot:
    """邮件抓取机器人主类"""
    
    def __init__(self, config_path: str = "config.yaml"):
        """
        初始化邮件机器人
        
        Args:
            config_path: 配置文件路径
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.logger = self._setup_logging()
        
        # 初始化组件
        self.email_client = None
        self.keyword_extractor = None
        
        # 加载环境变量
        load_dotenv()
        
        self.logger.info("邮件机器人初始化完成")
    
    def _load_config(self) -> Dict:
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                return config
        except Exception as e:
            print(f"加载配置文件失败: {e}")
            sys.exit(1)
    
    def _setup_logging(self) -> logging.Logger:
        """设置日志"""
        log_config = self.config.get('logging', {})
        log_level = getattr(logging, log_config.get('level', 'INFO').upper())
        log_file = log_config.get('file', './logs/email_bot.log')
        
        # 创建日志目录
        log_dir = Path(log_file).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # 配置日志格式
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # 文件处理器
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(log_level)
        
        # 配置根日志器
        logger = logging.getLogger(__name__)
        logger.setLevel(log_level)
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def initialize_components(self) -> bool:
        """初始化邮件客户端和关键字提取器"""
        try:
            # 初始化邮件客户端
            email_config = self.config['email_config']
            self.email_client = EmailClient(
                server=email_config['imap_server'],
                port=email_config['imap_port'],
                use_ssl=email_config.get('use_ssl', True)
            )
            
            # 初始化关键字提取器
            keywords_config = self.config['keywords']
            self.keyword_extractor = KeywordExtractor(keywords_config)
            
            self.logger.info("组件初始化成功")
            return True
            
        except Exception as e:
            self.logger.error(f"组件初始化失败: {e}")
            return False
    
    def connect_to_email(self) -> bool:
        """连接到邮箱"""
        try:
            # 从环境变量获取邮箱凭据
            email_address = os.getenv('EMAIL_ADDRESS')
            email_password = os.getenv('EMAIL_PASSWORD')
            
            if not email_address or not email_password:
                self.logger.error("邮箱凭据未设置，请检查环境变量 EMAIL_ADDRESS 和 EMAIL_PASSWORD")
                return False
            
            # 连接邮箱
            if self.email_client.connect(email_address, email_password):
                self.logger.info(f"成功连接到邮箱: {email_address}")
                return True
            else:
                self.logger.error("邮箱连接失败")
                return False
                
        except Exception as e:
            self.logger.error(f"连接邮箱时出错: {e}")
            return False
    
    def fetch_and_process_emails(self) -> Optional[Dict]:
        """抓取和处理邮件"""
        if not self.email_client or not self.keyword_extractor:
            self.logger.error("组件未初始化")
            return None
            
        try:
            fetch_config = self.config['fetch_config']
            folders = fetch_config.get('folders', ['INBOX'])
            days_back = fetch_config.get('days_back', 7)
            unread_only = fetch_config.get('unread_only', False)
            max_emails = fetch_config.get('max_emails', 100)
            
            all_results = []
            total_emails_processed = 0
            
            # 处理每个文件夹
            for folder in folders:
                self.logger.info(f"处理文件夹: {folder}")
                
                # 选择文件夹
                if not self.email_client.select_folder(folder):
                    self.logger.warning(f"无法选择文件夹: {folder}")
                    continue
                
                # 搜索邮件
                email_ids = self.email_client.search_emails(
                    days_back=days_back,
                    unread_only=unread_only,
                    max_count=max_emails
                )
                
                if not email_ids:
                    self.logger.info(f"文件夹 {folder} 中没有找到邮件")
                    continue
                
                # 获取邮件内容
                self.logger.info(f"开始处理 {len(email_ids)} 封邮件")
                emails = self.email_client.fetch_multiple_emails(email_ids)
                
                if not emails:
                    self.logger.warning(f"无法获取文件夹 {folder} 中的邮件内容")
                    continue
                
                # 提取关键字
                extraction_results = self.keyword_extractor.extract_keywords_from_multiple_emails(emails)
                
                # 添加文件夹信息
                for result in extraction_results:
                    result['folder'] = folder
                
                all_results.extend(extraction_results)
                total_emails_processed += len(emails)
                
                self.logger.info(f"文件夹 {folder} 处理完成，处理了 {len(emails)} 封邮件")
            
            # 生成汇总报告
            summary_report = self.keyword_extractor.generate_summary_report(all_results)
            
            # 保存结果
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            self.save_results(all_results, summary_report, timestamp)
            
            self.logger.info(f"邮件处理完成，总共处理了 {total_emails_processed} 封邮件")
            
            return {
                'results': all_results,
                'summary': summary_report,
                'timestamp': timestamp,
                'total_processed': total_emails_processed
            }
            
        except Exception as e:
            self.logger.error(f"处理邮件时出错: {e}")
            return None
        finally:
            # 断开邮箱连接
            if self.email_client:
                self.email_client.disconnect()
    
    def save_results(self, results: List[Dict], summary: Dict, timestamp: str):
        """保存处理结果"""
        try:
            output_config = self.config['output_config']
            output_dir = Path(output_config.get('output_dir', './output'))
            output_format = output_config.get('format', 'xlsx')
            include_body = output_config.get('include_body', True)
            
            # 创建输出目录
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # 准备数据
            data_for_export = []
            
            for result in results:
                # 基础信息
                row = {
                    '邮件ID': result.get('email_id', ''),
                    '文件夹': result.get('folder', ''),
                    '主题': result.get('subject', ''),
                    '发件人': result.get('from', ''),
                    '日期': result.get('date', ''),
                    '主要类别': result.get('primary_category', ''),
                    '关键字总数': result.get('total_keywords_found', 0)
                }
                
                # 关键字统计
                keyword_stats = result.get('keyword_stats', {})
                for category, stats in keyword_stats.items():
                    row[f'{category}_关键字数量'] = stats.get('count', 0)
                    row[f'{category}_关键字'] = ', '.join(stats.get('keywords', []))
                
                # 元数据
                metadata = result.get('metadata', {})
                row['有附件'] = metadata.get('has_attachments', False)
                row['附件数量'] = metadata.get('attachment_count', 0)
                row['正文长度'] = metadata.get('body_length', 0)
                row['是否回复'] = metadata.get('is_reply', False)
                row['是否转发'] = metadata.get('is_forward', False)
                row['发件人域名'] = metadata.get('sender_domain', '')
                
                # 如果需要包含正文
                if include_body:
                    # 从原始邮件信息中获取正文（这里需要额外处理）
                    row['邮件正文'] = ''  # 可以根据需要添加
                
                data_for_export.append(row)
            
            # 保存数据
            base_filename = f"email_keywords_{timestamp}"
            
            if output_format.lower() == 'xlsx':
                # Excel格式
                excel_path = output_dir / f"{base_filename}.xlsx"
                
                with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
                    # 主数据表
                    df = pd.DataFrame(data_for_export)
                    df.to_excel(writer, sheet_name='邮件关键字', index=False)
                    
                    # 汇总报告表
                    summary_df = pd.DataFrame([summary])
                    summary_df.to_excel(writer, sheet_name='汇总报告', index=False)
                    
                self.logger.info(f"结果已保存到 Excel 文件: {excel_path}")
                
            elif output_format.lower() == 'csv':
                # CSV格式
                csv_path = output_dir / f"{base_filename}.csv"
                df = pd.DataFrame(data_for_export)
                df.to_csv(csv_path, index=False, encoding='utf-8-sig')
                
                # 单独保存汇总报告
                summary_path = output_dir / f"{base_filename}_summary.json"
                with open(summary_path, 'w', encoding='utf-8') as f:
                    json.dump(summary, f, ensure_ascii=False, indent=2, default=str)
                
                self.logger.info(f"结果已保存到 CSV 文件: {csv_path}")
                
            else:  # JSON格式
                json_path = output_dir / f"{base_filename}.json"
                output_data = {
                    'timestamp': timestamp,
                    'summary': summary,
                    'results': results
                }
                
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(output_data, f, ensure_ascii=False, indent=2, default=str)
                    
                self.logger.info(f"结果已保存到 JSON 文件: {json_path}")
            
        except Exception as e:
            self.logger.error(f"保存结果时出错: {e}")
    
    def run_once(self) -> bool:
        """执行一次邮件抓取和处理"""
        self.logger.info("开始执行邮件抓取任务")
        
        # 初始化组件
        if not self.initialize_components():
            return False
        
        # 连接邮箱
        if not self.connect_to_email():
            return False
        
        # 抓取和处理邮件
        result = self.fetch_and_process_emails()
        
        if result:
            self.logger.info("邮件抓取任务完成")
            return True
        else:
            self.logger.error("邮件抓取任务失败")
            return False
    
    def setup_scheduler(self):
        """设置定期执行调度"""
        schedule_config = self.config['schedule_config']
        interval_minutes = schedule_config.get('interval_minutes', 30)
        specific_times = schedule_config.get('specific_times', [])
        run_on_start = schedule_config.get('run_on_start', True)
        
        # 清除现有的调度任务
        schedule.clear()
        
        if specific_times:
            # 按特定时间执行
            for time_str in specific_times:
                schedule.every().day.at(time_str).do(self.run_once)
                self.logger.info(f"已设置定时任务: 每天 {time_str} 执行")
        else:
            # 按间隔时间执行
            schedule.every(interval_minutes).minutes.do(self.run_once)
            self.logger.info(f"已设置定时任务: 每 {interval_minutes} 分钟执行一次")
        
        # 启动时立即执行一次
        if run_on_start:
            self.logger.info("启动时立即执行一次任务")
            self.run_once()
    
    def start_daemon(self):
        """启动守护进程模式"""
        self.logger.info("邮件机器人启动 - 守护进程模式")
        
        # 设置调度器
        self.setup_scheduler()
        
        # 主循环
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # 每分钟检查一次
                
        except KeyboardInterrupt:
            self.logger.info("收到中断信号，正在停止...")
        except Exception as e:
            self.logger.error(f"守护进程运行时出错: {e}")
        finally:
            self.logger.info("邮件机器人已停止")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='邮件关键字抓取机器人')
    parser.add_argument('--config', '-c', default='config.yaml', help='配置文件路径')
    parser.add_argument('--once', action='store_true', help='执行一次后退出')
    parser.add_argument('--daemon', action='store_true', help='守护进程模式')
    
    args = parser.parse_args()
    
    # 创建机器人实例
    bot = EmailBot(config_path=args.config)
    
    if args.once:
        # 执行一次
        success = bot.run_once()
        sys.exit(0 if success else 1)
    elif args.daemon:
        # 守护进程模式
        bot.start_daemon()
    else:
        # 默认执行一次
        success = bot.run_once()
        sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()