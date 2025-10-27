#!/bin/bash

# MyBatis Plus 代码生成器运行脚本

echo "=== MyBatis Plus 代码生成器 ==="
echo ""

# 检查是否在正确的目录
if [ ! -f "java-mac-app/pom.xml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 进入 Java 项目目录
cd java-mac-app

# 检查 Maven 是否安装
if ! command -v mvn &> /dev/null; then
    echo "❌ 错误：Maven 未安装，请先安装 Maven"
    exit 1
fi

# 编译项目
echo "📦 编译项目..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✅ 编译成功"
echo ""

# 显示菜单
echo "请选择要运行的功能："
echo "1. 启动代码生成器主界面"
echo "2. 基础代码生成器"
echo "3. 高级代码生成器"
echo "4. 配置文件生成器"
echo "5. 示例数据生成器"
echo "6. 使用示例"
echo ""

read -p "请输入选择 (1-6): " choice

case $choice in
    1)
        echo "🚀 启动代码生成器主界面..."
        mvn exec:java -Dexec.mainClass="com.example.app.generator.CodeGeneratorLauncher" -q
        ;;
    2)
        echo "🚀 启动基础代码生成器..."
        mvn exec:java -Dexec.mainClass="com.example.app.generator.MyBatisPlusCodeGenerator" -q
        ;;
    3)
        echo "🚀 启动高级代码生成器..."
        mvn exec:java -Dexec.mainClass="com.example.app.generator.AdvancedCodeGenerator" -q
        ;;
    4)
        echo "🚀 启动配置文件生成器..."
        mvn exec:java -Dexec.mainClass="com.example.app.generator.ConfigGenerator" -q
        ;;
    5)
        echo "🚀 启动示例数据生成器..."
        mvn exec:java -Dexec.mainClass="com.example.app.generator.SampleDataGenerator" -q
        ;;
    6)
        echo "🚀 运行使用示例..."
        mvn exec:java -Dexec.mainClass="com.example.app.generator.ExampleUsage" -q
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✅ 执行完成！"