#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译快速启动脚本
提供多种运行方式的选择
"""

import sys
import os


def show_menu():
    """显示菜单"""
    print("=" * 50)
    print("百度翻译工具 - 启动菜单")
    print("=" * 50)
    print("1. 命令行界面 (推荐新手)")
    print("2. 图形用户界面 (推荐日常使用)")
    print("3. 运行测试")
    print("4. 查看帮助")
    print("5. 退出")
    print("=" * 50)


def run_command_line():
    """运行命令行界面"""
    print("启动命令行界面...")
    try:
        from baidu_translator import main
        main()
    except ImportError as e:
        print(f"导入错误: {e}")
        print("请确保 baidu_translator.py 文件存在")
    except Exception as e:
        print(f"运行错误: {e}")


def run_gui():
    """运行图形界面"""
    print("启动图形界面...")
    try:
        from translate_gui import main
        main()
    except ImportError as e:
        print(f"导入错误: {e}")
        print("请确保 translate_gui.py 文件存在")
    except Exception as e:
        print(f"运行错误: {e}")


def run_test():
    """运行测试"""
    print("运行功能测试...")
    try:
        from test_translate import test_translation
        test_translation()
    except ImportError as e:
        print(f"导入错误: {e}")
        print("请确保 test_translate.py 文件存在")
    except Exception as e:
        print(f"测试错误: {e}")


def show_help():
    """显示帮助信息"""
    print("\n" + "=" * 50)
    print("帮助信息")
    print("=" * 50)
    print("1. 命令行界面:")
    print("   - 适合在终端中使用")
    print("   - 支持批量翻译")
    print("   - 输入 'quit' 或 'exit' 退出")
    print()
    print("2. 图形用户界面:")
    print("   - 友好的图形界面")
    print("   - 支持语言选择")
    print("   - 支持文本交换")
    print("   - 快捷键: Ctrl+Enter 翻译")
    print()
    print("3. 运行测试:")
    print("   - 测试翻译功能是否正常")
    print("   - 验证API配置是否正确")
    print()
    print("配置说明:")
    print("- 首次使用需要配置百度翻译API密钥")
    print("- 编辑 baidu_translate_config.py 文件")
    print("- 访问 https://fanyi-api.baidu.com/ 获取密钥")
    print()
    print("支持的语言: 中文、英文、日文、韩文、法文、德文、俄文等")
    print("=" * 50)


def main():
    """主函数"""
    while True:
        try:
            show_menu()
            choice = input("\n请选择运行方式 (1-5): ").strip()
            
            if choice == "1":
                run_command_line()
            elif choice == "2":
                run_gui()
            elif choice == "3":
                run_test()
            elif choice == "4":
                show_help()
            elif choice == "5":
                print("感谢使用，再见！")
                break
            else:
                print("无效选择，请输入 1-5")
            
            if choice in ["1", "2", "3"]:
                input("\n按回车键返回主菜单...")
                
        except KeyboardInterrupt:
            print("\n\n程序被用户中断")
            break
        except Exception as e:
            print(f"\n发生错误: {e}")
            input("按回车键继续...")


if __name__ == "__main__":
    main()