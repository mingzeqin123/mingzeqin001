#!/bin/bash

# SSE测试脚本
# 用于测试Server-Sent Events功能

echo "=== Java SSE 消息处理系统测试 ==="
echo

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java环境，请先安装Java 11或更高版本"
    exit 1
fi

echo "Java版本:"
java -version
echo

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到Maven，请先安装Maven"
    exit 1
fi

echo "Maven版本:"
mvn -version
echo

# 编译项目
echo "正在编译项目..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    echo "错误: 项目编译失败"
    exit 1
fi

echo "项目编译成功！"
echo

# 启动服务器（后台运行）
echo "启动SSE服务器..."
mvn spring-boot:run > server.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "等待服务器启动..."
sleep 10

# 检查服务器是否启动成功
if ! curl -s http://localhost:8080/api/sse/clients > /dev/null; then
    echo "错误: 服务器启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "服务器启动成功！"
echo

# 测试SSE连接
echo "测试SSE连接..."
echo "在另一个终端中运行以下命令来测试SSE连接:"
echo
echo "curl -N -H \"Accept: text/event-stream\" \"http://localhost:8080/api/sse/connect?clientId=test_client&sessionId=test_session\""
echo

# 测试发送消息
echo "测试发送消息..."

# 发送广播消息
echo "发送广播消息..."
curl -X POST "http://localhost:8080/api/sse/broadcast" \
     -d "event=system.info&data=欢迎使用SSE消息处理系统！" \
     -H "Content-Type: application/x-www-form-urlencoded"

echo
echo

# 发送用户消息
echo "发送用户消息..."
curl -X POST "http://localhost:8080/api/sse/send/test_client" \
     -d "event=user.notification&data=这是一条测试消息" \
     -H "Content-Type: application/x-www-form-urlencoded"

echo
echo

# 获取客户端状态
echo "获取客户端状态..."
curl -s "http://localhost:8080/api/sse/clients" | python3 -m json.tool 2>/dev/null || curl -s "http://localhost:8080/api/sse/clients"

echo
echo

# 运行Java客户端示例
echo "运行Java客户端示例..."
echo "按 Ctrl+C 停止客户端"
echo

# 运行示例程序
mvn exec:java -Dexec.mainClass="com.example.app.sse.example.SSEExample" -q

# 清理
echo
echo "清理资源..."
kill $SERVER_PID 2>/dev/null
rm -f server.log

echo "测试完成！"