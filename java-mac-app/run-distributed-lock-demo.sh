#!/bin/bash

# Java + Redis 分布式锁演示应用启动脚本

echo "======================================="
echo "Java + Redis 分布式锁演示应用"
echo "======================================="

# 检查Java是否安装
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java，请先安装Java 21或更高版本"
    exit 1
fi

# 检查Maven是否安装
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到Maven，请先安装Maven"
    exit 1
fi

# 检查Redis是否运行
echo "检查Redis连接..."
if command -v redis-cli &> /dev/null; then
    if ! redis-cli ping > /dev/null 2>&1; then
        echo "警告: Redis服务似乎未运行或无法连接"
        echo "请确保Redis服务已启动（默认: localhost:6379）"
        echo ""
        echo "启动Redis的常见方法："
        echo "1. 使用Docker: docker run -d --name redis -p 6379:6379 redis:latest"
        echo "2. 本地安装: redis-server"
        echo ""
        read -p "是否继续启动应用？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "应用启动已取消"
            exit 1
        fi
    else
        echo "✓ Redis连接正常"
    fi
else
    echo "提示: 未找到redis-cli，无法检查Redis连接状态"
    echo "请确保Redis服务已启动（默认: localhost:6379）"
fi

echo ""
echo "开始编译应用..."

# 编译项目
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "错误: 编译失败"
    exit 1
fi

echo ""
echo "启动分布式锁演示应用..."
echo "======================================="

# 运行应用
java -jar target/mac-java-app-1.0.0.jar

echo ""
echo "应用已停止"