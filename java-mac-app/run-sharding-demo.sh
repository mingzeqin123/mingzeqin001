#!/bin/bash

echo "=========================================="
echo "Sharding JDBC 分表演示启动脚本"
echo "=========================================="

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java环境，请先安装Java 21"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到Maven环境，请先安装Maven"
    exit 1
fi

echo "环境检查通过..."

# 编译项目
echo "正在编译项目..."
mvn clean compile

if [ $? -ne 0 ]; then
    echo "编译失败，请检查代码"
    exit 1
fi

echo "编译成功！"

# 启动应用
echo "正在启动Sharding JDBC演示应用..."
echo "应用将在 http://localhost:8080 启动"
echo "API文档: http://localhost:8080/api/sharding/"
echo ""
echo "按 Ctrl+C 停止应用"
echo "=========================================="

mvn spring-boot:run