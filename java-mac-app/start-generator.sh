#!/bin/bash

# MyBatis Plus 代码生成器启动脚本
# Author: MyBatis Plus Generator
# Date: 2024-01-15

echo "🚀 启动 MyBatis Plus 代码生成器..."
echo "=================================================="

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java环境，请先安装JDK 21+"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "❌ 错误: 未找到Maven环境，请先安装Maven 3.6+"
    exit 1
fi

# 显示Java版本
echo "☕ Java版本信息:"
java -version
echo ""

# 显示Maven版本
echo "📦 Maven版本信息:"
mvn -version
echo ""

# 检查数据库连接（可选）
echo "🔍 检查项目配置..."

# 编译项目
echo "🔨 编译项目..."
mvn clean compile

if [ $? -ne 0 ]; then
    echo "❌ 项目编译失败，请检查错误信息"
    exit 1
fi

echo "✅ 项目编译成功"
echo ""

# 启动应用
echo "🎯 启动应用..."
echo "=================================================="
echo "📱 Web界面: http://localhost:8080"
echo "📖 API文档: http://localhost:8080/swagger-ui.html"
echo "📊 数据库监控: http://localhost:8080/druid/index.html"
echo "🔍 健康检查: http://localhost:8080/api/generator/health"
echo "=================================================="
echo ""

# 使用Spring Boot Maven插件启动
mvn spring-boot:run

# 或者使用java -jar方式启动（需要先打包）
# mvn clean package -DskipTests
# java -jar target/mac-java-app-1.0.0.jar