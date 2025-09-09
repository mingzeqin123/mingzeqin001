#!/bin/bash

# Development launcher script
# 开发环境启动脚本

set -e

echo "🚀 开发模式启动..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Java is available
if ! command -v java &> /dev/null; then
    echo -e "${RED}错误: 未找到 Java。请安装 Java 11 或更高版本。${NC}"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    echo -e "${RED}错误: 需要 Java 11 或更高版本，当前版本: $JAVA_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Java 版本: $JAVA_VERSION${NC}"

# Check if Maven is available
if command -v mvn &> /dev/null; then
    MVN_CMD="mvn"
elif [ -f "./mvnw" ]; then
    MVN_CMD="./mvnw"
else
    echo -e "${RED}错误: 未找到 Maven 或 Maven Wrapper${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 使用 Maven: $MVN_CMD${NC}"

# Compile and run in development mode
echo -e "${YELLOW}📝 编译项目...${NC}"
$MVN_CMD clean compile

echo -e "${YELLOW}📦 打包项目...${NC}"
$MVN_CMD package -q

# Check if JAR exists
JAR_FILE="target/mac-java-app-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}错误: JAR 文件未找到: $JAR_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ JAR 文件创建成功${NC}"

# Run the application with development flags
echo -e "${BLUE}🚀 启动应用程序...${NC}"
echo -e "${YELLOW}提示: 按 Ctrl+C 停止应用程序${NC}"
echo ""

# Set development system properties
java -Dfile.encoding=UTF-8 \
     -Djava.util.logging.level=INFO \
     -Dapple.laf.useScreenMenuBar=true \
     -Dcom.apple.mrj.application.apple.menu.about.name="Mac Java App (Dev)" \
     -Dapple.awt.application.name="Mac Java App (Dev)" \
     -jar "$JAR_FILE"

echo ""
echo -e "${GREEN}应用程序已退出${NC}"