#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中文翻译成英文的程序
支持多种翻译方式：在线翻译API和本地翻译
"""

import requests
import json
import sys
import os
from typing import Optional

class ChineseToEnglishTranslator:
    def __init__(self):
        self.translation_dict = {
            # 基础词汇翻译
            "你好": "Hello",
            "谢谢": "Thank you",
            "再见": "Goodbye",
            "是的": "Yes",
            "不是": "No",
            "请": "Please",
            "对不起": "Sorry",
            "没关系": "It's okay",
            "早上好": "Good morning",
            "下午好": "Good afternoon",
            "晚上好": "Good evening",
            "晚安": "Good night",
            "欢迎": "Welcome",
            "再见": "Goodbye",
            "今天": "Today",
            "明天": "Tomorrow",
            "昨天": "Yesterday",
            "现在": "Now",
            "这里": "Here",
            "那里": "There",
            "什么": "What",
            "哪里": "Where",
            "什么时候": "When",
            "为什么": "Why",
            "怎么": "How",
            "谁": "Who",
            "多少": "How many",
            "多少": "How much",
            "大": "Big",
            "小": "Small",
            "好": "Good",
            "坏": "Bad",
            "新": "New",
            "旧": "Old",
            "热": "Hot",
            "冷": "Cold",
            "快": "Fast",
            "慢": "Slow",
            "高": "High",
            "低": "Low",
            "长": "Long",
            "短": "Short",
            "美丽": "Beautiful",
            "丑陋": "Ugly",
            "快乐": "Happy",
            "悲伤": "Sad",
            "爱": "Love",
            "恨": "Hate",
            "朋友": "Friend",
            "家庭": "Family",
            "工作": "Work",
            "学习": "Study",
            "学校": "School",
            "医院": "Hospital",
            "商店": "Store",
            "餐厅": "Restaurant",
            "家": "Home",
            "城市": "City",
            "国家": "Country",
            "世界": "World",
            "时间": "Time",
            "年": "Year",
            "月": "Month",
            "日": "Day",
            "小时": "Hour",
            "分钟": "Minute",
            "秒": "Second",
            "一": "One",
            "二": "Two",
            "三": "Three",
            "四": "Four",
            "五": "Five",
            "六": "Six",
            "七": "Seven",
            "八": "Eight",
            "九": "Nine",
            "十": "Ten"
        }
    
    def translate_local(self, chinese_text: str) -> str:
        """使用本地词典进行翻译"""
        words = chinese_text.split()
        translated_words = []
        
        for word in words:
            if word in self.translation_dict:
                translated_words.append(self.translation_dict[word])
            else:
                # 如果词典中没有，尝试逐字翻译
                char_translations = []
                for char in word:
                    if char in self.translation_dict:
                        char_translations.append(self.translation_dict[char])
                    else:
                        char_translations.append(f"[{char}]")  # 标记未翻译的字符
                translated_words.append(" ".join(char_translations))
        
        return " ".join(translated_words)
    
    def translate_online(self, chinese_text: str) -> Optional[str]:
        """使用在线翻译API进行翻译（需要API密钥）"""
        try:
            # 这里使用免费的翻译API示例
            # 实际使用时需要替换为真实的API密钥
            url = "https://api.mymemory.translated.net/get"
            params = {
                'q': chinese_text,
                'langpair': 'zh|en'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data['responseStatus'] == 200:
                    return data['responseData']['translatedText']
                else:
                    print(f"翻译API错误: {data['responseDetails']}")
                    return None
            else:
                print(f"网络请求失败: {response.status_code}")
                return None
        except Exception as e:
            print(f"在线翻译出错: {e}")
            return None
    
    def translate(self, chinese_text: str, use_online: bool = False) -> str:
        """翻译中文文本为英文"""
        if not chinese_text.strip():
            return "请输入要翻译的中文文本"
        
        if use_online:
            online_result = self.translate_online(chinese_text)
            if online_result:
                return online_result
            else:
                print("在线翻译失败，使用本地翻译...")
        
        return self.translate_local(chinese_text)
    
    def interactive_mode(self):
        """交互式翻译模式"""
        print("=== 中文翻译成英文程序 ===")
        print("输入 'quit' 或 'exit' 退出程序")
        print("输入 'online' 切换到在线翻译模式")
        print("输入 'local' 切换到本地翻译模式")
        print("-" * 40)
        
        use_online = False
        
        while True:
            try:
                user_input = input("\n请输入中文: ").strip()
                
                if user_input.lower() in ['quit', 'exit', '退出']:
                    print("再见！")
                    break
                elif user_input.lower() == 'online':
                    use_online = True
                    print("已切换到在线翻译模式")
                    continue
                elif user_input.lower() == 'local':
                    use_online = False
                    print("已切换到本地翻译模式")
                    continue
                
                if user_input:
                    result = self.translate(user_input, use_online)
                    print(f"英文翻译: {result}")
                else:
                    print("请输入有效的中文文本")
                    
            except KeyboardInterrupt:
                print("\n\n程序被用户中断")
                break
            except Exception as e:
                print(f"发生错误: {e}")

def main():
    translator = ChineseToEnglishTranslator()
    
    if len(sys.argv) > 1:
        # 命令行模式
        chinese_text = " ".join(sys.argv[1:])
        result = translator.translate(chinese_text)
        print(f"中文: {chinese_text}")
        print(f"英文: {result}")
    else:
        # 交互模式
        translator.interactive_mode()

if __name__ == "__main__":
    main()