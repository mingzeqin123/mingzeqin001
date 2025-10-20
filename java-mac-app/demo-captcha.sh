#!/bin/bash

# 滑块验证码演示脚本
# Slider Captcha Demo Script

echo "🔒 Java滑块验证码演示"
echo "======================"
echo ""

# 检查Java环境
echo "📋 检查Java环境..."
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java运行环境"
    echo "请安装Java 11或更高版本"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
echo "✅ Java版本: $JAVA_VERSION"
echo ""

# 检查JAR文件
JAR_FILE="target/mac-java-app-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "❌ 错误: 未找到JAR文件 $JAR_FILE"
    echo "请先运行 mvn clean package 构建项目"
    exit 1
fi

echo "✅ 找到应用程序: $JAR_FILE"
echo "📦 文件大小: $(du -h $JAR_FILE | cut -f1)"
echo ""

# 显示功能说明
echo "🎯 验证码功能特性:"
echo "  📌 基础滑块验证码:"
echo "     • 随机拼图位置生成"
echo "     • 简单拖拽验证"
echo "     • 基础视觉效果"
echo ""
echo "  🔐 高级滑块验证码:"
echo "     • 复杂纹理背景"
echo "     • 时间检测 (防机器人)"
echo "     • 尝试次数限制 (3次)"
echo "     • 圆形拼图设计"
echo "     • 干扰线和噪声"
echo "     • 高级动画效果"
echo ""

# 运行提示
echo "🚀 启动应用程序..."
echo "💡 使用说明:"
echo "  1. 点击 '基础验证码' 按钮测试简单版本"
echo "  2. 点击 '高级验证码' 按钮测试高级版本"
echo "  3. 拖动滑块到正确位置完成验证"
echo "  4. 观察不同验证码的安全特性"
echo ""

echo "⏳ 正在启动JavaFX应用程序..."
echo "   (如果是首次运行，可能需要几秒钟加载)"
echo ""

# 启动应用程序
java -jar "$JAR_FILE"

# 检查退出状态
EXIT_CODE=$?
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 应用程序正常退出"
else
    echo "❌ 应用程序异常退出 (退出代码: $EXIT_CODE)"
fi

echo ""
echo "📚 更多信息请查看:"
echo "  • README.md - 项目总体说明"
echo "  • CAPTCHA_README.md - 验证码详细文档"
echo "  • 源代码: src/main/java/com/example/captcha/"
echo ""
echo "🎉 演示完成！"