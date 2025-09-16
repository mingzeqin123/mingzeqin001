#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中文到英文翻译程序
支持多种翻译服务：Google Translate, DeepL, 百度翻译
"""

import requests
import json
import time
import hashlib
import random
import argparse
import sys
from typing import Optional, Dict, Any
import urllib.parse


class ChineseTranslator:
    """中文到英文翻译器"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def translate_with_google(self, text: str) -> Optional[str]:
        """使用Google翻译API（免费版本）"""
        try:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                'client': 'gtx',
                'sl': 'zh',  # 源语言：中文
                'tl': 'en',  # 目标语言：英文
                'dt': 't',
                'q': text
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            if result and result[0] and result[0][0]:
                return result[0][0][0]
            
        except Exception as e:
            print(f"Google翻译出错: {e}")
            return None
    
    def translate_with_baidu(self, text: str, app_id: str = None, secret_key: str = None) -> Optional[str]:
        """使用百度翻译API（需要注册获取app_id和secret_key）"""
        if not app_id or not secret_key:
            print("百度翻译需要app_id和secret_key，请在代码中配置或作为参数传入")
            return None
        
        try:
            url = "https://fanyi-api.baidu.com/api/trans/vip/translate"
            salt = str(random.randint(32768, 65536))
            sign_str = app_id + text + salt + secret_key
            sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()
            
            params = {
                'q': text,
                'from': 'zh',
                'to': 'en',
                'appid': app_id,
                'salt': salt,
                'sign': sign
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            if result.get('trans_result'):
                return result['trans_result'][0]['dst']
                
        except Exception as e:
            print(f"百度翻译出错: {e}")
            return None
    
    def translate_with_deepl_free(self, text: str) -> Optional[str]:
        """使用DeepL免费翻译（通过网页接口）"""
        try:
            url = "https://www2.deepl.com/jsonrpc"
            
            # 构建请求数据
            data = {
                "jsonrpc": "2.0",
                "method": "LMT_handle_texts",
                "params": {
                    "texts": [{"text": text, "requestAlternatives": 3}],
                    "splitting": "newlines",
                    "lang": {
                        "source_lang_user_selected": "ZH",
                        "target_lang": "EN"
                    },
                    "timestamp": int(time.time() * 1000)
                },
                "id": random.randint(1000000, 99999999)
            }
            
            response = self.session.post(url, json=data, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            if result.get('result') and result['result'].get('texts'):
                return result['result']['texts'][0]['text']
                
        except Exception as e:
            print(f"DeepL翻译出错: {e}")
            return None
    
    def translate_with_youdao(self, text: str) -> Optional[str]:
        """使用有道翻译（免费网页版）"""
        try:
            url = "https://fanyi.youdao.com/translate"
            
            data = {
                'i': text,
                'from': 'zh-CHS',
                'to': 'EN',
                'smartresult': 'dict',
                'client': 'fanyideskweb',
                'salt': str(int(time.time() * 1000)),
                'doctype': 'json',
                'version': '2.1',
                'keyfrom': 'fanyi.web',
                'action': 'FY_BY_CLICKBUTTION'
            }
            
            response = self.session.post(url, data=data, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            if result.get('translateResult') and result['translateResult'][0]:
                return result['translateResult'][0][0]['tgt']
                
        except Exception as e:
            print(f"有道翻译出错: {e}")
            return None
    
    def translate(self, text: str, service: str = 'google', **kwargs) -> Optional[str]:
        """
        翻译文本
        
        Args:
            text: 要翻译的中文文本
            service: 翻译服务 ('google', 'baidu', 'deepl', 'youdao')
            **kwargs: 其他参数（如百度翻译的app_id和secret_key）
        
        Returns:
            翻译结果或None
        """
        if not text.strip():
            return ""
        
        print(f"正在使用 {service} 翻译...")
        
        if service == 'google':
            return self.translate_with_google(text)
        elif service == 'baidu':
            return self.translate_with_baidu(text, kwargs.get('app_id'), kwargs.get('secret_key'))
        elif service == 'deepl':
            return self.translate_with_deepl_free(text)
        elif service == 'youdao':
            return self.translate_with_youdao(text)
        else:
            print(f"不支持的翻译服务: {service}")
            return None
    
    def translate_with_fallback(self, text: str, services: list = None) -> Optional[str]:
        """
        使用多个翻译服务进行翻译，如果一个失败则尝试下一个
        
        Args:
            text: 要翻译的文本
            services: 翻译服务列表，按优先级排序
        
        Returns:
            翻译结果或None
        """
        if services is None:
            services = ['google', 'youdao', 'deepl']
        
        for service in services:
            try:
                result = self.translate(text, service)
                if result:
                    print(f"翻译成功（使用 {service}）")
                    return result
            except Exception as e:
                print(f"{service} 翻译失败: {e}")
                continue
        
        print("所有翻译服务都失败了")
        return None


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='中文到英文翻译程序')
    parser.add_argument('text', nargs='?', help='要翻译的中文文本')
    parser.add_argument('-s', '--service', default='google', 
                       choices=['google', 'baidu', 'deepl', 'youdao', 'auto'],
                       help='选择翻译服务 (默认: google)')
    parser.add_argument('-i', '--interactive', action='store_true',
                       help='交互模式')
    parser.add_argument('--baidu-app-id', help='百度翻译App ID')
    parser.add_argument('--baidu-secret-key', help='百度翻译Secret Key')
    
    args = parser.parse_args()
    
    translator = ChineseTranslator()
    
    def translate_text(text: str) -> None:
        """翻译单个文本"""
        if not text.strip():
            print("请输入要翻译的文本")
            return
        
        print(f"\n原文: {text}")
        print("-" * 50)
        
        if args.service == 'auto':
            # 自动选择翻译服务
            result = translator.translate_with_fallback(text)
        else:
            # 使用指定的翻译服务
            kwargs = {}
            if args.service == 'baidu':
                kwargs['app_id'] = args.baidu_app_id
                kwargs['secret_key'] = args.baidu_secret_key
            
            result = translator.translate(text, args.service, **kwargs)
        
        if result:
            print(f"译文: {result}")
        else:
            print("翻译失败")
        print("-" * 50)
    
    if args.interactive:
        # 交互模式
        print("=== 中文到英文翻译程序 ===")
        print("输入 'quit' 或 'exit' 退出程序")
        print("输入 'help' 查看帮助")
        print()
        
        while True:
            try:
                text = input("请输入要翻译的中文: ").strip()
                
                if text.lower() in ['quit', 'exit', 'q']:
                    print("再见！")
                    break
                elif text.lower() == 'help':
                    print("使用说明:")
                    print("- 直接输入中文文本进行翻译")
                    print("- 输入 'quit' 或 'exit' 退出")
                    print("- 当前翻译服务:", args.service)
                    continue
                elif not text:
                    continue
                
                translate_text(text)
                
            except KeyboardInterrupt:
                print("\n\n程序被中断，再见！")
                break
            except EOFError:
                print("\n再见！")
                break
    
    elif args.text:
        # 命令行模式
        translate_text(args.text)
    
    else:
        # 从标准输入读取
        try:
            text = sys.stdin.read().strip()
            if text:
                translate_text(text)
            else:
                parser.print_help()
        except KeyboardInterrupt:
            print("\n程序被中断")


if __name__ == "__main__":
    main()