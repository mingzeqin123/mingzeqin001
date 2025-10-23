# Nginx IP Monitor 文件清单

## 核心文件

### 主要脚本
- `nginx_ip_monitor.py` - 主监控脚本，负责IP检测和nginx配置更新
- `test_nginx_monitor.py` - 测试脚本，验证所有组件是否正常工作
- `example_usage.py` - 使用示例脚本，演示如何使用监控器

### 配置文件
- `config.json` - 默认配置文件，包含所有可配置参数
- `nginx.conf.template` - nginx配置模板，使用`{{SERVER_IP}}`占位符

### 系统服务
- `nginx-ip-monitor.service` - systemd服务配置文件
- `install.sh` - 自动安装脚本
- `uninstall.sh` - 自动卸载脚本

### 文档
- `README_nginx_ip_monitor.md` - 详细使用说明文档
- `FILES.md` - 本文件，项目文件清单

## 文件功能说明

### nginx_ip_monitor.py
主监控脚本，提供以下功能：
- 自动检测公网IP变化
- 更新nginx配置文件
- 测试nginx配置语法
- 重启nginx服务
- 详细的日志记录
- 支持守护进程模式

### config.json
配置文件，包含以下参数：
- `nginx_config_template`: nginx配置模板路径
- `nginx_config_path`: 实际nginx配置文件路径
- `check_interval`: IP检查间隔（秒）
- `ip_check_services`: IP检测服务列表
- `log_file`: 日志文件路径
- `restart_nginx_on_change`: 是否在IP变化时重启nginx
- `email_notifications`: 邮件通知配置

### nginx.conf.template
nginx配置模板，特点：
- 使用`{{SERVER_IP}}`占位符
- 包含完整的nginx配置结构
- 支持HTTP和HTTPS
- 包含安全头设置
- 支持静态文件缓存
- 支持API代理

### 安装和卸载脚本
- `install.sh`: 自动安装所有组件
- `uninstall.sh`: 完全卸载所有组件

## 安装后的文件结构

```
/etc/nginx-ip-monitor/
├── config.json              # 配置文件
├── nginx.conf.template      # nginx配置模板
└── nginx.conf.backup        # nginx配置备份

/usr/local/bin/
└── nginx-ip-monitor.py      # 主脚本

/etc/systemd/system/
└── nginx-ip-monitor.service # systemd服务

/var/log/
└── nginx-ip-monitor.log     # 日志文件

/tmp/
└── nginx_monitor_current_ip # 当前IP缓存
```

## 使用方法

### 快速安装
```bash
sudo ./install.sh
```

### 启动服务
```bash
sudo systemctl start nginx-ip-monitor
```

### 查看状态
```bash
sudo systemctl status nginx-ip-monitor
```

### 查看日志
```bash
sudo journalctl -u nginx-ip-monitor -f
```

### 手动执行检查
```bash
sudo python3 /usr/local/bin/nginx-ip-monitor.py --once
```

### 卸载
```bash
sudo ./uninstall.sh
```

## 测试

运行测试脚本验证安装：
```bash
python3 test_nginx_monitor.py
```

运行使用示例：
```bash
python3 example_usage.py
```

## 注意事项

1. 需要root权限运行
2. 需要安装nginx
3. 需要Python 3.6+
4. 需要requests模块
5. 确保防火墙允许访问IP检测服务