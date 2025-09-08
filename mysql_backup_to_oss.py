#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL数据库备份到阿里云OSS脚本
支持自动备份、压缩、上传和清理功能
"""

import os
import sys
import json
import gzip
import shutil
import logging
import subprocess
import datetime
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import oss2
    from oss2.credentials import EnvironmentVariableCredentialsProvider
except ImportError:
    print("请先安装阿里云OSS SDK: pip install oss2")
    sys.exit(1)

class MySQLBackupToOSS:
    def __init__(self, config_file: str = "backup_config.json"):
        """初始化备份工具"""
        self.config_file = config_file
        self.config = self.load_config()
        self.setup_logging()
        
        # 初始化OSS客户端
        self.oss_client = self.init_oss_client()
        
        # 创建本地备份目录
        self.backup_dir = Path(self.config['local_backup_dir'])
        self.backup_dir.mkdir(parents=True, exist_ok=True)
    
    def load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        if not os.path.exists(self.config_file):
            self.create_default_config()
        
        with open(self.config_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def create_default_config(self):
        """创建默认配置文件"""
        default_config = {
            "mysql": {
                "host": "localhost",
                "port": 3306,
                "username": "root",
                "password": "",
                "databases": ["all"],  # ["all"] 表示备份所有数据库，或指定具体数据库名列表
                "exclude_databases": ["information_schema", "performance_schema", "mysql", "sys"]
            },
            "oss": {
                "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
                "bucket_name": "your-bucket-name",
                "access_key_id": "",
                "access_key_secret": "",
                "backup_path": "mysql_backups/"
            },
            "backup": {
                "local_backup_dir": "/tmp/mysql_backups",
                "compress": True,
                "keep_local_days": 7,
                "keep_remote_days": 30,
                "backup_timeout": 3600
            },
            "logging": {
                "level": "INFO",
                "file": "/var/log/mysql_backup.log"
            }
        }
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=4, ensure_ascii=False)
        
        print(f"已创建默认配置文件: {self.config_file}")
        print("请编辑配置文件并填入正确的数据库和OSS信息")
        sys.exit(1)
    
    def setup_logging(self):
        """设置日志"""
        log_config = self.config['logging']
        log_level = getattr(logging, log_config['level'].upper())
        
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_config['file']),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def init_oss_client(self):
        """初始化OSS客户端"""
        oss_config = self.config['oss']
        
        # 优先使用环境变量
        auth = oss2.ProviderAuth(
            EnvironmentVariableCredentialsProvider()
        )
        
        # 如果环境变量不存在，使用配置文件
        if not os.getenv('OSS_ACCESS_KEY_ID'):
            auth = oss2.Auth(oss_config['access_key_id'], oss_config['access_key_secret'])
        
        return oss2.Bucket(
            auth,
            oss_config['endpoint'],
            oss_config['bucket_name']
        )
    
    def get_databases(self) -> list:
        """获取需要备份的数据库列表"""
        mysql_config = self.config['mysql']
        
        if mysql_config['databases'] == ['all']:
            # 获取所有数据库
            cmd = [
                'mysql',
                f'-h{mysql_config["host"]}',
                f'-P{mysql_config["port"]}',
                f'-u{mysql_config["username"]}',
                f'-p{mysql_config["password"]}',
                '-e', 'SHOW DATABASES;'
            ]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if result.returncode != 0:
                    raise Exception(f"获取数据库列表失败: {result.stderr}")
                
                databases = []
                for line in result.stdout.strip().split('\n')[1:]:  # 跳过标题行
                    db_name = line.strip()
                    if db_name and db_name not in mysql_config['exclude_databases']:
                        databases.append(db_name)
                
                return databases
            except subprocess.TimeoutExpired:
                raise Exception("获取数据库列表超时")
        else:
            return mysql_config['databases']
    
    def backup_database(self, database: str) -> str:
        """备份单个数据库"""
        mysql_config = self.config['mysql']
        backup_config = self.config['backup']
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"{database}_{timestamp}.sql"
        backup_path = self.backup_dir / backup_filename
        
        # 构建mysqldump命令
        cmd = [
            'mysqldump',
            f'--host={mysql_config["host"]}',
            f'--port={mysql_config["port"]}',
            f'--user={mysql_config["username"]}',
            f'--password={mysql_config["password"]}',
            '--single-transaction',
            '--routines',
            '--triggers',
            '--events',
            '--hex-blob',
            '--opt',
            database
        ]
        
        self.logger.info(f"开始备份数据库: {database}")
        
        try:
            with open(backup_path, 'w') as f:
                result = subprocess.run(
                    cmd,
                    stdout=f,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=backup_config['backup_timeout']
                )
            
            if result.returncode != 0:
                raise Exception(f"mysqldump失败: {result.stderr}")
            
            # 压缩备份文件
            if backup_config['compress']:
                compressed_path = f"{backup_path}.gz"
                with open(backup_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                os.remove(backup_path)
                backup_path = compressed_path
                self.logger.info(f"备份文件已压缩: {backup_path}")
            
            file_size = os.path.getsize(backup_path)
            self.logger.info(f"数据库 {database} 备份完成，文件大小: {file_size / 1024 / 1024:.2f} MB")
            
            return str(backup_path)
            
        except subprocess.TimeoutExpired:
            raise Exception(f"备份数据库 {database} 超时")
        except Exception as e:
            if os.path.exists(backup_path):
                os.remove(backup_path)
            raise Exception(f"备份数据库 {database} 失败: {str(e)}")
    
    def upload_to_oss(self, local_file_path: str, database: str) -> str:
        """上传文件到OSS"""
        oss_config = self.config['oss']
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        
        filename = os.path.basename(local_file_path)
        remote_path = f"{oss_config['backup_path']}{database}/{timestamp}_{filename}"
        
        self.logger.info(f"开始上传文件到OSS: {remote_path}")
        
        try:
            result = self.oss_client.put_object_from_file(remote_path, local_file_path)
            self.logger.info(f"文件上传成功: {remote_path}")
            return remote_path
        except Exception as e:
            raise Exception(f"上传文件到OSS失败: {str(e)}")
    
    def cleanup_local_files(self):
        """清理本地备份文件"""
        backup_config = self.config['backup']
        keep_days = backup_config['keep_local_days']
        
        if keep_days <= 0:
            return
        
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=keep_days)
        deleted_count = 0
        
        for file_path in self.backup_dir.glob('*'):
            if file_path.is_file():
                file_time = datetime.datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_time < cutoff_date:
                    file_path.unlink()
                    deleted_count += 1
                    self.logger.info(f"删除过期本地文件: {file_path}")
        
        if deleted_count > 0:
            self.logger.info(f"清理完成，删除了 {deleted_count} 个过期文件")
    
    def cleanup_remote_files(self):
        """清理远程OSS文件"""
        oss_config = self.config['oss']
        backup_config = self.config['backup']
        keep_days = backup_config['keep_remote_days']
        
        if keep_days <= 0:
            return
        
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=keep_days)
        deleted_count = 0
        
        try:
            for obj in oss2.ObjectIterator(self.oss_client, prefix=oss_config['backup_path']):
                if obj.last_modified.replace(tzinfo=None) < cutoff_date:
                    self.oss_client.delete_object(obj.key)
                    deleted_count += 1
                    self.logger.info(f"删除过期远程文件: {obj.key}")
            
            if deleted_count > 0:
                self.logger.info(f"远程清理完成，删除了 {deleted_count} 个过期文件")
                
        except Exception as e:
            self.logger.warning(f"清理远程文件时出错: {str(e)}")
    
    def run_backup(self):
        """执行完整备份流程"""
        try:
            self.logger.info("开始执行MySQL备份任务")
            
            # 获取数据库列表
            databases = self.get_databases()
            self.logger.info(f"需要备份的数据库: {databases}")
            
            # 备份每个数据库
            for database in databases:
                try:
                    # 备份数据库
                    backup_file = self.backup_database(database)
                    
                    # 上传到OSS
                    remote_path = self.upload_to_oss(backup_file, database)
                    
                    # 删除本地备份文件（可选）
                    if not self.config['backup'].get('keep_local', True):
                        os.remove(backup_file)
                        self.logger.info(f"已删除本地备份文件: {backup_file}")
                    
                except Exception as e:
                    self.logger.error(f"备份数据库 {database} 失败: {str(e)}")
                    continue
            
            # 清理过期文件
            self.cleanup_local_files()
            self.cleanup_remote_files()
            
            self.logger.info("MySQL备份任务完成")
            
        except Exception as e:
            self.logger.error(f"备份任务失败: {str(e)}")
            sys.exit(1)

def main():
    """主函数"""
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    else:
        config_file = "backup_config.json"
    
    backup_tool = MySQLBackupToOSS(config_file)
    backup_tool.run_backup()

if __name__ == "__main__":
    main()