#!/bin/bash

# MongoDB聚合演示项目启动脚本

echo "=== MongoDB聚合功能演示项目 ==="
echo "正在检查环境..."

# 检查Java版本
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java，请安装Java 11或更高版本"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    echo "错误: Java版本过低，需要Java 11或更高版本"
    exit 1
fi

echo "Java版本检查通过"

# 检查Maven
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到Maven，请安装Maven 3.6或更高版本"
    exit 1
fi

echo "Maven检查通过"

# 检查MongoDB连接
echo "检查MongoDB连接..."
if ! timeout 5 bash -c "</dev/tcp/localhost/27017" 2>/dev/null; then
    echo "警告: 无法连接到MongoDB (localhost:27017)"
    echo "请确保MongoDB服务正在运行："
    echo "  1. 启动MongoDB: mongod"
    echo "  2. 或使用Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
    read -p "是否继续运行程序？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "MongoDB连接检查通过"
fi

# 创建必要的目录
mkdir -p logs

# 编译项目
echo "正在编译项目..."
if ! mvn clean compile -q; then
    echo "错误: 项目编译失败"
    exit 1
fi

echo "编译完成"

# 运行项目
echo "启动程序..."
echo ""

# 检查是否传入了demo参数
if [ "$1" = "demo" ]; then
    echo "运行演示模式..."
    mvn exec:java -Dexec.mainClass="com.example.mongodb.MongoAggregationApp" -Dexec.args="demo" -q
else
    mvn exec:java -Dexec.mainClass="com.example.mongodb.MongoAggregationApp" -q
fi