#!/bin/bash

# 简化的编译脚本（不使用Maven）

echo "=== 编译Java MongoDB聚合项目 ==="

# 创建必要的目录
mkdir -p target/classes
mkdir -p lib
mkdir -p logs

# 设置classpath
CLASSPATH="lib/*:target/classes"

echo "正在编译Java源码..."

# 编译所有Java文件
find src/main/java -name "*.java" > sources.txt

if javac -cp "$CLASSPATH" -d target/classes @sources.txt; then
    echo "编译成功！"
    rm sources.txt
    
    # 创建运行脚本
    cat > run-simple.sh << 'EOF'
#!/bin/bash
echo "=== 运行MongoDB聚合演示 ==="
echo "注意：此版本需要手动下载MongoDB驱动JAR包到lib目录"
echo "或者使用Maven版本：mvn exec:java"
echo ""
echo "如果要运行此程序，请："
echo "1. 下载MongoDB Java Driver JAR包到lib目录"
echo "2. 下载Jackson JAR包到lib目录"  
echo "3. 下载SLF4J和Logback JAR包到lib目录"
echo "4. 启动MongoDB服务"
echo "5. 运行: java -cp \"lib/*:target/classes\" com.example.mongodb.MongoAggregationApp"
EOF
    
    chmod +x run-simple.sh
    
    echo ""
    echo "编译完成！使用说明："
    echo "1. 如果系统有Maven，运行: ./run.sh"
    echo "2. 如果没有Maven，需要手动下载依赖JAR包后运行: ./run-simple.sh"
    
else
    echo "编译失败！"
    rm sources.txt
    exit 1
fi