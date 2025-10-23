# 服务器监控系统

一个基于Python的服务器监控系统，可以实时采集和展示多台服务器的CPU、内存、磁盘等关键指标。

## 功能特性

- 🖥️ **实时监控**: 实时采集CPU使用率、内存使用率、磁盘使用率等指标
- 📊 **可视化大屏**: 美观的Web大屏展示，支持多台服务器同时监控
- 📈 **历史趋势**: 图表展示历史数据趋势，便于分析
- 🔄 **自动刷新**: 数据自动采集和页面自动刷新
- 📱 **响应式设计**: 支持桌面和移动设备访问
- ⚙️ **灵活配置**: 支持自定义采集间隔、阈值等参数

## 系统要求

- Python 3.7+
- 支持的操作系统: Windows, Linux, macOS

## 安装依赖

```bash
pip install -r requirements.txt
```

## 快速开始

### 1. 单服务器监控

```bash
# 启动完整监控系统（数据采集 + 大屏展示）
python start_monitoring.py

# 自定义参数
python start_monitoring.py --server-name "my-server" --interval 2 --port 8080
```

### 2. 仅启动大屏展示

```bash
python dashboard.py
```

### 3. 仅启动数据采集

```bash
# 启动定时采集
python collector.py --interval 1

# 只采集一次
python collector.py --once
```

## 访问大屏

启动系统后，在浏览器中访问：
- 默认地址: http://localhost:5000
- 自定义端口: http://localhost:YOUR_PORT

## 配置说明

### 修改采集间隔

```python
# 在 config.py 中修改
SERVER_CONFIG = {
    "collection_interval": 2,  # 改为2分钟采集一次
}
```

### 修改监控阈值

```python
# 在 config.py 中修改阈值
THRESHOLD_CONFIG = {
    "cpu": {
        "warning": 70,   # CPU警告阈值
        "critical": 90,  # CPU危险阈值
    },
    "memory": {
        "warning": 80,   # 内存警告阈值
        "critical": 95,  # 内存危险阈值
    },
}
```

### 多服务器监控

1. 在每台服务器上运行数据采集器：
```bash
python collector.py --server-name "server-01" --interval 1
```

2. 将数据文件复制到主控服务器

3. 在主控服务器上启动大屏：
```bash
python dashboard.py
```

## 文件结构

```
├── server_monitor.py      # 核心监控模块
├── dashboard.py           # Web大屏展示
├── collector.py           # 数据采集器
├── start_monitoring.py    # 系统启动脚本
├── config.py             # 配置文件
├── requirements.txt      # 依赖包列表
├── templates/
│   └── dashboard.html    # 大屏HTML模板
├── data/                 # 数据存储目录
└── logs/                 # 日志目录
```

## 监控指标

### CPU指标
- 总CPU使用率
- 各核心使用率
- CPU频率信息

### 内存指标
- 总内存大小
- 已使用内存
- 可用内存
- 内存使用率
- 交换分区使用情况

### 磁盘指标
- 各分区使用情况
- 总容量、已使用、可用空间
- 使用率百分比

### 系统指标
- 系统运行时间
- 系统信息
- 网络连接数

## 数据存储

- 数据以JSON格式存储在 `data/` 目录
- 文件名格式: `server_data_服务器名.json`
- 自动保留最近1000条记录
- 支持历史数据查询

## 故障排除

### 1. 无法获取系统信息

**问题**: 在某些系统上可能无法获取某些指标
**解决**: 确保以管理员权限运行，或检查系统权限设置

### 2. 大屏无法访问

**问题**: 浏览器无法访问大屏页面
**解决**: 
- 检查端口是否被占用
- 确认防火墙设置
- 检查Flask服务是否正常启动

### 3. 数据采集失败

**问题**: 数据采集器无法正常工作
**解决**:
- 检查依赖包是否正确安装
- 查看日志文件了解详细错误信息
- 确认有足够的磁盘空间存储数据

## 性能优化

### 1. 减少采集频率
```python
# 对于负载较高的服务器，可以增加采集间隔
python collector.py --interval 5  # 5分钟采集一次
```

### 2. 限制历史数据
```python
# 在 config.py 中调整
SERVER_CONFIG = {
    "max_history_records": 500,  # 只保留500条记录
}
```

### 3. 禁用不必要的指标
修改 `server_monitor.py` 中的 `collect_all_metrics` 方法，注释掉不需要的指标采集。

## 扩展功能

### 1. 添加自定义指标

在 `ServerMonitor` 类中添加新的方法：

```python
def get_custom_metric(self):
    """获取自定义指标"""
    # 实现自定义指标采集逻辑
    return {"custom_value": 100}
```

### 2. 添加告警功能

修改 `config.py` 中的 `ALERT_CONFIG` 配置，实现邮件或Webhook告警。

### 3. 添加数据库支持

可以将数据存储从JSON文件改为数据库（如MySQL、PostgreSQL等）。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的服务器监控功能
- Web大屏展示
- 历史数据图表