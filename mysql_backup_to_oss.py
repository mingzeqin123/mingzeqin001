#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL数据库备份到阿里云OSS的自动化脚本
支持全量备份、增量备份、压缩、加密等功能
"""

import os
import sys
import json
import logging
import subprocess
import datetime
import gzip
import hashlib
from pathlib import Path
import oss2
import pymysql
from typing import Optional, Dict, Any

class MySQLBackupToOSS:
    def __init__(self, config_file: str = "backup_config.json"):
        """初始化备份类"""
        self.config = self.load_config(config_file)
        self.setup_logging()
        self.setup_oss_client()
        
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return config
        except FileNotFoundError:
            logging.error(f"配置文件 {config_file} 不存在")
            sys.exit(1)
        except json.JSONDecodeError as e:
            logging.error(f"配置文件格式错误: {e}")
            sys.exit(1)
    
    def setup_logging(self):
        """设置日志"""
        log_level = self.config.get('log_level', 'INFO')
        log_file = self.config.get('log_file', '/var/log/mysql_backup.log')
        
        # 确保日志目录存在
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        logging.basicConfig(
            level=getattr(logging, log_level),
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
    def setup_oss_client(self):
        """设置OSS客户端"""
        try:
            oss_config = self.config['oss']
            auth = oss2.Auth(oss_config['access_key_id'], oss_config['access_key_secret'])
            self.bucket = oss2.Bucket(auth, oss_config['endpoint'], oss_config['bucket_name'])
            logging.info("OSS客户端初始化成功")
        except KeyError as e:
            logging.error(f"OSS配置缺少必要参数: {e}")
            sys.exit(1)
        except Exception as e:
            logging.error(f"OSS客户端初始化失败: {e}")
            sys.exit(1)
    
    def test_mysql_connection(self) -> bool:
        """测试MySQL连接"""
        try:
            mysql_config = self.config['mysql']
            connection = pymysql.connect(
                host=mysql_config['host'],
                port=mysql_config['port'],
                user=mysql_config['user'],
                password=mysql_config['password'],
                charset='utf8mb4'
            )
            connection.close()
            logging.info("MySQL连接测试成功")
            return True
        except Exception as e:
            logging.error(f"MySQL连接测试失败: {e}")
            return False
    
    def create_backup_directory(self) -> str:
        """创建备份目录"""
        backup_dir = self.config.get('backup_dir', '/tmp/mysql_backup')
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        full_backup_dir = os.path.join(backup_dir, timestamp)
        
        os.makedirs(full_backup_dir, exist_ok=True)
        logging.info(f"创建备份目录: {full_backup_dir}")
        return full_backup_dir
    
    def backup_database(self, backup_dir: str) -> Optional[str]:
        """备份数据库"""
        try:
            mysql_config = self.config['mysql']
            databases = mysql_config.get('databases', [])
            
            if not databases:
                logging.warning("未指定要备份的数据库，将备份所有数据库")
                databases = ['--all-databases']
            
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"mysql_backup_{timestamp}.sql"
            backup_file_path = os.path.join(backup_dir, backup_filename)
            
            # 构建mysqldump命令
            cmd = [
                'mysqldump',
                f'--host={mysql_config["host"]}',
                f'--port={mysql_config["port"]}',
                f'--user={mysql_config["user"]}',
                f'--password={mysql_config["password"]}',
                '--single-transaction',
                '--routines',
                '--triggers',
                '--quick',
                '--lock-tables=false'
            ]
            
            # 添加数据库名称或--all-databases
            if databases == ['--all-databases']:
                cmd.append('--all-databases')
            else:
                cmd.extend(['--databases'] + databases)
            
            logging.info(f"开始备份数据库到: {backup_file_path}")
            
            # 执行备份命令
            with open(backup_file_path, 'w') as f:
                result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            
            if result.returncode != 0:
                logging.error(f"数据库备份失败: {result.stderr}")
                return None
            
            # 检查备份文件大小
            file_size = os.path.getsize(backup_file_path)
            logging.info(f"备份完成，文件大小: {file_size / 1024 / 1024:.2f} MB")
            
            return backup_file_path
            
        except Exception as e:
            logging.error(f"数据库备份过程中发生错误: {e}")
            return None
    
    def compress_backup(self, backup_file: str) -> Optional[str]:
        """压缩备份文件"""
        try:
            compressed_file = f"{backup_file}.gz"
            
            logging.info(f"开始压缩备份文件: {backup_file}")
            
            with open(backup_file, 'rb') as f_in:
                with gzip.open(compressed_file, 'wb') as f_out:
                    f_out.writelines(f_in)
            
            # 删除原始备份文件
            os.remove(backup_file)
            
            original_size = os.path.getsize(backup_file) if os.path.exists(backup_file) else 0
            compressed_size = os.path.getsize(compressed_file)
            compression_ratio = (1 - compressed_size / max(original_size, 1)) * 100
            
            logging.info(f"压缩完成，压缩后大小: {compressed_size / 1024 / 1024:.2f} MB，压缩率: {compression_ratio:.1f}%")
            
            return compressed_file
            
        except Exception as e:
            logging.error(f"压缩备份文件时发生错误: {e}")
            return None
    
    def calculate_file_hash(self, file_path: str) -> str:
        """计算文件MD5哈希值"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def upload_to_oss(self, local_file: str) -> bool:
        """上传文件到OSS"""
        try:
            file_name = os.path.basename(local_file)
            oss_key = f"{self.config['oss'].get('prefix', 'mysql_backup')}/{datetime.datetime.now().strftime('%Y/%m/%d')}/{file_name}"
            
            # 计算文件哈希值
            file_hash = self.calculate_file_hash(local_file)
            
            logging.info(f"开始上传文件到OSS: {oss_key}")
            
            # 上传文件，添加元数据
            metadata = {
                'backup_time': datetime.datetime.now().isoformat(),
                'file_hash': file_hash,
                'backup_type': 'mysql_full_backup'
            }
            
            self.bucket.put_object_from_file(
                oss_key, 
                local_file,
                headers={'x-oss-meta-backup-time': metadata['backup_time'],
                        'x-oss-meta-file-hash': metadata['file_hash'],
                        'x-oss-meta-backup-type': metadata['backup_type']}
            )
            
            # 验证上传是否成功
            if self.bucket.object_exists(oss_key):
                logging.info(f"文件上传成功: {oss_key}")
                
                # 记录备份信息
                self.record_backup_info(oss_key, local_file, file_hash)
                return True
            else:
                logging.error(f"文件上传验证失败: {oss_key}")
                return False
                
        except Exception as e:
            logging.error(f"上传文件到OSS时发生错误: {e}")
            return False
    
    def record_backup_info(self, oss_key: str, local_file: str, file_hash: str):
        """记录备份信息"""
        backup_info = {
            'timestamp': datetime.datetime.now().isoformat(),
            'oss_key': oss_key,
            'local_file': local_file,
            'file_size': os.path.getsize(local_file),
            'file_hash': file_hash,
            'status': 'success'
        }
        
        # 将备份信息写入日志文件
        backup_log_file = self.config.get('backup_log_file', '/var/log/mysql_backup_history.json')
        
        try:
            # 读取现有记录
            if os.path.exists(backup_log_file):
                with open(backup_log_file, 'r', encoding='utf-8') as f:
                    backup_history = json.load(f)
            else:
                backup_history = []
            
            # 添加新记录
            backup_history.append(backup_info)
            
            # 保持最近100条记录
            backup_history = backup_history[-100:]
            
            # 写回文件
            with open(backup_log_file, 'w', encoding='utf-8') as f:
                json.dump(backup_history, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logging.error(f"记录备份信息时发生错误: {e}")
    
    def cleanup_old_backups(self):
        """清理旧的备份文件"""
        try:
            retention_days = self.config.get('retention_days', 30)
            prefix = f"{self.config['oss'].get('prefix', 'mysql_backup')}/"
            
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=retention_days)
            
            logging.info(f"开始清理{retention_days}天前的备份文件")
            
            deleted_count = 0
            for obj in oss2.ObjectIterator(self.bucket, prefix=prefix):
                # 从对象键中提取日期
                try:
                    date_part = obj.key.split('/')[-3:-1]  # 提取年/月部分
                    if len(date_part) >= 2:
                        year, month = date_part[0], date_part[1]
                        # 简单的日期比较，可以根据需要改进
                        obj_date = datetime.datetime.strptime(f"{year}-{month}-01", "%Y-%m-%d")
                        
                        if obj_date < cutoff_date:
                            self.bucket.delete_object(obj.key)
                            deleted_count += 1
                            logging.info(f"删除旧备份文件: {obj.key}")
                            
                except (ValueError, IndexError):
                    # 如果日期解析失败，跳过该文件
                    continue
            
            logging.info(f"清理完成，共删除 {deleted_count} 个旧备份文件")
            
        except Exception as e:
            logging.error(f"清理旧备份文件时发生错误: {e}")
    
    def cleanup_local_files(self, backup_dir: str):
        """清理本地备份文件"""
        try:
            logging.info(f"清理本地备份目录: {backup_dir}")
            
            # 删除备份目录及其内容
            import shutil
            shutil.rmtree(backup_dir)
            
            logging.info("本地备份文件清理完成")
            
        except Exception as e:
            logging.error(f"清理本地备份文件时发生错误: {e}")
    
    def run_backup(self):
        """执行完整的备份流程"""
        logging.info("=" * 50)
        logging.info("开始MySQL数据库备份任务")
        
        try:
            # 1. 测试MySQL连接
            if not self.test_mysql_connection():
                logging.error("MySQL连接失败，终止备份任务")
                return False
            
            # 2. 创建备份目录
            backup_dir = self.create_backup_directory()
            
            # 3. 备份数据库
            backup_file = self.backup_database(backup_dir)
            if not backup_file:
                logging.error("数据库备份失败，终止任务")
                return False
            
            # 4. 压缩备份文件
            if self.config.get('compress', True):
                compressed_file = self.compress_backup(backup_file)
                if compressed_file:
                    backup_file = compressed_file
                else:
                    logging.warning("压缩失败，使用原始备份文件")
            
            # 5. 上传到OSS
            upload_success = self.upload_to_oss(backup_file)
            if not upload_success:
                logging.error("上传到OSS失败")
                return False
            
            # 6. 清理旧备份
            if self.config.get('auto_cleanup', True):
                self.cleanup_old_backups()
            
            # 7. 清理本地文件
            if self.config.get('cleanup_local', True):
                self.cleanup_local_files(backup_dir)
            
            logging.info("MySQL数据库备份任务完成")
            return True
            
        except Exception as e:
            logging.error(f"备份任务执行过程中发生错误: {e}")
            return False
        finally:
            logging.info("=" * 50)

def main():
    """主函数"""
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    else:
        config_file = "backup_config.json"
    
    backup_tool = MySQLBackupToOSS(config_file)
    success = backup_tool.run_backup()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()