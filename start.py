#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI评论分类器启动脚本
提供便捷的启动方式和功能演示
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def check_dependencies():
    """检查依赖包是否安装"""
    print("检查依赖包...")
    
    required_packages = [
        'flask', 'flask-cors', 'jieba', 'numpy', 'requests'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"缺少依赖包: {', '.join(missing_packages)}")
        print("正在安装依赖包...")
        
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
            ])
            print("依赖包安装完成！")
        except subprocess.CalledProcessError:
            print("依赖包安装失败，请手动运行: pip install -r requirements.txt")
            return False
    else:
        print("依赖包检查通过！")
    
    return True

def start_api_server():
    """启动API服务器"""
    print("启动API服务器...")
    try:
        from api_server import app
        app.run(host='0.0.0.0', port=5000, debug=True)
    except ImportError as e:
        print(f"启动失败: {e}")
        return False
    except KeyboardInterrupt:
        print("\n服务器已停止")
        return True

def run_tests():
    """运行测试"""
    print("运行测试...")
    try:
        import sys
        sys.argv.append('--auto')  # 添加自动运行标志
        from examples.test_comments import main as test_main
        test_main()
    except ImportError as e:
        print(f"测试运行失败: {e}")
        return False
    return True

def run_demo():
    """运行演示"""
    print("运行演示...")
    try:
        from examples.api_client import main as demo_main
        demo_main()
    except ImportError as e:
        print(f"演示运行失败: {e}")
        return False
    return True

def interactive_classify():
    """交互式分类"""
    print("启动交互式评论分类...")
    try:
        from comment_classifier import CommentClassifier
        
        classifier = CommentClassifier()
        print("评论分类器已准备就绪！")
        print("输入评论进行分类，输入 'quit' 退出")
        
        while True:
            print("\n" + "-" * 50)
            comment = input("请输入评论: ").strip()
            
            if comment.lower() == 'quit':
                break
                
            if not comment:
                print("评论不能为空")
                continue
                
            result = classifier.classify_comment(comment)
            
            print(f"分类结果: {classifier.CATEGORIES[result.category]}")
            print(f"置信度: {result.confidence:.2f}")
            print(f"原因: {', '.join(result.reasons)}")
            if result.keywords:
                print(f"关键词: {', '.join(result.keywords)}")
                
        print("退出交互式分类")
        
    except ImportError as e:
        print(f"交互式分类启动失败: {e}")
        return False
    except KeyboardInterrupt:
        print("\n退出交互式分类")
        return True
    
    return True

def show_config():
    """显示配置信息"""
    print("显示配置信息...")
    try:
        from config import Config
        Config.print_config()
    except ImportError as e:
        print(f"配置显示失败: {e}")
        return False
    return True

def show_help():
    """显示帮助信息"""
    help_text = """
AI评论分类器 - 使用帮助

功能说明:
  这是一个智能评论分类系统，能够自动识别和标记用户评论的类型。

支持的分类类型:
  - 正常评论: 有意义的正常用户评论
  - 灌水评论: 无实质内容的水贴
  - 广告评论: 包含推广信息的评论
  - 恶意评论: 包含攻击性或不当内容
  - 重复评论: 与历史评论高度相似
  - 无意义评论: 纯数字、字母或符号

使用方式:
  1. API服务器: python start.py --server
  2. 交互式分类: python start.py --interactive
  3. 运行测试: python start.py --test
  4. 运行演示: python start.py --demo
  5. 显示配置: python start.py --config
  6. 显示帮助: python start.py --help

API接口:
  - GET  /health           健康检查
  - POST /classify         单条评论分类
  - POST /classify/batch   批量评论分类
  - GET  /categories       获取分类类别

配置文件:
  - config.py              配置参数
  - .env                   环境变量
  - custom_keywords.json   自定义关键词

示例代码:
  from comment_classifier import CommentClassifier
  
  classifier = CommentClassifier()
  result = classifier.classify_comment("这是一条测试评论")
  print(f"分类: {result.category}")

更多信息请参考 README_comment_classifier.md
"""
    print(help_text)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='AI评论分类器启动脚本',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python start.py --server          # 启动API服务器
  python start.py --interactive     # 交互式分类
  python start.py --test            # 运行测试
  python start.py --demo            # 运行演示
  python start.py --config          # 显示配置
        """
    )
    
    parser.add_argument('--server', action='store_true', 
                       help='启动API服务器')
    parser.add_argument('--interactive', action='store_true', 
                       help='启动交互式分类')
    parser.add_argument('--test', action='store_true', 
                       help='运行测试')
    parser.add_argument('--demo', action='store_true', 
                       help='运行演示')
    parser.add_argument('--config', action='store_true', 
                       help='显示配置信息')
    parser.add_argument('--check-deps', action='store_true', 
                       help='检查依赖包')
    
    args = parser.parse_args()
    
    # 如果没有参数，显示帮助
    if not any(vars(args).values()):
        show_help()
        return
    
    print("=" * 60)
    print("AI评论分类器")
    print("=" * 60)
    
    # 检查依赖
    if args.check_deps or args.server or args.interactive or args.test or args.demo:
        if not check_dependencies():
            return
    
    # 执行相应功能
    if args.server:
        start_api_server()
    elif args.interactive:
        interactive_classify()
    elif args.test:
        run_tests()
    elif args.demo:
        run_demo()
    elif args.config:
        show_config()
    elif args.check_deps:
        print("依赖检查完成")

if __name__ == "__main__":
    main()