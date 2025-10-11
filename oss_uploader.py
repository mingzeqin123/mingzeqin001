#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OSS批量文件上传工具
支持自动识别文件后缀和MIME类型，批量上传文件到阿里云OSS
"""

import os
import sys
import json
import mimetypes
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

try:
    import oss2
    from tqdm import tqdm
except ImportError as e:
    print(f"缺少必要的依赖包: {e}")
    print("请运行: pip install -r requirements.txt")
    sys.exit(1)

# magic库将在需要时动态导入

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('oss_upload.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class OSSUploader:
    """OSS批量上传工具类"""
    
    def __init__(self, config_file: str = "oss_config.json"):
        """
        初始化OSS上传器
        
        Args:
            config_file: 配置文件路径
        """
        self.config = self._load_config(config_file)
        self.auth = oss2.Auth(self.config['access_key_id'], self.config['access_key_secret'])
        self.bucket = oss2.Bucket(self.auth, self.config['endpoint'], self.config['bucket_name'])
        
        # 文件类型映射
        self.mime_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
            '.7z': 'application/x-7z-compressed',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.py': 'text/x-python',
            '.java': 'text/x-java-source',
            '.cpp': 'text/x-c++src',
            '.c': 'text/x-c',
            '.h': 'text/x-c',
            '.md': 'text/markdown',
        }
    
    def _load_config(self, config_file: str) -> Dict:
        """加载配置文件"""
        if not os.path.exists(config_file):
            self._create_default_config(config_file)
            logger.warning(f"配置文件 {config_file} 不存在，已创建默认配置文件，请修改后重新运行")
            sys.exit(1)
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # 验证必需的配置项
            required_keys = ['access_key_id', 'access_key_secret', 'endpoint', 'bucket_name']
            for key in required_keys:
                if key not in config or not config[key]:
                    raise ValueError(f"配置文件中缺少必需的配置项: {key}")
            
            return config
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            sys.exit(1)
    
    def _create_default_config(self, config_file: str):
        """创建默认配置文件"""
        default_config = {
            "access_key_id": "your_access_key_id",
            "access_key_secret": "your_access_key_secret",
            "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
            "bucket_name": "your_bucket_name",
            "upload_prefix": "uploads/",
            "overwrite": False,
            "max_retries": 3,
            "chunk_size": 8192
        }
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=4, ensure_ascii=False)
    
    def _detect_file_type(self, file_path: str) -> Tuple[str, str]:
        """
        检测文件类型和MIME类型
        
        Args:
            file_path: 文件路径
            
        Returns:
            (文件扩展名, MIME类型)
        """
        file_path = Path(file_path)
        extension = file_path.suffix.lower()
        
        # 首先尝试从扩展名获取MIME类型
        if extension in self.mime_type_map:
            return extension, self.mime_type_map[extension]
        
        # 尝试使用python-magic检测
        try:
            import magic
            mime_type = magic.from_file(str(file_path), mime=True)
            return extension, mime_type
        except (ImportError, OSError, Exception):
            pass
        
        # 使用mimetypes模块
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type:
            return extension, mime_type
        
        # 默认类型
        return extension, 'application/octet-stream'
    
    def _generate_oss_key(self, file_path: str, custom_prefix: str = None) -> str:
        """
        生成OSS对象键名
        
        Args:
            file_path: 本地文件路径
            custom_prefix: 自定义前缀
            
        Returns:
            OSS对象键名
        """
        file_path = Path(file_path)
        prefix = custom_prefix or self.config.get('upload_prefix', 'uploads/')
        
        # 确保前缀以/结尾
        if not prefix.endswith('/'):
            prefix += '/'
        
        # 添加时间戳避免重名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = file_path.stem
        extension = file_path.suffix
        
        return f"{prefix}{timestamp}_{filename}{extension}"
    
    def _upload_single_file(self, file_path: str, oss_key: str, content_type: str) -> bool:
        """
        上传单个文件
        
        Args:
            file_path: 本地文件路径
            oss_key: OSS对象键名
            content_type: 内容类型
            
        Returns:
            是否上传成功
        """
        max_retries = self.config.get('max_retries', 3)
        
        for attempt in range(max_retries):
            try:
                # 检查文件是否存在
                if not os.path.exists(file_path):
                    logger.error(f"文件不存在: {file_path}")
                    return False
                
                # 检查是否覆盖
                if not self.config.get('overwrite', False):
                    try:
                        self.bucket.head_object(oss_key)
                        logger.warning(f"文件已存在，跳过上传: {oss_key}")
                        return True
                    except oss2.exceptions.NoSuchKey:
                        pass  # 文件不存在，可以上传
                
                # 上传文件
                with open(file_path, 'rb') as f:
                    headers = {'Content-Type': content_type}
                    result = self.bucket.put_object(oss_key, f, headers=headers)
                
                logger.info(f"上传成功: {file_path} -> {oss_key}")
                return True
                
            except Exception as e:
                logger.error(f"上传失败 (尝试 {attempt + 1}/{max_retries}): {file_path} - {e}")
                if attempt == max_retries - 1:
                    return False
                continue
        
        return False
    
    def upload_files(self, file_paths: List[str], custom_prefix: str = None) -> Dict[str, bool]:
        """
        批量上传文件
        
        Args:
            file_paths: 文件路径列表
            custom_prefix: 自定义上传前缀
            
        Returns:
            上传结果字典 {文件路径: 是否成功}
        """
        if not file_paths:
            logger.warning("没有文件需要上传")
            return {}
        
        results = {}
        successful_uploads = 0
        failed_uploads = 0
        
        logger.info(f"开始批量上传 {len(file_paths)} 个文件...")
        
        # 使用进度条
        with tqdm(total=len(file_paths), desc="上传进度", unit="文件") as pbar:
            for file_path in file_paths:
                try:
                    # 检测文件类型
                    extension, mime_type = self._detect_file_type(file_path)
                    logger.info(f"检测到文件类型: {file_path} -> {extension} ({mime_type})")
                    
                    # 生成OSS键名
                    oss_key = self._generate_oss_key(file_path, custom_prefix)
                    
                    # 上传文件
                    success = self._upload_single_file(file_path, oss_key, mime_type)
                    results[file_path] = success
                    
                    if success:
                        successful_uploads += 1
                    else:
                        failed_uploads += 1
                    
                    pbar.update(1)
                    pbar.set_postfix({
                        '成功': successful_uploads,
                        '失败': failed_uploads
                    })
                    
                except Exception as e:
                    logger.error(f"处理文件时出错: {file_path} - {e}")
                    results[file_path] = False
                    failed_uploads += 1
                    pbar.update(1)
        
        # 输出统计信息
        logger.info(f"批量上传完成! 成功: {successful_uploads}, 失败: {failed_uploads}")
        
        return results
    
    def upload_directory(self, directory_path: str, custom_prefix: str = None, 
                        file_extensions: List[str] = None) -> Dict[str, bool]:
        """
        上传目录中的所有文件
        
        Args:
            directory_path: 目录路径
            custom_prefix: 自定义上传前缀
            file_extensions: 允许的文件扩展名列表，None表示所有文件
            
        Returns:
            上传结果字典
        """
        if not os.path.exists(directory_path):
            logger.error(f"目录不存在: {directory_path}")
            return {}
        
        file_paths = []
        
        # 遍历目录获取所有文件
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                file_path = os.path.join(root, file)
                
                # 过滤文件扩展名
                if file_extensions:
                    file_ext = Path(file_path).suffix.lower()
                    if file_ext not in file_extensions:
                        continue
                
                file_paths.append(file_path)
        
        logger.info(f"在目录 {directory_path} 中找到 {len(file_paths)} 个文件")
        
        return self.upload_files(file_paths, custom_prefix)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='OSS批量文件上传工具')
    parser.add_argument('--files', nargs='+', help='要上传的文件路径列表')
    parser.add_argument('--directory', help='要上传的目录路径')
    parser.add_argument('--prefix', help='自定义上传前缀')
    parser.add_argument('--extensions', nargs='+', help='允许的文件扩展名列表')
    parser.add_argument('--config', default='oss_config.json', help='配置文件路径')
    
    args = parser.parse_args()
    
    # 创建上传器
    uploader = OSSUploader(args.config)
    
    results = {}
    
    if args.files:
        # 上传指定文件
        results.update(uploader.upload_files(args.files, args.prefix))
    
    if args.directory:
        # 上传目录
        results.update(uploader.upload_directory(
            args.directory, 
            args.prefix, 
            args.extensions
        ))
    
    if not args.files and not args.directory:
        print("请指定要上传的文件或目录")
        parser.print_help()
        return
    
    # 输出结果摘要
    successful = sum(1 for success in results.values() if success)
    total = len(results)
    
    print(f"\n上传完成! 总计: {total}, 成功: {successful}, 失败: {total - successful}")
    
    # 输出失败的文件
    failed_files = [path for path, success in results.items() if not success]
    if failed_files:
        print("\n失败的文件:")
        for file_path in failed_files:
            print(f"  - {file_path}")


if __name__ == "__main__":
    main()