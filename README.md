# 程序监控和自动重启脚本

这是一个用Python编写的程序监控脚本，可以监控指定程序的运行状态，如果程序崩溃则自动重启。

## 功能特性

- 🔍 **进程监控**: 实时监控指定程序的运行状态
- 🔄 **自动重启**: 程序崩溃时自动重启
- 📝 **日志记录**: 详细记录监控和重启事件
- ⚙️ **灵活配置**: 支持配置文件或命令行参数
- 🛡️ **信号处理**: 优雅处理系统信号，安全退出
- 🔢 **重启限制**: 可设置最大重启次数，防止无限重启

## 安装要求

- Python 3.6+
- 无需额外依赖包

## 使用方法

### 1. 基本使用

```bash
# 直接指定程序路径
python3 process_monitor.py -p /usr/bin/python3 -a "-c" "import time; time.sleep(10)"

# 指定程序参数
python3 process_monitor.py -p /path/to/your/program -a "arg1" "arg2"

# 设置检查间隔和重启延迟
python3 process_monitor.py -p /path/to/your/program -i 5 -d 3
```

### 2. 使用配置文件

```bash
# 创建示例配置文件
python3 process_monitor.py --create-config

# 使用配置文件
python3 process_monitor.py -c process_monitor_config.json
```

### 3. 配置文件格式

```json
{
  "program": "/usr/bin/python3",
  "args": ["-c", "import time; time.sleep(10)"],
  "working_dir": ".",
  "env": {
    "PYTHONPATH": "/path/to/your/project"
  },
  "check_interval": 10,
  "restart_delay": 5,
  "max_restarts": 10,
  "log_file": "process_monitor.log",
  "log_level": "INFO"
}
```

## 配置参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `program` | 要监控的程序路径 | 必填 |
| `args` | 程序参数列表 | `[]` |
| `working_dir` | 工作目录 | `.` |
| `env` | 环境变量 | `{}` |
| `check_interval` | 检查间隔（秒） | `10` |
| `restart_delay` | 重启延迟（秒） | `5` |
| `max_restarts` | 最大重启次数 | `10` |
| `log_file` | 日志文件路径 | `process_monitor.log` |
| `log_level` | 日志级别 | `INFO` |

## 命令行参数

```bash
python3 process_monitor.py [选项]

选项:
  -h, --help            显示帮助信息
  -c, --config CONFIG   配置文件路径
  -p, --program PROGRAM 要监控的程序路径
  -a, --args ARGS       程序参数（可多个）
  -i, --interval INTERVAL 检查间隔（秒）
  -d, --delay DELAY     重启延迟（秒）
  -m, --max-restarts MAX 最大重启次数
  --create-config       创建示例配置文件
```

## 使用示例

### 示例1: 监控Python脚本

```bash
# 监控一个Python脚本
python3 process_monitor.py -p /usr/bin/python3 -a "my_script.py" -i 5 -d 3
```

### 示例2: 监控Web服务器

```bash
# 监控Nginx
python3 process_monitor.py -p /usr/sbin/nginx -i 10 -d 5 -m 5
```

### 示例3: 使用配置文件监控自定义程序

1. 创建配置文件 `my_app_config.json`:
```json
{
  "program": "/path/to/my/app",
  "args": ["--config", "config.ini"],
  "working_dir": "/opt/myapp",
  "env": {
    "APP_ENV": "production"
  },
  "check_interval": 15,
  "restart_delay": 10,
  "max_restarts": 5,
  "log_file": "/var/log/myapp_monitor.log",
  "log_level": "INFO"
}
```

2. 运行监控器:
```bash
python3 process_monitor.py -c my_app_config.json
```

## 日志记录

脚本会记录以下信息：
- 程序启动和停止
- 程序崩溃检测
- 自动重启事件
- 错误和警告信息
- 监控器状态变化

日志同时输出到控制台和文件（如果指定了日志文件）。

## 信号处理

脚本支持以下信号：
- `SIGINT` (Ctrl+C): 优雅停止监控器
- `SIGTERM`: 优雅停止监控器

收到信号后，监控器会：
1. 停止监控循环
2. 终止被监控的程序
3. 等待程序正常退出（最多5秒）
4. 如果程序未正常退出，强制终止

## 注意事项

1. **权限**: 确保脚本有权限启动和监控目标程序
2. **路径**: 使用绝对路径避免路径问题
3. **资源**: 监控器本身会消耗少量系统资源
4. **日志**: 定期清理日志文件避免占用过多磁盘空间
5. **重启限制**: 设置合理的最大重启次数，避免无限重启循环

## 故障排除

### 常见问题

1. **程序无法启动**
   - 检查程序路径是否正确
   - 检查程序是否有执行权限
   - 检查工作目录是否存在

2. **监控器无法停止**
   - 使用 `kill -9` 强制终止
   - 检查是否有其他进程占用

3. **日志文件权限问题**
   - 确保脚本有写入权限
   - 检查日志文件路径是否正确

## 许可证

MIT License