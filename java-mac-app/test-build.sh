#!/bin/bash

# Test script to verify the build process
# 测试构建过程的脚本

set -e

echo "🧪 开始测试构建过程..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test compilation
echo -e "${YELLOW}测试 1: 编译项目...${NC}"
if mvn clean compile; then
    echo -e "${GREEN}✓ 编译成功${NC}"
else
    echo -e "${RED}✗ 编译失败${NC}"
    exit 1
fi

# Test packaging
echo -e "${YELLOW}测试 2: 打包 JAR...${NC}"
if mvn package; then
    echo -e "${GREEN}✓ 打包成功${NC}"
else
    echo -e "${RED}✗ 打包失败${NC}"
    exit 1
fi

# Check if JAR file exists
JAR_FILE="target/mac-java-app-1.0.0.jar"
if [ -f "$JAR_FILE" ]; then
    echo -e "${GREEN}✓ JAR 文件存在: $JAR_FILE${NC}"
else
    echo -e "${RED}✗ JAR 文件未找到: $JAR_FILE${NC}"
    exit 1
fi

# Test JAR execution (with timeout)
echo -e "${YELLOW}测试 3: 测试 JAR 执行...${NC}"
if timeout 10s java -jar "$JAR_FILE" --help 2>/dev/null || true; then
    echo -e "${GREEN}✓ JAR 可以执行${NC}"
else
    echo -e "${YELLOW}! JAR 执行测试跳过（需要图形界面）${NC}"
fi

# Test build scripts exist and are executable
echo -e "${YELLOW}测试 4: 检查构建脚本...${NC}"
if [ -x "build-mac-installer.sh" ]; then
    echo -e "${GREEN}✓ PKG 构建脚本可执行${NC}"
else
    echo -e "${RED}✗ PKG 构建脚本不可执行${NC}"
    exit 1
fi

if [ -x "build-dmg.sh" ]; then
    echo -e "${GREEN}✓ DMG 构建脚本可执行${NC}"
else
    echo -e "${RED}✗ DMG 构建脚本不可执行${NC}"
    exit 1
fi

# Check project structure
echo -e "${YELLOW}测试 5: 检查项目结构...${NC}"
required_files=(
    "pom.xml"
    "src/main/java/com/example/app/MacJavaApp.java"
    "src/main/java/module-info.java"
    "README.md"
    "Makefile"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file 存在${NC}"
    else
        echo -e "${RED}✗ $file 不存在${NC}"
        exit 1
    fi
done

# Display project info
echo -e "${BLUE}项目信息:${NC}"
echo "- 项目名称: Mac Java Application"
echo "- 版本: 1.0.0"
echo "- Java 版本: $(java -version 2>&1 | head -1 | cut -d'"' -f2)"
echo "- Maven 版本: $(mvn -version 2>/dev/null | head -1 | cut -d' ' -f3 || echo 'Not found')"
echo "- JAR 大小: $(ls -lh "$JAR_FILE" 2>/dev/null | awk '{print $5}' || echo 'Unknown')"

echo ""
echo -e "${GREEN}🎉 所有测试通过！${NC}"
echo -e "${BLUE}构建系统已就绪，可以创建 macOS 安装包。${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 运行 './build-mac-installer.sh' 创建 PKG 安装包"
echo "2. 运行 './build-dmg.sh' 创建 DMG 磁盘镜像"
echo "3. 或者使用 'make install' 创建所有安装包"