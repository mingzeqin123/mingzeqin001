#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译使用示例
演示如何使用百度翻译API将中文翻译成英文
"""

import os
from baidu_translate import BaiduTranslate, translate_chinese_to_english


def example_basic_usage():
    """基本使用示例"""
    print("=== 基本使用示例 ===")
    
    # 示例文本
    test_texts = [
        "你好，世界！",
        "今天天气很好。",
        "我喜欢编程。",
        "微信小程序是一个很好的平台。",
        "人工智能正在改变我们的生活。"
    ]
    
    for text in test_texts:
        result = translate_chinese_to_english(text)
        
        if result['success']:
            print(f"中文: {result['original_text']}")
            print(f"英文: {result['translated_text']}")
            print("-" * 50)
        else:
            print(f"翻译失败: {text}")
            print(f"错误: {result['error_msg']}")
            print("-" * 50)


def example_class_usage():
    """使用类的示例"""
    print("\n=== 使用类的示例 ===")
    
    # 从环境变量获取配置
    app_id = os.getenv('BAIDU_APP_ID')
    secret_key = os.getenv('BAIDU_SECRET_KEY')
    
    if not app_id or not secret_key:
        print("请设置环境变量 BAIDU_APP_ID 和 BAIDU_SECRET_KEY")
        return
    
    # 创建翻译器实例
    translator = BaiduTranslate(app_id, secret_key)
    
    # 翻译示例
    text = "这是一个使用百度翻译API的示例程序。"
    result = translator.translate(text)
    
    if result['success']:
        print(f"原文: {result['original_text']}")
        print(f"译文: {result['translated_text']}")
        print(f"语言对: {result['from_lang']} -> {result['to_lang']}")
    else:
        print(f"翻译失败: {result['error_msg']}")


def example_error_handling():
    """错误处理示例"""
    print("\n=== 错误处理示例 ===")
    
    # 使用错误的配置
    fake_translator = BaiduTranslate("fake_app_id", "fake_secret")
    result = fake_translator.translate("测试文本")
    
    print(f"使用错误配置的结果:")
    print(f"成功: {result['success']}")
    if not result['success']:
        print(f"错误代码: {result['error_code']}")
        print(f"错误信息: {result['error_msg']}")


def interactive_translate():
    """交互式翻译"""
    print("\n=== 交互式翻译 ===")
    print("输入中文文本，将自动翻译成英文")
    print("输入 'quit' 或 'exit' 退出")
    
    while True:
        try:
            text = input("\n请输入中文文本: ").strip()
            
            if text.lower() in ['quit', 'exit', '退出']:
                print("再见!")
                break
            
            if not text:
                print("请输入有效的文本")
                continue
            
            print("翻译中...")
            result = translate_chinese_to_english(text)
            
            if result['success']:
                print(f"✅ 翻译成功:")
                print(f"   中文: {result['original_text']}")
                print(f"   英文: {result['translated_text']}")
            else:
                print(f"❌ 翻译失败:")
                print(f"   错误: {result['error_msg']}")
                
        except KeyboardInterrupt:
            print("\n\n程序被用户中断，再见!")
            break
        except Exception as e:
            print(f"发生错误: {str(e)}")


def setup_environment():
    """环境设置说明"""
    print("=== 环境设置说明 ===")
    print("要使用百度翻译API，你需要:")
    print("1. 在百度翻译开放平台注册账号: https://fanyi-api.baidu.com/")
    print("2. 创建应用，获取APP ID和密钥")
    print("3. 设置环境变量:")
    print("   export BAIDU_APP_ID=你的APP_ID")
    print("   export BAIDU_SECRET_KEY=你的密钥")
    print("4. 或者直接在代码中传入APP ID和密钥")
    print()
    print("当前环境变量状态:")
    app_id = os.getenv('BAIDU_APP_ID')
    secret_key = os.getenv('BAIDU_SECRET_KEY')
    print(f"BAIDU_APP_ID: {'已设置' if app_id else '未设置'}")
    print(f"BAIDU_SECRET_KEY: {'已设置' if secret_key else '未设置'}")


if __name__ == "__main__":
    print("百度翻译API使用示例")
    print("=" * 50)
    
    # 检查环境设置
    setup_environment()
    
    # 检查是否有配置
    if not os.getenv('BAIDU_APP_ID') or not os.getenv('BAIDU_SECRET_KEY'):
        print("\n⚠️  请先设置百度翻译API的配置信息")
        print("如果只是想查看代码示例，可以查看源代码")
        return
    
    try:
        # 运行示例
        example_basic_usage()
        example_class_usage()
        example_error_handling()
        
        # 交互式翻译
        user_input = input("\n是否要进入交互式翻译模式? (y/n): ")
        if user_input.lower() in ['y', 'yes', '是', 'Y']:
            interactive_translate()
            
    except Exception as e:
        print(f"运行示例时发生错误: {str(e)}")