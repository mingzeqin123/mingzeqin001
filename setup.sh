#!/bin/bash

# 百度云千帆大模型使用情况统计工具 - 安装脚本
# Baidu Cloud Qianfan Model Usage Statistics Tool - Setup Script

echo "=========================================="
echo "百度云千帆大模型使用情况统计工具 - 安装脚本"
echo "=========================================="

# 检查Python版本
echo "正在检查Python版本..."
python3 --version

# 检查并安装依赖
echo "正在检查依赖包..."
if ! python3 -c "import requests" 2>/dev/null; then
    echo "requests包未安装，正在安装..."
    if command -v pip3 &> /dev/null; then
        pip3 install requests --user
    else
        echo "请手动安装python3-requests包："
        echo "sudo apt install python3-requests"
    fi
else
    echo "requests包已安装 ✓"
fi

# 检查配置文件
echo "正在检查配置文件..."
if [ ! -f "config.ini" ]; then
    echo "配置文件不存在，正在创建..."
    cat > config.ini << EOF
[DEFAULT]
# 百度云API配置
# 请在百度智能云控制台获取以下信息:
# https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application

# API Key (从应用管理页面获取)
api_key = your_api_key_here

# Secret Key (从应用管理页面获取)
secret_key = your_secret_key_here

# 应用ID (可选)
app_id = your_app_id_here

[SETTINGS]
# 默认查询天数
default_days = 7

# 日志级别 (DEBUG, INFO, WARNING, ERROR)
log_level = INFO

# 导出文件格式 (json, csv, both)
export_format = both

# 请求超时时间 (秒)
timeout = 30
EOF
    echo "配置文件已创建 ✓"
else
    echo "配置文件已存在 ✓"
fi

# 测试程序
echo "正在测试程序..."
if python3 -c "import baidu_cloud_model_stats; print('程序导入成功！')" 2>/dev/null; then
    echo "程序测试通过 ✓"
else
    echo "程序测试失败 ✗"
    exit 1
fi

echo ""
echo "=========================================="
echo "安装完成！"
echo "=========================================="
echo ""
echo "使用说明："
echo "1. 编辑 config.ini 文件，填入您的百度云API密钥"
echo "2. 运行主程序: python3 baidu_cloud_model_stats.py"
echo "3. 运行示例程序: python3 example_usage.py"
echo "4. 查看详细说明: cat README_baidu_stats.md"
echo ""
echo "API密钥获取地址："
echo "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application"
echo ""
echo "祝您使用愉快！"