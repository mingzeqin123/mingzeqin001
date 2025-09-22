#!/bin/bash

# ShardingSphere JDBC Demo 运行脚本

echo "=== ShardingSphere JDBC 分表演示 ==="
echo ""

# 检查Java版本
echo "检查Java版本..."
java -version
if [ $? -ne 0 ]; then
    echo "错误: 请确保已安装Java 17或更高版本"
    exit 1
fi

# 检查Maven
echo ""
echo "检查Maven..."
mvn -version
if [ $? -ne 0 ]; then
    echo "错误: 请确保已安装Maven"
    exit 1
fi

# 编译项目
echo ""
echo "编译项目..."
mvn clean compile -q
if [ $? -ne 0 ]; then
    echo "错误: 项目编译失败"
    exit 1
fi

# 运行测试
echo ""
echo "运行测试..."
mvn test -q
if [ $? -ne 0 ]; then
    echo "警告: 测试未完全通过，但可以继续运行演示"
fi

# 启动应用
echo ""
echo "启动应用..."
echo "应用将在 http://localhost:8080 启动"
echo "按 Ctrl+C 停止应用"
echo ""

# 启动Spring Boot应用
mvn spring-boot:run