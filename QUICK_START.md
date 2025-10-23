# 快速开始指南

## 🚀 立即体验

### 1. 安装依赖
```bash
pip3 install -r requirements.txt
```

### 2. 运行演示
```bash
python3 demo.py
```

### 3. 访问大屏
打开浏览器访问: http://localhost:5002

## 📋 基本使用

### 启动完整监控系统
```bash
python3 start_monitoring.py
```

### 仅启动大屏展示
```bash
python3 dashboard.py
```

### 仅启动数据采集
```bash
python3 collector.py
```

### 运行测试
```bash
python3 test_monitoring.py
```

## 🎯 主要功能

- ✅ **实时监控**: CPU、内存、磁盘使用率
- ✅ **可视化大屏**: 美观的Web界面
- ✅ **历史图表**: 趋势分析
- ✅ **多服务器**: 支持多台服务器监控
- ✅ **自动刷新**: 数据自动更新

## 📊 监控指标

| 指标类型 | 说明 |
|---------|------|
| CPU | 使用率、核心数、频率 |
| 内存 | 使用率、总量、可用量 |
| 磁盘 | 各分区使用情况 |
| 系统 | 运行时间、系统信息 |
| 网络 | 连接数、流量统计 |

## 🔧 自定义配置

编辑 `config.py` 文件来修改：
- 采集间隔
- 监控阈值
- 端口设置
- 数据保留时间

## 📁 文件说明

- `server_monitor.py` - 核心监控模块
- `dashboard.py` - Web大屏展示
- `collector.py` - 数据采集器
- `start_monitoring.py` - 系统启动脚本
- `config.py` - 配置文件
- `templates/dashboard.html` - 大屏模板

## 🆘 常见问题

**Q: 无法访问大屏？**
A: 检查端口是否被占用，尝试使用不同端口

**Q: 数据采集失败？**
A: 确保有足够权限，检查依赖包是否正确安装

**Q: 如何监控多台服务器？**
A: 在每台服务器上运行采集器，将数据文件复制到主控服务器

## 📞 技术支持

如有问题，请查看 `MONITORING_README.md` 获取详细文档。