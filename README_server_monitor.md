# 服务器监控系统

一个功能完整的服务器监控系统，支持实时采集服务器状态指标（CPU使用率、内存使用比例、硬盘使用空间等），并提供现代化的Web大屏展示多台服务器的监控数据。

## 功能特性

### 🚀 核心功能
- **实时监控**: 实时采集CPU、内存、磁盘、网络等系统指标
- **多服务器支持**: 支持同时监控多台服务器
- **可视化大屏**: 现代化的Web界面，支持实时图表展示
- **告警系统**: 支持自定义阈值和告警通知
- **历史数据**: 保存历史监控数据，支持趋势分析

### 📊 监控指标
- **CPU**: 使用率、核心数、频率
- **内存**: 使用率、总量、可用量、交换分区
- **磁盘**: 各分区使用率、总容量、可用空间
- **网络**: 发送/接收字节数、数据包统计
- **系统**: 主机名、操作系统、启动时间、运行时长

### 🎨 界面特性
- 响应式设计，支持桌面和移动设备
- 实时更新的图表和进度条
- 现代化的毛玻璃效果UI
- 颜色编码的状态指示（正常/警告/危险）
- 多服务器状态概览

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web浏览器     │    │   API服务器     │    │  监控代理       │
│                 │    │                 │    │                 │
│  - 监控大屏     │◄──►│  - REST API     │◄──►│  - 指标采集     │
│  - 实时图表     │    │  - 数据聚合     │    │  - 系统信息     │
│  - 告警显示     │    │  - 多服务器管理 │    │  - 状态上报     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 快速开始

### 1. 环境要求

- Python 3.7+
- 现代Web浏览器（Chrome、Firefox、Safari、Edge）

### 2. 安装依赖

```bash
# 安装Python依赖
pip install -r requirements.txt
```

### 3. 启动监控系统

#### 方式一：启动单服务器监控
```bash
# 启动API服务器（包含Web界面）
python api_server.py
```

#### 方式二：使用启动脚本
```bash
# 使用启动脚本（推荐）
python start_monitor.py
```

### 4. 访问监控大屏

打开浏览器访问：`http://localhost:5000`

## 配置说明

### 服务器配置文件

系统会自动创建 `servers_config.json` 配置文件：

```json
{
  "servers": {
    "local": {
      "name": "本地服务器",
      "host": "localhost",
      "port": 5000,
      "enabled": true,
      "description": "本地监控服务器",
      "tags": ["local", "primary"],
      "thresholds": {
        "cpu_warning": 70,
        "cpu_critical": 90,
        "memory_warning": 80,
        "memory_critical": 95,
        "disk_warning": 80,
        "disk_critical": 95
      }
    }
  },
  "global_settings": {
    "update_interval": 10,
    "history_limit": 100,
    "auto_refresh": true
  }
}
```

### 添加远程服务器

1. 在远程服务器上部署监控代理：
```bash
# 在远程服务器上运行
python api_server.py
```

2. 在主服务器配置文件中添加远程服务器：
```json
{
  "web-server-01": {
    "name": "Web服务器01",
    "host": "192.168.1.100",
    "port": 5000,
    "enabled": true,
    "description": "主要的Web服务器",
    "tags": ["web", "production"]
  }
}
```

## API接口文档

### 基础接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/metrics` | GET | 获取当前指标 |
| `/api/metrics/history` | GET | 获取历史指标 |
| `/api/metrics/summary` | GET | 获取指标摘要 |

### 多服务器接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/servers` | GET | 获取服务器列表 |
| `/api/servers/multi` | GET | 获取多服务器聚合数据 |
| `/api/servers/alerts` | GET | 获取告警信息 |
| `/api/servers/{id}` | GET | 获取指定服务器指标 |

### 响应格式

```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01 12:00:00",
    "server_name": "localhost",
    "cpu": {
      "usage_percent": 25.5,
      "count_physical": 4,
      "count_logical": 8,
      "frequency_mhz": 2400.0
    },
    "memory": {
      "total_gb": 16.0,
      "used_gb": 8.5,
      "available_gb": 7.5,
      "usage_percent": 53.1
    }
  }
}
```

## 文件结构

```
server-monitor/
├── server_monitor.py      # 核心监控模块
├── api_server.py          # API服务器
├── multi_server_client.py # 多服务器客户端
├── config.py              # 配置管理
├── start_monitor.py       # 启动脚本
├── requirements.txt       # Python依赖
├── templates/
│   └── dashboard.html     # Web界面模板
├── static/
│   ├── css/
│   │   └── dashboard.css  # 样式文件
│   └── js/
│       └── dashboard.js   # 前端脚本
└── README_server_monitor.md
```

## 使用示例

### 1. 基础监控

```python
from server_monitor import ServerMonitor

# 创建监控实例
monitor = ServerMonitor()

# 获取所有指标
metrics = monitor.get_all_metrics()
print(f"CPU使用率: {metrics['cpu']['usage_percent']}%")
print(f"内存使用率: {metrics['memory']['usage_percent']}%")
```

### 2. 多服务器监控

```python
import asyncio
from multi_server_client import MultiServerClient

async def monitor_servers():
    async with MultiServerClient() as client:
        # 获取所有服务器数据
        results = await client.fetch_all_servers_metrics()
        
        # 获取聚合数据
        aggregated = client.get_aggregated_metrics()
        print(f"在线服务器: {aggregated['online_servers']}")
        
        # 获取告警
        alerts = client.get_server_alerts()
        for alert in alerts:
            print(f"告警: {alert['message']}")

# 运行
asyncio.run(monitor_servers())
```

### 3. 配置管理

```python
from config import get_config

config = get_config()

# 添加服务器
config.add_server('web-01', {
    'name': 'Web服务器01',
    'host': '192.168.1.100',
    'port': 5000,
    'description': '主Web服务器'
})

# 获取所有服务器
servers = config.get_all_servers()
```

## 告警配置

系统支持多级别告警：

- **警告级别**: CPU > 70%, 内存 > 80%, 磁盘 > 80%
- **危险级别**: CPU > 90%, 内存 > 95%, 磁盘 > 95%
- **连接告警**: 服务器离线或无法连接

可以在配置文件中自定义各服务器的告警阈值。

## 性能优化

- 使用异步HTTP请求并发获取多服务器数据
- 前端图表使用增量更新减少重绘
- 历史数据限制在合理范围内避免内存溢出
- 支持页面可见性检测，隐藏时暂停更新

## 故障排除

### 常见问题

1. **无法获取CPU频率**
   - 某些虚拟机环境可能无法获取CPU频率信息
   - 这是正常现象，不影响其他指标

2. **磁盘权限错误**
   - 某些系统分区可能需要管理员权限
   - 系统会自动跳过无权限的分区

3. **网络连接超时**
   - 检查防火墙设置
   - 确认目标服务器的监控服务正在运行
   - 验证网络连通性

### 日志查看

系统会输出详细的运行日志，包括：
- 指标采集状态
- 网络连接状态  
- 错误信息和警告

## 扩展开发

### 添加新的监控指标

1. 在 `ServerMonitor` 类中添加新的获取方法
2. 更新 `get_all_metrics()` 方法包含新指标
3. 在前端界面中添加显示组件

### 自定义告警规则

1. 修改 `MultiServerClient.get_server_alerts()` 方法
2. 添加新的告警类型和判断逻辑
3. 更新配置文件结构支持新规则

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！