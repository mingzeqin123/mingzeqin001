#!/bin/bash

# Docker环境设置脚本

echo "=== MongoDB聚合演示项目 - Docker环境设置 ==="

# 检查Docker是否可用
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装或不可用"
    echo "请安装Docker后再运行此脚本"
    exit 1
fi

echo "Docker检查通过"

# 停止并删除现有的MongoDB容器（如果存在）
echo "清理现有MongoDB容器..."
docker stop mongodb-demo 2>/dev/null || true
docker rm mongodb-demo 2>/dev/null || true

# 启动MongoDB容器
echo "启动MongoDB容器..."
docker run -d \
    --name mongodb-demo \
    -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=password \
    mongo:latest

if [ $? -eq 0 ]; then
    echo "MongoDB容器启动成功！"
    echo "连接信息："
    echo "  主机: localhost"
    echo "  端口: 27017"
    echo "  用户名: admin"
    echo "  密码: password"
    echo ""
    echo "等待MongoDB启动..."
    sleep 10
    
    # 测试连接
    if docker exec mongodb-demo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "MongoDB连接测试成功！"
        echo ""
        echo "现在可以运行Java程序了："
        echo "  ./run.sh"
        echo ""
        echo "停止MongoDB容器: docker stop mongodb-demo"
        echo "重启MongoDB容器: docker start mongodb-demo"
    else
        echo "警告: MongoDB可能还未完全启动，请稍等片刻后再试"
    fi
else
    echo "错误: MongoDB容器启动失败"
    exit 1
fi