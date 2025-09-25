#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译 API 调用模块
用于将中文翻译成英文
"""

import requests
import json
import hashlib
import time
import random
import os
from typing import Optional, Dict, Any


class BaiduTranslate:
    """百度翻译API客户端"""
    
    def __init__(self, app_id: str, secret_key: str):
        """
        初始化百度翻译客户端
        
        Args:
            app_id: 百度翻译API的APP ID
            secret_key: 百度翻译API的密钥
        """
        self.app_id = app_id
        self.secret_key = secret_key
        self.base_url = "https://fanyi-api.baidu.com/api/trans/vip/translate"
    
    def _generate_sign(self, query: str, salt: str) -> str:
        """
        生成签名
        
        Args:
            query: 要翻译的文本
            salt: 随机数
            
        Returns:
            签名字符串
        """
        # 拼接字符串：appid+q+salt+密钥
        sign_str = self.app_id + query + salt + self.secret_key
        # MD5加密
        md5 = hashlib.md5()
        md5.update(sign_str.encode('utf-8'))
        return md5.hexdigest()
    
    def translate(self, text: str, from_lang: str = "zh", to_lang: str = "en") -> Dict[str, Any]:
        """
        翻译文本
        
        Args:
            text: 要翻译的文本
            from_lang: 源语言代码，默认为中文(zh)
            to_lang: 目标语言代码，默认为英文(en)
            
        Returns:
            翻译结果字典，包含原文、译文等信息
        """
        # 生成随机数
        salt = str(random.randint(32768, 65536))
        
        # 生成签名
        sign = self._generate_sign(text, salt)
        
        # 构建请求参数
        params = {
            'q': text,
            'from': from_lang,
            'to': to_lang,
            'appid': self.app_id,
            'salt': salt,
            'sign': sign
        }
        
        try:
            # 发送请求
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            
            # 检查错误
            if 'error_code' in result:
                return {
                    'success': False,
                    'error_code': result['error_code'],
                    'error_msg': result.get('error_msg', '未知错误'),
                    'original_text': text
                }
            
            # 提取翻译结果
            translations = []
            if 'trans_result' in result:
                for item in result['trans_result']:
                    translations.append({
                        'src': item['src'],
                        'dst': item['dst']
                    })
            
            return {
                'success': True,
                'original_text': text,
                'translated_text': translations[0]['dst'] if translations else '',
                'translations': translations,
                'from_lang': result.get('from', from_lang),
                'to_lang': result.get('to', to_lang)
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error_code': 'REQUEST_ERROR',
                'error_msg': f'请求失败: {str(e)}',
                'original_text': text
            }
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error_code': 'JSON_ERROR',
                'error_msg': f'响应解析失败: {str(e)}',
                'original_text': text
            }
        except Exception as e:
            return {
                'success': False,
                'error_code': 'UNKNOWN_ERROR',
                'error_msg': f'未知错误: {str(e)}',
                'original_text': text
            }


def translate_chinese_to_english(text: str, app_id: Optional[str] = None, secret_key: Optional[str] = None) -> Dict[str, Any]:
    """
    便捷函数：将中文翻译成英文
    
    Args:
        text: 要翻译的中文文本
        app_id: 百度翻译API的APP ID，如果不提供则从环境变量读取
        secret_key: 百度翻译API的密钥，如果不提供则从环境变量读取
        
    Returns:
        翻译结果字典
    """
    # 从环境变量读取配置
    if app_id is None:
        app_id = os.getenv('BAIDU_APP_ID')
    if secret_key is None:
        secret_key = os.getenv('BAIDU_SECRET_KEY')
    
    if not app_id or not secret_key:
        return {
            'success': False,
            'error_code': 'CONFIG_ERROR',
            'error_msg': '请提供百度翻译API的APP ID和密钥，或设置环境变量BAIDU_APP_ID和BAIDU_SECRET_KEY',
            'original_text': text
        }
    
    translator = BaiduTranslate(app_id, secret_key)
    return translator.translate(text)


if __name__ == "__main__":
    # 示例用法
    import sys
    
    if len(sys.argv) > 1:
        # 从命令行参数读取要翻译的文本
        text_to_translate = ' '.join(sys.argv[1:])
    else:
        # 交互式输入
        text_to_translate = input("请输入要翻译的中文文本: ")
    
    # 翻译文本
    result = translate_chinese_to_english(text_to_translate)
    
    if result['success']:
        print(f"\n原文: {result['original_text']}")
        print(f"译文: {result['translated_text']}")
        print(f"语言: {result['from_lang']} -> {result['to_lang']}")
    else:
        print(f"\n翻译失败:")
        print(f"错误代码: {result['error_code']}")
        print(f"错误信息: {result['error_msg']}")