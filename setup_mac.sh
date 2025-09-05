#!/bin/bash

# Mac邮件关键字抓取机器人安装脚本

echo "正在设置Mac邮件关键字抓取机器人..."

# 检查Python版本
python3 --version
if [ $? -ne 0 ]; then
    echo "错误: 需要安装Python 3"
    echo "请访问 https://www.python.org/downloads/ 下载并安装Python 3"
    exit 1
fi

# 安装依赖
echo "安装Python依赖..."
pip3 install -r requirements.txt

# 创建配置文件（如果不存在）
if [ ! -f "config.json" ]; then
    echo "创建默认配置文件..."
    python3 email_keyword_bot.py --once
fi

# 设置执行权限
chmod +x email_keyword_bot.py

echo "安装完成！"
echo ""
echo "使用说明："
echo "1. 编辑 config.json 文件，配置您的邮件账户和关键字"
echo "2. 运行 'python3 email_keyword_bot.py' 开始定期监控"
echo "3. 运行 'python3 email_keyword_bot.py --once' 执行一次检查"
echo "4. 运行 'python3 email_keyword_bot.py --keywords 关键字1 关键字2' 使用自定义关键字"
echo ""
echo "注意："
echo "- 对于Gmail，需要使用应用专用密码而不是普通密码"
echo "- 确保在Gmail中启用了IMAP访问"
echo "- 监控日志会保存在 email_bot.log 文件中"