#!/bin/bash
# 服务器监控系统启动脚本

echo "=========================================="
echo "服务器监控系统启动脚本"
echo "=========================================="

# 检查Python版本
python_version=$(python3 --version 2>&1)
echo "Python版本: $python_version"

# 检查依赖包
echo "检查依赖包..."
python3 -c "import psutil, flask, schedule" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "安装依赖包..."
    pip3 install -r requirements.txt
fi

# 创建必要目录
mkdir -p data logs

# 选择运行模式
echo ""
echo "请选择运行模式:"
echo "1) 启动完整监控系统 (数据采集 + 大屏展示)"
echo "2) 仅启动大屏展示"
echo "3) 仅启动数据采集"
echo "4) 运行测试"
echo "5) 退出"

read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "启动完整监控系统..."
        python3 start_monitoring.py
        ;;
    2)
        echo "启动大屏展示..."
        python3 dashboard.py
        ;;
    3)
        echo "启动数据采集..."
        python3 collector.py
        ;;
    4)
        echo "运行测试..."
        python3 test_monitoring.py
        ;;
    5)
        echo "退出"
        exit 0
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac