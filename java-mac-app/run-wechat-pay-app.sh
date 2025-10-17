#!/bin/bash

# 微信支付Java应用程序启动脚本
# WeChat Pay Java Application Startup Script

echo "=========================================="
echo "  微信支付Java应用程序"
echo "  WeChat Pay Java Application"
echo "=========================================="

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java环境，请先安装Java 21+"
    echo "❌ Error: Java not found, please install Java 21+"
    exit 1
fi

# 检查Java版本
JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 21 ]; then
    echo "❌ 错误: 需要Java 21+，当前版本: $JAVA_VERSION"
    echo "❌ Error: Java 21+ required, current version: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java环境检查通过"
echo "✅ Java environment check passed"

# 检查JAR文件
JAR_FILE="target/mac-java-app-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "❌ 错误: 未找到应用程序文件 $JAR_FILE"
    echo "❌ Error: Application file not found: $JAR_FILE"
    echo "请先运行: mvn clean package"
    echo "Please run: mvn clean package"
    exit 1
fi

echo "✅ 应用程序文件检查通过"
echo "✅ Application file check passed"

# 设置JavaFX模块路径（如果需要）
JVM_ARGS=""

# 检查是否在Linux环境下运行
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 检测到Linux环境，设置显示参数"
    echo "🐧 Linux environment detected, setting display parameters"
    
    # 检查DISPLAY环境变量
    if [ -z "$DISPLAY" ]; then
        echo "⚠️  警告: 未设置DISPLAY环境变量，可能无法显示GUI"
        echo "⚠️  Warning: DISPLAY environment variable not set, GUI may not work"
        export DISPLAY=:0
    fi
    
    # 添加Linux特定的JVM参数
    JVM_ARGS="$JVM_ARGS -Djava.awt.headless=false"
fi

echo ""
echo "🚀 启动微信支付应用程序..."
echo "🚀 Starting WeChat Pay Application..."
echo ""

# 运行应用程序
java $JVM_ARGS -jar "$JAR_FILE" "$@"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 应用程序正常退出"
    echo "✅ Application exited normally"
else
    echo "❌ 应用程序异常退出，退出代码: $EXIT_CODE"
    echo "❌ Application exited with error code: $EXIT_CODE"
fi

exit $EXIT_CODE