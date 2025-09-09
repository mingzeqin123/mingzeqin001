#!/bin/bash

# 简单构建脚本 - 不依赖Maven
# 直接使用javac编译Java文件

set -e

echo "开始简单构建Java应用程序..."

# 创建输出目录
mkdir -p target/classes
mkdir -p target

# 编译Java源代码
echo "编译Java源代码..."
javac -d target/classes -cp target/classes src/main/java/com/example/MainApp.java

# 创建MANIFEST.MF文件
echo "创建MANIFEST.MF..."
mkdir -p target/META-INF
cat > target/META-INF/MANIFEST.MF << EOF
Manifest-Version: 1.0
Main-Class: com.example.MainApp
Created-By: Simple Build Script

EOF

# 创建JAR文件
echo "创建JAR文件..."
cd target/classes
jar cfm ../mac-installer-app.jar ../META-INF/MANIFEST.MF com/example/MainApp.class
cd ../..

# 验证JAR文件
if [ -f "target/mac-installer-app.jar" ]; then
    echo "JAR文件创建成功: target/mac-installer-app.jar"
    echo "文件大小: $(ls -lh target/mac-installer-app.jar | awk '{print $5}')"
    
    # 测试运行
    echo "测试运行应用程序..."
    echo "注意: 如果这是无头环境，GUI应用程序可能无法显示"
    timeout 5s java -jar target/mac-installer-app.jar || echo "应用程序启动测试完成"
    
else
    echo "错误: JAR文件创建失败"
    exit 1
fi

echo "构建完成！"
echo ""
echo "使用方法:"
echo "1. 直接运行: java -jar target/mac-installer-app.jar"
echo "2. 在Mac上安装: ./install.sh"
echo "3. 创建DMG: ./build-mac-installer.sh"