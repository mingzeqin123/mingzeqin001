# Nginx IP Monitor - 服务器IP变化自动更新工具

当服务器IP地址发生变化时，自动更新nginx配置文件并重启nginx服务的Python监控工具。

## 🚀 功能特性

- **自动IP监控**: 定期检查服务器公网IP地址变化
- **配置自动更新**: IP变化时自动更新nginx配置文件
- **安全备份**: 更新前自动备份现有配置
- **配置验证**: 更新后自动测试nginx配置语法
- **服务重启**: 配置更新后自动重启nginx服务
- **多种通知**: 支持Webhook和邮件通知
- **详细日志**: 完整的操作日志记录
- **灵活配置**: 支持自定义配置文件和模板

## 📋 系统要求

- **操作系统**: Linux (Ubuntu/Debian/CentOS等)
- **Python版本**: Python 3.6+
- **权限要求**: root权限（用于修改nginx配置和重启服务）
- **依赖服务**: nginx服务已安装

## 🔧 安装方法

### 方法一：使用安装脚本（推荐）

```bash
# 下载项目文件
git clone <项目地址>
cd <项目目录>

# 运行安装脚本
sudo ./install_nginx_monitor.sh
```

### 方法二：手动安装

```bash
# 1. 安装Python依赖
pip3 install requests
pip3 install python-daemon  # 可选，用于守护进程模式

# 2. 创建安装目录
sudo mkdir -p /opt/nginx-ip-monitor

# 3. 复制文件
sudo cp nginx_ip_monitor.py /opt/nginx-ip-monitor/
sudo cp nginx_monitor_config.json /opt/nginx-ip-monitor/
sudo cp nginx_default.template /opt/nginx-ip-monitor/

# 4. 设置权限
sudo chmod +x /opt/nginx-ip-monitor/nginx_ip_monitor.py

# 5. 创建日志目录
sudo mkdir -p /var/log
sudo touch /var/log/nginx_ip_monitor.log
```

## ⚙️ 配置说明

### 主配置文件 (`nginx_monitor_config.json`)

```json
{
  "check_interval": 300,                    // 检查间隔（秒）
  "nginx_config_path": "/etc/nginx/sites-available/default",  // nginx配置文件路径
  "nginx_config_template": "/etc/nginx/sites-available/default.template",  // 配置模板路径
  "ip_check_urls": [                        // IP检查服务URL列表
    "https://api.ipify.org",
    "https://icanhazip.com",
    "https://ifconfig.me/ip"
  ],
  "log_file": "/var/log/nginx_ip_monitor.log",  // 日志文件路径
  "log_level": "INFO",                      // 日志级别
  "backup_config": true,                    // 是否备份配置
  "test_nginx_config": true,                // 是否测试配置语法
  "restart_nginx": true,                    // 是否重启nginx
  "server_name_placeholder": "SERVER_IP",   // 模板中的IP占位符
  "notification": {                         // 通知配置
    "enabled": false,
    "webhook_url": "",
    "email": {
      "enabled": false,
      "smtp_server": "smtp.gmail.com",
      "smtp_port": 587,
      "username": "your-email@gmail.com",
      "password": "your-app-password",
      "to_email": "admin@example.com"
    }
  }
}
```

### nginx配置模板 (`nginx_default.template`)

模板文件中使用 `SERVER_IP` 作为占位符，程序会自动替换为实际IP地址：

```nginx
server {
    listen 80;
    server_name SERVER_IP www.SERVER_IP;
    
    root /var/www/html;
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

## 🚀 使用方法

### 1. 基本使用

```bash
# 测试运行（检查一次）
sudo python3 /opt/nginx-ip-monitor/nginx_ip_monitor.py --check-once

# 持续监控模式
sudo python3 /opt/nginx-ip-monitor/nginx_ip_monitor.py

# 使用自定义配置文件
sudo python3 /opt/nginx-ip-monitor/nginx_ip_monitor.py -c /path/to/config.json
```

### 2. 系统服务模式

```bash
# 启动服务
sudo systemctl start nginx-ip-monitor

# 停止服务
sudo systemctl stop nginx-ip-monitor

# 查看状态
sudo systemctl status nginx-ip-monitor

# 开机自启
sudo systemctl enable nginx-ip-monitor

# 查看日志
sudo journalctl -u nginx-ip-monitor -f
```

### 3. 守护进程模式

```bash
# 以守护进程运行（需要安装python-daemon）
sudo python3 /opt/nginx-ip-monitor/nginx_ip_monitor.py --daemon
```

## 📊 监控和日志

### 日志文件位置
- 默认日志文件: `/var/log/nginx_ip_monitor.log`
- 系统服务日志: `journalctl -u nginx-ip-monitor`

### 日志级别
- `DEBUG`: 详细调试信息
- `INFO`: 一般信息（推荐）
- `WARNING`: 警告信息
- `ERROR`: 错误信息

### 典型日志内容
```
2024-01-15 10:30:00 - nginx_ip_monitor - INFO - 开始运行nginx IP监控器
2024-01-15 10:30:00 - nginx_ip_monitor - INFO - 检查间隔: 300 秒
2024-01-15 10:30:05 - nginx_ip_monitor - INFO - 初始化当前IP: 192.168.1.100
2024-01-15 10:35:05 - nginx_ip_monitor - INFO - 检测到IP变化: 192.168.1.100 -> 192.168.1.101
2024-01-15 10:35:06 - nginx_ip_monitor - INFO - 已备份nginx配置到: /etc/nginx/sites-available/default.backup.20240115_103506
2024-01-15 10:35:06 - nginx_ip_monitor - INFO - 使用模板更新nginx配置，新IP: 192.168.1.101
2024-01-15 10:35:07 - nginx_ip_monitor - INFO - nginx配置文件语法检查通过
2024-01-15 10:35:08 - nginx_ip_monitor - INFO - nginx服务重启成功
2024-01-15 10:35:08 - nginx_ip_monitor - INFO - IP变化处理成功: 192.168.1.100 -> 192.168.1.101
```

## 🔔 通知配置

### Webhook通知
```json
{
  "notification": {
    "enabled": true,
    "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  }
}
```

### 邮件通知
```json
{
  "notification": {
    "enabled": true,
    "email": {
      "enabled": true,
      "smtp_server": "smtp.gmail.com",
      "smtp_port": 587,
      "username": "your-email@gmail.com",
      "password": "your-app-password",
      "to_email": "admin@example.com"
    }
  }
}
```

## 🛠️ 故障排除

### 常见问题

1. **权限不足**
   ```bash
   # 确保以root权限运行
   sudo python3 nginx_ip_monitor.py
   ```

2. **nginx配置文件不存在**
   ```bash
   # 检查nginx配置文件路径
   ls -la /etc/nginx/sites-available/default
   ```

3. **无法获取IP地址**
   - 检查网络连接
   - 确认IP检查服务URL可访问
   - 检查防火墙设置

4. **nginx重启失败**
   ```bash
   # 手动测试nginx配置
   sudo nginx -t
   
   # 手动重启nginx
   sudo systemctl restart nginx
   ```

### 调试模式

```bash
# 启用调试日志
# 在配置文件中设置 "log_level": "DEBUG"

# 查看详细日志
sudo tail -f /var/log/nginx_ip_monitor.log
```

## 🔒 安全注意事项

1. **权限管理**: 脚本需要root权限，请确保文件权限设置正确
2. **配置备份**: 程序会自动备份nginx配置，建议定期清理旧备份
3. **日志轮转**: 建议配置日志轮转避免日志文件过大
4. **网络安全**: IP检查请求会发送到外部服务，注意网络安全策略

## 📝 自定义扩展

### 添加新的IP检查服务
在配置文件的 `ip_check_urls` 数组中添加新的URL：

```json
{
  "ip_check_urls": [
    "https://api.ipify.org",
    "https://icanhazip.com",
    "https://ifconfig.me/ip",
    "https://your-custom-ip-service.com/ip"
  ]
}
```

### 自定义nginx配置模板
创建自己的模板文件，使用 `SERVER_IP` 作为占位符：

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name SERVER_IP;
    
    # 你的自定义配置
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📞 支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱: [your-email@example.com]

---

⭐ 如果这个项目对你有帮助，请给个星星支持一下！