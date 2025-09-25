#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译工具安装和配置脚本
"""

import os
import sys
import subprocess


def check_python_version():
    """检查Python版本"""
    print("检查Python版本...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 6):
        print("❌ Python版本过低，需要Python 3.6或更高版本")
        print(f"当前版本: {version.major}.{version.minor}.{version.micro}")
        return False
    else:
        print(f"✓ Python版本: {version.major}.{version.minor}.{version.micro}")
        return True


def install_dependencies():
    """安装依赖包"""
    print("\n安装Python依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ 依赖包安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        return False


def check_config_file():
    """检查配置文件"""
    print("\n检查配置文件...")
    config_file = "baidu_translate_config.py"
    
    if not os.path.exists(config_file):
        print(f"❌ 配置文件 {config_file} 不存在")
        return False
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if "your_app_id_here" in content or "your_secret_key_here" in content:
            print("⚠️  配置文件需要更新API密钥")
            return False
        else:
            print("✓ 配置文件已配置")
            return True
            
    except Exception as e:
        print(f"❌ 读取配置文件失败: {e}")
        return False


def create_config_template():
    """创建配置模板"""
    print("\n创建配置模板...")
    
    template = '''# 百度翻译API配置文件
# 请在这里填入你的百度翻译API密钥

# 百度翻译API配置
BAIDU_APP_ID = "your_app_id_here"  # 替换为你的APP ID
BAIDU_SECRET_KEY = "your_secret_key_here"  # 替换为你的密钥

# API接口地址
BAIDU_TRANSLATE_URL = "https://fanyi-api.baidu.com/api/trans/vip/translate"

# 支持的语言代码
SUPPORTED_LANGUAGES = {
    "中文": "zh",
    "英文": "en",
    "日文": "jp",
    "韩文": "kor",
    "法文": "fra",
    "德文": "de",
    "俄文": "ru",
    "西班牙文": "spa",
    "意大利文": "it",
    "葡萄牙文": "pt",
    "阿拉伯文": "ara",
    "泰文": "th",
    "越南文": "vie"
}
'''
    
    try:
        with open("baidu_translate_config_template.py", 'w', encoding='utf-8') as f:
            f.write(template)
        print("✓ 配置模板已创建: baidu_translate_config_template.py")
        return True
    except Exception as e:
        print(f"❌ 创建配置模板失败: {e}")
        return False


def show_config_instructions():
    """显示配置说明"""
    print("\n" + "=" * 60)
    print("配置说明")
    print("=" * 60)
    print("1. 访问百度翻译开放平台:")
    print("   https://fanyi-api.baidu.com/")
    print()
    print("2. 注册账号并创建应用")
    print("3. 获取APP ID和密钥")
    print("4. 编辑 baidu_translate_config.py 文件:")
    print("   - 将 your_app_id_here 替换为你的APP ID")
    print("   - 将 your_secret_key_here 替换为你的密钥")
    print()
    print("5. 保存文件后重新运行程序")
    print("=" * 60)


def test_installation():
    """测试安装"""
    print("\n测试安装...")
    try:
        # 测试导入
        from baidu_translator import BaiduTranslator
        print("✓ 模块导入成功")
        
        # 测试初始化（会检查配置）
        try:
            translator = BaiduTranslator()
            print("✓ 翻译器初始化成功")
            print("✓ 安装和配置完成！")
            return True
        except ValueError as e:
            print(f"⚠️  配置需要更新: {str(e)}")
            return False
            
    except ImportError as e:
        print(f"❌ 模块导入失败: {e}")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("百度翻译工具 - 安装和配置")
    print("=" * 60)
    
    # 检查Python版本
    if not check_python_version():
        return
    
    # 安装依赖
    if not install_dependencies():
        return
    
    # 检查配置文件
    config_ok = check_config_file()
    
    if not config_ok:
        # 创建配置模板
        create_config_template()
        show_config_instructions()
        
        # 询问是否继续
        response = input("\n是否已配置API密钥？(y/n): ").strip().lower()
        if response != 'y':
            print("请先配置API密钥，然后重新运行此脚本")
            return
    
    # 测试安装
    if test_installation():
        print("\n🎉 安装完成！")
        print("\n使用方法:")
        print("1. 命令行界面: python baidu_translator.py")
        print("2. 图形界面: python translate_gui.py")
        print("3. 快速启动: python run_translate.py")
        print("4. 运行测试: python test_translate.py")
        print("5. 查看演示: python demo.py")
    else:
        print("\n⚠️  安装完成，但需要配置API密钥")


if __name__ == "__main__":
    main()