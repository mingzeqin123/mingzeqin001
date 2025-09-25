#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译演示脚本
展示如何使用翻译功能
"""

def demo_basic_usage():
    """演示基本使用方法"""
    print("=" * 60)
    print("百度翻译API - 基本使用演示")
    print("=" * 60)
    
    try:
        from baidu_translator import BaiduTranslator
        
        # 创建翻译器实例
        translator = BaiduTranslator()
        print("✓ 翻译器初始化成功")
        
        # 演示文本
        demo_texts = [
            "你好，世界！",
            "今天天气很好，适合出去散步。",
            "我喜欢学习新的编程语言。",
            "谢谢你的帮助，这对我很有用。",
            "再见，祝你有美好的一天！"
        ]
        
        print(f"\n将翻译以下 {len(demo_texts)} 个中文句子:")
        print("-" * 60)
        
        for i, text in enumerate(demo_texts, 1):
            print(f"\n{i}. 原文: {text}")
            
            # 执行翻译
            result = translator.translate_chinese_to_english(text)
            
            if result.get("success"):
                print(f"   译文: {result['translated_text']}")
            else:
                print(f"   ❌ 翻译失败: {result.get('error', '未知错误')}")
        
        print("\n" + "=" * 60)
        print("演示完成！")
        
    except ValueError as e:
        print(f"❌ 配置错误: {str(e)}")
        print("\n请先配置百度翻译API密钥:")
        print("1. 编辑 baidu_translate_config.py")
        print("2. 将 your_app_id_here 替换为你的APP ID")
        print("3. 将 your_secret_key_here 替换为你的密钥")
    except Exception as e:
        print(f"❌ 演示失败: {str(e)}")


def demo_multilingual():
    """演示多语言翻译"""
    print("\n" + "=" * 60)
    print("多语言翻译演示")
    print("=" * 60)
    
    try:
        from baidu_translator import BaiduTranslator
        
        translator = BaiduTranslator()
        
        # 多语言翻译示例
        translations = [
            ("你好", "zh", "en", "Hello"),
            ("Hello", "en", "zh", "你好"),
            ("こんにちは", "jp", "zh", "你好"),
            ("안녕하세요", "kor", "zh", "你好"),
            ("Bonjour", "fra", "zh", "你好"),
            ("Hallo", "de", "zh", "你好"),
        ]
        
        print("多语言互译示例:")
        print("-" * 60)
        
        for original, from_lang, to_lang, expected in translations:
            print(f"\n原文 ({from_lang}): {original}")
            
            result = translator.translate(original, from_lang, to_lang)
            
            if result.get("success"):
                print(f"译文 ({to_lang}): {result['translated_text']}")
                if expected:
                    print(f"预期: {expected}")
            else:
                print(f"❌ 翻译失败: {result.get('error', '未知错误')}")
        
        print("\n" + "=" * 60)
        print("多语言演示完成！")
        
    except Exception as e:
        print(f"❌ 多语言演示失败: {str(e)}")


def show_usage_examples():
    """显示使用示例"""
    print("\n" + "=" * 60)
    print("使用示例代码")
    print("=" * 60)
    
    example_code = '''
# 基本使用
from baidu_translator import BaiduTranslator

# 创建翻译器
translator = BaiduTranslator()

# 中文翻译成英文
result = translator.translate_chinese_to_english("你好，世界！")
if result.get("success"):
    print(result['translated_text'])  # 输出: Hello, world!

# 自定义语言翻译
result = translator.translate("Hello", from_lang='en', to_lang='zh')
if result.get("success"):
    print(result['translated_text'])  # 输出: 你好

# 批量翻译
texts = ["你好", "谢谢", "再见"]
for text in texts:
    result = translator.translate_chinese_to_english(text)
    if result.get("success"):
        print(f"{text} -> {result['translated_text']}")

# 获取支持的语言
languages = translator.get_supported_languages()
print(languages)
    '''
    
    print(example_code)
    print("=" * 60)


def main():
    """主函数"""
    print("百度翻译API演示程序")
    print("请确保已正确配置API密钥")
    print()
    
    try:
        # 基本使用演示
        demo_basic_usage()
        
        # 多语言演示
        demo_multilingual()
        
        # 显示使用示例
        show_usage_examples()
        
    except KeyboardInterrupt:
        print("\n\n演示被用户中断")
    except Exception as e:
        print(f"\n演示过程中发生错误: {str(e)}")


if __name__ == "__main__":
    main()