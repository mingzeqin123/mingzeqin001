#!/bin/bash

# Java MongoDB聚合项目快速开始脚本

echo "🚀 Java MongoDB聚合功能演示项目"
echo "======================================="
echo ""

# 检查当前目录
if [ ! -f "pom.xml" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 快速开始选项:"
echo "1. 完整体验 (推荐新用户)"
echo "2. 仅启动MongoDB"
echo "3. 仅运行Java程序"
echo "4. 查看项目信息"
echo "0. 退出"
echo ""

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🎯 选择: 完整体验模式"
        echo "将依次执行: MongoDB设置 → 项目编译 → 程序运行"
        echo ""
        
        # 启动MongoDB
        echo "📦 步骤1: 设置MongoDB环境"
        if command -v docker &> /dev/null; then
            echo "使用Docker启动MongoDB..."
            ./docker-setup.sh
            if [ $? -ne 0 ]; then
                echo "❌ MongoDB启动失败，请检查Docker环境"
                exit 1
            fi
        else
            echo "⚠️  未检测到Docker，请确保MongoDB服务运行在localhost:27017"
            read -p "MongoDB是否已运行? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "请先启动MongoDB服务，然后重新运行此脚本"
                exit 1
            fi
        fi
        
        echo ""
        echo "☕ 步骤2: 编译和运行项目"
        if command -v mvn &> /dev/null; then
            echo "使用Maven运行项目..."
            ./run.sh
        else
            echo "❌ 未找到Maven，请安装Maven或使用Docker方式运行"
            echo ""
            echo "💡 安装Maven方式:"
            echo "  Ubuntu/Debian: sudo apt-get install maven"
            echo "  MacOS: brew install maven"
            echo "  或下载: https://maven.apache.org/download.cgi"
            echo ""
            echo "🐳 Docker方式运行:"
            echo "  docker run -it --rm --network host -v \"\$(pwd)\":/workspace -w /workspace maven:3.8-openjdk-11 mvn exec:java -Dexec.mainClass=\"com.example.mongodb.MongoAggregationApp\""
        fi
        ;;
        
    2)
        echo ""
        echo "🎯 选择: 仅启动MongoDB"
        if command -v docker &> /dev/null; then
            ./docker-setup.sh
        else
            echo "❌ 未找到Docker"
            echo "请手动启动MongoDB: mongod"
        fi
        ;;
        
    3)
        echo ""
        echo "🎯 选择: 仅运行Java程序"
        if [ ! command -v mvn &> /dev/null ]; then
            echo "❌ 未找到Maven"
            exit 1
        fi
        
        echo "⚠️  请确保MongoDB运行在localhost:27017"
        read -p "继续运行? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./run.sh
        fi
        ;;
        
    4)
        echo ""
        echo "📊 项目信息"
        echo "============"
        echo "项目名称: Java MongoDB聚合功能演示"
        echo "技术栈: Java 11+ | MongoDB | Maven"
        echo "功能: 9种MongoDB聚合操作演示"
        echo ""
        echo "📁 项目结构:"
        echo "├── src/main/java/com/example/mongodb/"
        echo "│   ├── MongoAggregationApp.java      # 主程序"
        echo "│   ├── model/                        # 数据模型"
        echo "│   ├── service/                      # 业务服务"
        echo "│   └── util/                         # 工具类"
        echo "├── README.md                         # 项目说明"
        echo "├── USAGE_GUIDE.md                    # 详细使用指南"
        echo "└── PROJECT_SUMMARY.md                # 项目总结"
        echo ""
        echo "🚀 快速运行:"
        echo "  ./quick-start.sh  # 运行此脚本"
        echo "  ./run.sh          # 直接运行项目"
        echo ""
        echo "📖 查看详细文档:"
        echo "  cat README.md"
        echo "  cat USAGE_GUIDE.md"
        ;;
        
    0)
        echo "👋 再见!"
        exit 0
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✅ 操作完成!"
echo ""
echo "📚 更多信息:"
echo "  README.md        - 项目概述"
echo "  USAGE_GUIDE.md   - 详细使用指南"
echo "  PROJECT_SUMMARY.md - 项目技术总结"