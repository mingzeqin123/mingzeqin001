#!/bin/bash
# 演示脚本 - 展示程序监控器的使用

echo "=== 程序监控器演示 ==="
echo

# 创建示例配置文件
echo "1. 创建示例配置文件..."
python3 process_monitor.py --create-config
echo "配置文件已创建: process_monitor_config.json"
echo

# 显示配置文件内容
echo "2. 配置文件内容:"
cat process_monitor_config.json
echo
echo

# 演示1: 监控测试程序
echo "3. 演示1: 监控测试程序（会随机崩溃）"
echo "运行命令: python3 process_monitor.py -p python3 -a test_program.py -i 2 -d 1 -m 3"
echo "按 Ctrl+C 停止演示"
echo "---"
python3 process_monitor.py -p python3 -a test_program.py -i 2 -d 1 -m 3
echo "---"
echo

# 演示2: 使用配置文件
echo "4. 演示2: 使用配置文件监控"
echo "修改配置文件中的程序路径为测试程序..."
cat > demo_config.json << EOF
{
  "program": "python3",
  "args": ["test_program.py"],
  "working_dir": ".",
  "env": {},
  "check_interval": 3,
  "restart_delay": 2,
  "max_restarts": 5,
  "log_file": "demo_monitor.log",
  "log_level": "INFO"
}
EOF

echo "配置文件内容:"
cat demo_config.json
echo
echo "运行命令: python3 process_monitor.py -c demo_config.json"
echo "按 Ctrl+C 停止演示"
echo "---"
python3 process_monitor.py -c demo_config.json
echo "---"
echo

echo "演示完成！"
echo "查看日志文件: demo_monitor.log"