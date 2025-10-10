#!/bin/bash

# Spring Boot i18n 演示脚本
# 此脚本演示如何使用 Spring Boot i18n 功能

echo "=== Spring Boot i18n 演示 ==="
echo ""

# 检查 Java 版本
echo "1. 检查 Java 环境:"
java -version
echo ""

# 检查 Maven 版本
echo "2. 检查 Maven 环境:"
mvn -version
echo ""

# 显示项目结构
echo "3. 项目结构:"
echo "src/main/resources/messages/"
ls -la src/main/resources/messages/
echo ""

# 显示消息文件内容示例
echo "4. 消息文件内容示例:"
echo "--- 英文消息 (messages.properties) ---"
head -5 src/main/resources/messages/messages.properties
echo ""
echo "--- 中文消息 (messages_zh_CN.properties) ---"
head -5 src/main/resources/messages/messages_zh_CN.properties
echo ""

# 显示配置示例
echo "5. Spring Boot 配置示例:"
echo "--- application.properties ---"
grep -A 5 "i18n" src/main/resources/application.properties
echo ""

# 显示 API 端点
echo "6. 可用的 API 端点:"
echo "GET /api/i18n/messages?lang=en          - 获取英文消息"
echo "GET /api/i18n/messages?lang=zh_CN       - 获取中文消息"
echo "GET /api/i18n/message/{key}?lang=en     - 获取特定消息"
echo "GET /api/i18n/system-info?lang=en       - 获取系统信息"
echo "GET /api/i18n/greeting?lang=en          - 获取问候消息"
echo "GET /api/i18n/startup?lang=en           - 获取启动消息"
echo ""

# 显示启动命令
echo "7. 启动应用程序:"
echo "mvn spring-boot:run"
echo ""
echo "然后访问: http://localhost:8080"
echo ""

# 显示测试命令
echo "8. 运行测试:"
echo "mvn test"
echo ""

echo "=== 演示完成 ==="