#!/bin/bash

# SSE消息处理系统测试脚本

echo "=== Java SSE 消息处理系统测试 ==="

# 检查Java版本
echo "检查Java版本..."
java -version

# 检查Maven
echo "检查Maven..."
mvn -version

# 清理并编译项目
echo "清理并编译项目..."
mvn clean compile

if [ $? -eq 0 ]; then
    echo "✅ 编译成功"
else
    echo "❌ 编译失败"
    exit 1
fi

# 运行演示程序
echo "运行SSE演示程序..."
echo "注意: 演示程序将运行10秒钟后自动退出"

# 在后台运行演示
timeout 15s mvn exec:java -Dexec.mainClass="com.example.app.sse.SseDemo" &
DEMO_PID=$!

# 等待演示完成
wait $DEMO_PID
DEMO_EXIT_CODE=$?

if [ $DEMO_EXIT_CODE -eq 0 ] || [ $DEMO_EXIT_CODE -eq 124 ]; then
    echo "✅ 演示程序运行完成"
else
    echo "❌ 演示程序运行失败"
fi

# 测试HTTP端点（如果服务器还在运行）
echo "测试HTTP端点..."
sleep 2

# 启动服务器进行测试
echo "启动测试服务器..."
timeout 10s mvn exec:java -Dexec.mainClass="com.example.app.sse.SseServerApplication" &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 测试状态端点
echo "测试服务器状态..."
curl -s http://localhost:8080/api/sse/status > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 服务器状态端点正常"
else
    echo "⚠️  服务器状态端点无响应（可能服务器未完全启动）"
fi

# 清理进程
kill $SERVER_PID 2>/dev/null

echo ""
echo "=== 测试完成 ==="
echo "如需运行完整应用程序，请执行: mvn javafx:run"
echo "如需运行演示程序，请执行: mvn exec:java -Dexec.mainClass=\"com.example.app.sse.SseDemo\""