#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译API调用程序
支持中文到英文的翻译，以及其他语言的互译
"""

import hashlib
import random
import requests
import json
import time
from urllib.parse import quote
from baidu_translate_config import BAIDU_APP_ID, BAIDU_SECRET_KEY, BAIDU_TRANSLATE_URL, SUPPORTED_LANGUAGES


class BaiduTranslator:
    """百度翻译API调用类"""
    
    def __init__(self, app_id=None, secret_key=None):
        """
        初始化翻译器
        
        Args:
            app_id (str): 百度翻译API的APP ID
            secret_key (str): 百度翻译API的密钥
        """
        self.app_id = app_id or BAIDU_APP_ID
        self.secret_key = secret_key or BAIDU_SECRET_KEY
        self.base_url = BAIDU_TRANSLATE_URL
        
        # 验证配置
        if self.app_id == "your_app_id_here" or self.secret_key == "your_secret_key_here":
            raise ValueError("请先在 baidu_translate_config.py 中配置你的百度翻译API密钥")
    
    def _generate_sign(self, query, salt):
        """
        生成签名
        
        Args:
            query (str): 要翻译的文本
            salt (str): 随机数
            
        Returns:
            str: 签名字符串
        """
        sign_str = self.app_id + query + salt + self.secret_key
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest()
    
    def translate(self, text, from_lang='zh', to_lang='en'):
        """
        翻译文本
        
        Args:
            text (str): 要翻译的文本
            from_lang (str): 源语言代码，默认为中文(zh)
            to_lang (str): 目标语言代码，默认为英文(en)
            
        Returns:
            dict: 翻译结果，包含翻译文本和相关信息
        """
        if not text.strip():
            return {"error": "输入文本不能为空"}
        
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
            
            # 检查是否有错误
            if 'error_code' in result:
                error_messages = {
                    '52001': '请求超时，请重试',
                    '52002': '系统错误，请重试',
                    '52003': '未授权用户，请检查APP ID和密钥',
                    '54000': '必填参数为空',
                    '54001': '签名错误',
                    '54003': '访问频率受限',
                    '54004': '账户余额不足',
                    '54005': '长query请求频繁',
                    '58000': '客户端IP非法',
                    '90107': '认证未通过或未生效'
                }
                error_msg = error_messages.get(result['error_code'], f"未知错误: {result['error_code']}")
                return {"error": error_msg}
            
            # 返回翻译结果
            if 'trans_result' in result and result['trans_result']:
                translated_text = result['trans_result'][0]['dst']
                return {
                    "success": True,
                    "original_text": text,
                    "translated_text": translated_text,
                    "from_lang": from_lang,
                    "to_lang": to_lang,
                    "raw_result": result
                }
            else:
                return {"error": "翻译结果为空"}
                
        except requests.exceptions.RequestException as e:
            return {"error": f"网络请求失败: {str(e)}"}
        except json.JSONDecodeError as e:
            return {"error": f"响应解析失败: {str(e)}"}
        except Exception as e:
            return {"error": f"未知错误: {str(e)}"}
    
    def translate_chinese_to_english(self, chinese_text):
        """
        中文翻译成英文的便捷方法
        
        Args:
            chinese_text (str): 中文文本
            
        Returns:
            dict: 翻译结果
        """
        return self.translate(chinese_text, from_lang='zh', to_lang='en')
    
    def get_supported_languages(self):
        """
        获取支持的语言列表
        
        Returns:
            dict: 支持的语言字典
        """
        return SUPPORTED_LANGUAGES.copy()


def main():
    """主函数 - 交互式翻译程序"""
    print("=" * 50)
    print("百度翻译API调用程序")
    print("=" * 50)
    
    try:
        # 初始化翻译器
        translator = BaiduTranslator()
        print("✓ 翻译器初始化成功")
        
        # 显示支持的语言
        print("\n支持的语言:")
        for lang_name, lang_code in translator.get_supported_languages().items():
            print(f"  {lang_name}: {lang_code}")
        
        print("\n" + "=" * 50)
        print("开始翻译 (输入 'quit' 或 'exit' 退出)")
        print("=" * 50)
        
        while True:
            try:
                # 获取用户输入
                user_input = input("\n请输入要翻译的中文文本: ").strip()
                
                # 检查退出命令
                if user_input.lower() in ['quit', 'exit', '退出', 'q']:
                    print("感谢使用，再见！")
                    break
                
                # 检查输入是否为空
                if not user_input:
                    print("输入不能为空，请重新输入")
                    continue
                
                # 执行翻译
                print("正在翻译...")
                result = translator.translate_chinese_to_english(user_input)
                
                # 显示结果
                if result.get("success"):
                    print(f"\n原文: {result['original_text']}")
                    print(f"译文: {result['translated_text']}")
                else:
                    print(f"\n翻译失败: {result.get('error', '未知错误')}")
                
            except KeyboardInterrupt:
                print("\n\n程序被用户中断")
                break
            except Exception as e:
                print(f"\n发生错误: {str(e)}")
    
    except ValueError as e:
        print(f"配置错误: {str(e)}")
        print("\n请按照以下步骤配置百度翻译API:")
        print("1. 访问 https://fanyi-api.baidu.com/")
        print("2. 注册并创建应用获取APP ID和密钥")
        print("3. 编辑 baidu_translate_config.py 文件")
        print("4. 将 your_app_id_here 替换为你的APP ID")
        print("5. 将 your_secret_key_here 替换为你的密钥")
    except Exception as e:
        print(f"程序启动失败: {str(e)}")


if __name__ == "__main__":
    main()