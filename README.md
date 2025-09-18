# 程序监控和自动重启脚本

一个功能强大的 Bash 脚本，用于监控程序运行状态并在程序崩溃时自动重启。

## 功能特性

- ✅ **自动监控**: 定期检查程序是否正常运行
- ✅ **智能重启**: 程序崩溃时自动重启
- ✅ **重启限制**: 支持设置最大重启次数，防止无限重启
- ✅ **详细日志**: 记录所有监控活动和程序状态
- ✅ **配置文件**: 支持通过配置文件管理参数
- ✅ **PID管理**: 支持PID文件管理，避免重复运行
- ✅ **优雅关闭**: 支持SIGTERM信号优雅关闭程序
- ✅ **守护进程**: 支持后台守护进程模式
- ✅ **多种检测**: 支持通过PID文件或进程名检测程序状态

## 快速开始

### 1. 基本使用

```bash
# 监控一个简单的程序
./process_monitor.sh "python3 app.py"

# 指定程序名称和检查间隔
./process_monitor.sh -n "Web Server" -i 10 "python3 app.py"

# 设置最大重启次数
./process_monitor.sh -m 5 "java -jar myapp.jar"
```

### 2. 使用配置文件

```bash
# 复制配置文件模板
cp monitor.conf.example monitor.conf

# 编辑配置文件
nano monitor.conf

# 使用配置文件运行
./process_monitor.sh -c monitor.conf
```

### 3. 后台守护进程模式

```bash
# 以守护进程模式运行
./process_monitor.sh --daemon -l /var/log/monitor.log "nginx -g 'daemon off;'"

# 检查运行状态
cat monitor.pid  # 查看监控脚本PID
tail -f /var/log/monitor.log  # 查看日志
```

## 命令行选项

| 选项 | 长选项 | 参数 | 描述 |
|------|--------|------|------|
| `-n` | `--name` | NAME | 程序名称（用于日志显示） |
| `-c` | `--config` | FILE | 配置文件路径 |
| `-i` | `--interval` | SECONDS | 检查间隔（默认: 5秒） |
| `-m` | `--max-restarts` | COUNT | 最大重启次数（默认: 10次，0为无限制） |
| `-d` | `--delay` | SECONDS | 重启延迟（默认: 2秒） |
| `-w` | `--workdir` | DIR | 工作目录（默认: 当前目录） |
| `-l` | `--log` | FILE | 日志文件路径（默认: ./monitor.log） |
| `-p` | `--pid` | FILE | PID文件路径（默认: ./monitor.pid） |
| | `--program-pid` | FILE | 程序PID文件路径 |
| `-q` | `--quiet` | | 静默模式 |
| | `--daemon` | | 后台守护进程模式 |
| `-h` | `--help` | | 显示帮助信息 |

## 配置文件格式

配置文件使用 INI 风格的格式：

```ini
# 程序基本信息
program_name=My Application
program_cmd=python3
program_args=app.py --port 8080
work_dir=/opt/myapp

# 监控参数
check_interval=10
max_restart_count=5
restart_delay=3

# 文件路径
log_file=/var/log/myapp_monitor.log
pid_file=/var/run/myapp_monitor.pid
program_pid_file=/var/run/myapp.pid
```

## 使用示例

### Python Web 应用

```bash
# 方法1: 命令行参数
./process_monitor.sh -n "Flask App" -i 10 -m 5 -w /home/user/webapp "python3 app.py"

# 方法2: 配置文件
cat > flask_monitor.conf << EOF
program_name=Flask Web Server
program_cmd=python3
program_args=app.py
work_dir=/home/user/webapp
check_interval=10
max_restart_count=5
log_file=/var/log/flask_monitor.log
EOF

./process_monitor.sh -c flask_monitor.conf
```

### Java 应用

```bash
./process_monitor.sh -n "Spring Boot" -i 15 -m 3 "java -jar -Xmx1024m myapp.jar"
```

### Node.js 应用

```bash
./process_monitor.sh -n "Node.js Server" -w /var/www/nodeapp "node server.js"
```

### Nginx（非守护进程模式）

```bash
./process_monitor.sh -n "Nginx" -i 30 -m 0 "nginx -g 'daemon off;'"
```

### 数据库服务

```bash
./process_monitor.sh -n "Redis Server" --program-pid /var/run/redis.pid "redis-server /etc/redis/redis.conf"
```

## 高级功能

### 1. PID 文件管理

脚本支持两种 PID 文件：
- **监控脚本 PID 文件**: 记录监控脚本自身的PID，防止重复运行
- **程序 PID 文件**: 如果被监控程序会创建PID文件，可以指定路径进行更精确的监控

```bash
# 指定程序PID文件
./process_monitor.sh --program-pid /var/run/myapp.pid "myapp --daemon"
```

### 2. 信号处理

监控脚本支持优雅关闭：

```bash
# 发送TERM信号停止监控
kill -TERM $(cat monitor.pid)

# 或使用INT信号（Ctrl+C）
kill -INT $(cat monitor.pid)
```

### 3. 日志管理

日志包含详细的监控信息：

```bash
# 实时查看日志
tail -f monitor.log

# 查看错误日志
grep ERROR monitor.log

# 查看重启记录
grep "重启" monitor.log
```

### 4. 系统服务集成

可以将监控脚本集成到 systemd 服务中：

```ini
# /etc/systemd/system/myapp-monitor.service
[Unit]
Description=MyApp Monitor Service
After=network.target

[Service]
Type=simple
User=myapp
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/process_monitor.sh -c /opt/myapp/monitor.conf
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable myapp-monitor.service
sudo systemctl start myapp-monitor.service
sudo systemctl status myapp-monitor.service
```

## 故障排除

### 常见问题

1. **脚本无法启动程序**
   - 检查程序路径是否正确
   - 检查工作目录是否存在
   - 检查程序是否有执行权限

2. **程序频繁重启**
   - 增加检查间隔时间
   - 检查程序日志找出崩溃原因
   - 调整重启延迟时间

3. **监控脚本重复运行**
   - 检查PID文件是否正确清理
   - 确保之前的监控脚本已完全退出

### 调试模式

```bash
# 启用详细日志输出
./process_monitor.sh -n "Debug App" "python3 app.py" 2>&1 | tee debug.log

# 使用较短的检查间隔进行测试
./process_monitor.sh -i 1 -m 3 "python3 test_app.py"
```

## 性能考虑

- **检查间隔**: 不要设置过短的检查间隔，建议最少5秒
- **日志轮转**: 对于长期运行的服务，建议配置日志轮转
- **资源使用**: 监控脚本本身占用资源很少，但频繁重启的程序可能消耗较多资源

## 安全注意事项

- 确保监控脚本以适当的用户权限运行
- 不要在脚本中硬编码敏感信息
- 定期检查日志文件权限
- 使用配置文件时注意文件权限设置

## 许可证

本脚本采用 MIT 许可证，可自由使用和修改。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个脚本！