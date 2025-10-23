# Nginx IP Monitor

一个自动监控服务器公网IP变化并更新nginx配置的Python工具。

## 功能特性

- 🔍 **自动IP检测**: 使用多个可靠的IP检测服务
- 🔄 **自动配置更新**: IP变化时自动更新nginx配置
- 🔧 **配置模板**: 支持自定义nginx配置模板
- 🛡️ **安全可靠**: 配置测试、备份、回滚机制
- 📊 **详细日志**: 完整的操作日志记录
- ⚙️ **系统服务**: 支持systemd服务管理
- 📧 **通知支持**: 可配置邮件通知（可选）

## 系统要求

- Linux系统（推荐Ubuntu/CentOS）
- Python 3.6+
- nginx
- root权限

## 快速安装

1. 下载项目文件到服务器
2. 运行安装脚本：

```bash
sudo ./install.sh
```

安装脚本会自动：
- 检查系统要求
- 安装Python依赖
- 创建必要的目录
- 安装配置文件
- 配置systemd服务
- 创建初始nginx配置

## 手动安装

### 1. 安装依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip nginx

# CentOS/RHEL
sudo yum install python3 python3-pip nginx
```

### 2. 安装Python包

```bash
pip3 install requests
```

### 3. 创建目录

```bash
sudo mkdir -p /etc/nginx-ip-monitor
sudo mkdir -p /var/log
```

### 4. 复制文件

```bash
sudo cp nginx_ip_monitor.py /usr/local/bin/nginx-ip-monitor.py
sudo chmod +x /usr/local/bin/nginx-ip-monitor.py

sudo cp config.json /etc/nginx-ip-monitor/config.json
sudo cp nginx.conf.template /etc/nginx-ip-monitor/nginx.conf.template
sudo cp nginx-ip-monitor.service /etc/systemd/system/nginx-ip-monitor.service
```

### 5. 配置systemd服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable nginx-ip-monitor.service
```

## 使用方法

### 启动服务

```bash
sudo systemctl start nginx-ip-monitor
```

### 查看服务状态

```bash
sudo systemctl status nginx-ip-monitor
```

### 查看日志

```bash
# 实时日志
sudo journalctl -u nginx-ip-monitor -f

# 查看日志文件
sudo tail -f /var/log/nginx-ip-monitor.log
```

### 手动执行检查

```bash
# 执行一次检查
sudo python3 /usr/local/bin/nginx-ip-monitor.py --once

# 以守护进程模式运行
sudo python3 /usr/local/bin/nginx-ip-monitor.py --daemon
```

## 配置说明

配置文件位置：`/etc/nginx-ip-monitor/config.json`

```json
{
    "nginx_config_template": "/etc/nginx-ip-monitor/nginx.conf.template",
    "nginx_config_path": "/etc/nginx/nginx.conf",
    "nginx_config_backup": "/etc/nginx-ip-monitor/nginx.conf.backup",
    "check_interval": 60,
    "ip_check_services": [
        "https://api.ipify.org",
        "https://ipv4.icanhazip.com",
        "https://checkip.amazonaws.com"
    ],
    "log_file": "/var/log/nginx-ip-monitor.log",
    "log_level": "INFO",
    "restart_nginx_on_change": true,
    "test_nginx_config": true,
    "email_notifications": {
        "enabled": false,
        "smtp_server": "",
        "smtp_port": 587,
        "username": "",
        "password": "",
        "to_addresses": []
    }
}
```

### 配置参数说明

- `nginx_config_template`: nginx配置模板文件路径
- `nginx_config_path`: 实际nginx配置文件路径
- `nginx_config_backup`: nginx配置备份路径
- `check_interval`: IP检查间隔（秒）
- `ip_check_services`: IP检测服务列表
- `log_file`: 日志文件路径
- `log_level`: 日志级别（DEBUG/INFO/WARNING/ERROR）
- `restart_nginx_on_change`: IP变化时是否重启nginx
- `test_nginx_config`: 更新配置前是否测试配置
- `email_notifications`: 邮件通知配置

## nginx配置模板

nginx配置模板文件：`/etc/nginx-ip-monitor/nginx.conf.template`

模板中使用 `{{SERVER_IP}}` 占位符，脚本会自动替换为当前IP。

### 自定义模板

1. 编辑模板文件：
```bash
sudo nano /etc/nginx-ip-monitor/nginx.conf.template
```

2. 在需要IP地址的地方使用 `{{SERVER_IP}}` 占位符

3. 重启服务：
```bash
sudo systemctl restart nginx-ip-monitor
```

## 故障排除

### 1. 服务无法启动

检查日志：
```bash
sudo journalctl -u nginx-ip-monitor -n 50
```

常见问题：
- 配置文件语法错误
- 权限不足
- Python依赖缺失

### 2. nginx配置更新失败

检查nginx配置：
```bash
sudo nginx -t
```

查看备份配置：
```bash
sudo cat /etc/nginx-ip-monitor/nginx.conf.backup
```

### 3. IP检测失败

检查网络连接：
```bash
curl https://api.ipify.org
```

检查防火墙设置，确保可以访问外部IP检测服务。

### 4. 权限问题

确保脚本有足够权限：
```bash
sudo chown root:root /usr/local/bin/nginx-ip-monitor.py
sudo chmod +x /usr/local/bin/nginx-ip-monitor.py
```

## 安全注意事项

1. **最小权限原则**: 脚本需要root权限来修改nginx配置
2. **配置备份**: 每次更新前都会备份原配置
3. **配置测试**: 更新前会测试nginx配置语法
4. **日志记录**: 所有操作都有详细日志

## 卸载

```bash
# 停止并禁用服务
sudo systemctl stop nginx-ip-monitor
sudo systemctl disable nginx-ip-monitor

# 删除文件
sudo rm -f /usr/local/bin/nginx-ip-monitor.py
sudo rm -f /etc/systemd/system/nginx-ip-monitor.service
sudo rm -rf /etc/nginx-ip-monitor

# 重新加载systemd
sudo systemctl daemon-reload
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 初始版本
- 支持IP监控和nginx配置自动更新
- 支持systemd服务管理
- 支持配置模板和备份