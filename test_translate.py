#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译测试脚本
用于测试翻译功能是否正常工作
"""

from baidu_translator import BaiduTranslator


def test_translation():
    """测试翻译功能"""
    print("=" * 50)
    print("百度翻译功能测试")
    print("=" * 50)
    
    try:
        # 初始化翻译器
        translator = BaiduTranslator()
        print("✓ 翻译器初始化成功")
        
        # 测试用例
        test_cases = [
            "你好，世界！",
            "今天天气很好",
            "我喜欢学习编程",
            "谢谢你的帮助",
            "再见"
        ]
        
        print(f"\n开始测试 {len(test_cases)} 个翻译用例...")
        print("-" * 50)
        
        success_count = 0
        for i, text in enumerate(test_cases, 1):
            print(f"\n测试 {i}: {text}")
            
            result = translator.translate_chinese_to_english(text)
            
            if result.get("success"):
                print(f"✓ 翻译成功: {result['translated_text']}")
                success_count += 1
            else:
                print(f"✗ 翻译失败: {result.get('error', '未知错误')}")
        
        print("\n" + "=" * 50)
        print(f"测试完成: {success_count}/{len(test_cases)} 个用例成功")
        
        if success_count == len(test_cases):
            print("🎉 所有测试通过！")
        else:
            print("⚠️  部分测试失败，请检查API配置")
        
    except ValueError as e:
        print(f"❌ 配置错误: {str(e)}")
        print("\n请先配置百度翻译API密钥:")
        print("1. 编辑 baidu_translate_config.py")
        print("2. 填入你的APP ID和密钥")
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")


if __name__ == "__main__":
    test_translation()