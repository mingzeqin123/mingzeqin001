#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件客户端模块
负责连接邮箱服务器，获取和解析邮件
"""

import imaplib
import email
import ssl
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from email.header import decode_header
from email.utils import parsedate_to_datetime
import re


class EmailClient:
    """邮件客户端类"""
    
    def __init__(self, server: str, port: int, use_ssl: bool = True):
        """
        初始化邮件客户端
        
        Args:
            server: IMAP服务器地址
            port: IMAP服务器端口
            use_ssl: 是否使用SSL连接
        """
        self.server = server
        self.port = port
        self.use_ssl = use_ssl
        self.imap = None
        self.logger = logging.getLogger(__name__)
        
    def connect(self, email_address: str, password: str) -> bool:
        """
        连接到邮箱服务器
        
        Args:
            email_address: 邮箱地址
            password: 邮箱密码或应用密码
            
        Returns:
            bool: 连接是否成功
        """
        try:
            if self.use_ssl:
                self.imap = imaplib.IMAP4_SSL(self.server, self.port)
            else:
                self.imap = imaplib.IMAP4(self.server, self.port)
                
            # 登录
            result, data = self.imap.login(email_address, password)
            if result == 'OK':
                self.logger.info(f"成功连接到邮箱: {email_address}")
                return True
            else:
                self.logger.error(f"登录失败: {data}")
                return False
                
        except Exception as e:
            self.logger.error(f"连接邮箱失败: {str(e)}")
            return False
    
    def disconnect(self):
        """断开邮箱连接"""
        if self.imap:
            try:
                self.imap.logout()
                self.logger.info("已断开邮箱连接")
            except Exception as e:
                self.logger.warning(f"断开连接时出错: {str(e)}")
    
    def get_folders(self) -> List[str]:
        """
        获取邮箱文件夹列表
        
        Returns:
            List[str]: 文件夹名称列表
        """
        if not self.imap:
            return []
            
        try:
            result, folders = self.imap.list()
            if result == 'OK':
                folder_names = []
                for folder in folders:
                    # 解析文件夹名称
                    folder_str = folder.decode('utf-8')
                    # 提取引号内的文件夹名
                    match = re.search(r'"([^"]*)"$', folder_str)
                    if match:
                        folder_names.append(match.group(1))
                return folder_names
        except Exception as e:
            self.logger.error(f"获取文件夹列表失败: {str(e)}")
            
        return []
    
    def select_folder(self, folder_name: str = 'INBOX') -> bool:
        """
        选择邮箱文件夹
        
        Args:
            folder_name: 文件夹名称
            
        Returns:
            bool: 选择是否成功
        """
        if not self.imap:
            return False
            
        try:
            result, data = self.imap.select(folder_name)
            if result == 'OK':
                self.logger.info(f"已选择文件夹: {folder_name}")
                return True
            else:
                self.logger.error(f"选择文件夹失败: {folder_name}")
                return False
        except Exception as e:
            self.logger.error(f"选择文件夹出错: {str(e)}")
            return False
    
    def search_emails(self, 
                     days_back: int = 7, 
                     unread_only: bool = False,
                     max_count: Optional[int] = None) -> List[str]:
        """
        搜索邮件
        
        Args:
            days_back: 搜索最近几天的邮件
            unread_only: 是否只搜索未读邮件
            max_count: 最大邮件数量限制
            
        Returns:
            List[str]: 邮件ID列表
        """
        if not self.imap:
            return []
            
        try:
            # 构建搜索条件
            search_criteria = []
            
            # 时间范围
            if days_back > 0:
                since_date = (datetime.now() - timedelta(days=days_back)).strftime('%d-%b-%Y')
                search_criteria.append(f'SINCE {since_date}')
            
            # 未读邮件
            if unread_only:
                search_criteria.append('UNSEEN')
            
            # 组合搜索条件
            search_string = ' '.join(search_criteria) if search_criteria else 'ALL'
            
            result, data = self.imap.search(None, search_string)
            if result == 'OK':
                email_ids = data[0].split()
                # 转换为字符串列表
                email_ids = [id.decode('utf-8') for id in email_ids]
                
                # 按时间倒序排列（最新的邮件在前）
                email_ids.reverse()
                
                # 限制数量
                if max_count and len(email_ids) > max_count:
                    email_ids = email_ids[:max_count]
                
                self.logger.info(f"找到 {len(email_ids)} 封邮件")
                return email_ids
            else:
                self.logger.error("搜索邮件失败")
                return []
                
        except Exception as e:
            self.logger.error(f"搜索邮件出错: {str(e)}")
            return []
    
    def fetch_email(self, email_id: str) -> Optional[Dict]:
        """
        获取邮件内容
        
        Args:
            email_id: 邮件ID
            
        Returns:
            Dict: 邮件信息字典，包含主题、发件人、收件人、时间、正文等
        """
        if not self.imap:
            return None
            
        try:
            result, data = self.imap.fetch(email_id, '(RFC822)')
            if result != 'OK':
                return None
                
            # 解析邮件
            raw_email = data[0][1]
            email_message = email.message_from_bytes(raw_email)
            
            # 提取邮件信息
            email_info = {
                'id': email_id,
                'subject': self._decode_header(email_message.get('Subject', '')),
                'from': self._decode_header(email_message.get('From', '')),
                'to': self._decode_header(email_message.get('To', '')),
                'cc': self._decode_header(email_message.get('Cc', '')),
                'date': self._parse_date(email_message.get('Date', '')),
                'body': self._extract_body(email_message),
                'attachments': self._extract_attachments(email_message)
            }
            
            return email_info
            
        except Exception as e:
            self.logger.error(f"获取邮件失败 (ID: {email_id}): {str(e)}")
            return None
    
    def _decode_header(self, header: str) -> str:
        """解码邮件头部信息"""
        if not header:
            return ''
            
        try:
            decoded_parts = decode_header(header)
            decoded_string = ''
            
            for part, encoding in decoded_parts:
                if isinstance(part, bytes):
                    if encoding:
                        decoded_string += part.decode(encoding)
                    else:
                        decoded_string += part.decode('utf-8', errors='ignore')
                else:
                    decoded_string += str(part)
                    
            return decoded_string.strip()
        except Exception:
            return str(header)
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """解析邮件日期"""
        if not date_str:
            return None
            
        try:
            return parsedate_to_datetime(date_str)
        except Exception:
            return None
    
    def _extract_body(self, email_message) -> str:
        """提取邮件正文"""
        body = ""
        
        try:
            if email_message.is_multipart():
                for part in email_message.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    
                    # 跳过附件
                    if "attachment" in content_disposition:
                        continue
                    
                    if content_type == "text/plain":
                        charset = part.get_content_charset() or 'utf-8'
                        try:
                            body += part.get_payload(decode=True).decode(charset, errors='ignore')
                        except Exception:
                            body += str(part.get_payload())
                    elif content_type == "text/html":
                        # 如果没有纯文本，则提取HTML文本
                        if not body:
                            charset = part.get_content_charset() or 'utf-8'
                            try:
                                html_content = part.get_payload(decode=True).decode(charset, errors='ignore')
                                # 简单的HTML标签清理
                                import re
                                body += re.sub(r'<[^>]+>', '', html_content)
                            except Exception:
                                pass
            else:
                # 单一部分邮件
                content_type = email_message.get_content_type()
                if content_type in ["text/plain", "text/html"]:
                    charset = email_message.get_content_charset() or 'utf-8'
                    try:
                        payload = email_message.get_payload(decode=True)
                        if isinstance(payload, bytes):
                            body = payload.decode(charset, errors='ignore')
                        else:
                            body = str(payload)
                    except Exception:
                        body = str(email_message.get_payload())
        except Exception as e:
            self.logger.warning(f"提取邮件正文失败: {str(e)}")
            
        return body.strip()
    
    def _extract_attachments(self, email_message) -> List[Dict]:
        """提取附件信息"""
        attachments = []
        
        try:
            if email_message.is_multipart():
                for part in email_message.walk():
                    content_disposition = str(part.get("Content-Disposition"))
                    
                    if "attachment" in content_disposition:
                        filename = part.get_filename()
                        if filename:
                            filename = self._decode_header(filename)
                            attachments.append({
                                'filename': filename,
                                'content_type': part.get_content_type(),
                                'size': len(part.get_payload(decode=True) or b'')
                            })
        except Exception as e:
            self.logger.warning(f"提取附件信息失败: {str(e)}")
            
        return attachments
    
    def fetch_multiple_emails(self, email_ids: List[str]) -> List[Dict]:
        """
        批量获取邮件
        
        Args:
            email_ids: 邮件ID列表
            
        Returns:
            List[Dict]: 邮件信息列表
        """
        emails = []
        
        for email_id in email_ids:
            email_info = self.fetch_email(email_id)
            if email_info:
                emails.append(email_info)
                
        return emails