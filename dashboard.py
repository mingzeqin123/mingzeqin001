#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器监控大屏 - Web展示界面
使用Flask和Chart.js展示多台服务器的监控指标
"""

from flask import Flask, render_template, jsonify, request
import json
import os
import glob
from datetime import datetime, timedelta
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class DashboardManager:
    """大屏管理类"""
    
    def __init__(self, data_dir: str = "."):
        self.data_dir = data_dir
        self.data_files = self._find_data_files()
    
    def _find_data_files(self) -> list:
        """查找所有服务器数据文件"""
        pattern = os.path.join(self.data_dir, "server_data_*.json")
        return glob.glob(pattern)
    
    def get_all_servers(self) -> list:
        """获取所有服务器列表"""
        servers = []
        for file_path in self.data_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    servers.append({
                        "name": data.get("server_name", "Unknown"),
                        "file": file_path,
                        "last_update": self._get_last_update_time(data)
                    })
            except Exception as e:
                logger.error(f"读取服务器数据失败 {file_path}: {e}")
        return servers
    
    def _get_last_update_time(self, data: dict) -> str:
        """获取最后更新时间"""
        try:
            if data.get("metrics"):
                last_metric = data["metrics"][-1]
                return last_metric.get("timestamp", "Unknown")
        except:
            pass
        return "Unknown"
    
    def get_server_latest_metrics(self, server_name: str) -> dict:
        """获取指定服务器的最新指标"""
        for file_path in self.data_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get("server_name") == server_name and data.get("metrics"):
                        return data["metrics"][-1]
            except Exception as e:
                logger.error(f"读取服务器 {server_name} 数据失败: {e}")
        return {}
    
    def get_server_metrics_history(self, server_name: str, hours: int = 24) -> list:
        """获取指定服务器的历史指标"""
        for file_path in self.data_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get("server_name") == server_name:
                        # 过滤指定时间范围内的数据
                        cutoff_time = datetime.now() - timedelta(hours=hours)
                        filtered_metrics = []
                        
                        for metric in data.get("metrics", []):
                            try:
                                metric_time = datetime.fromisoformat(metric["timestamp"])
                                if metric_time >= cutoff_time:
                                    filtered_metrics.append(metric)
                            except:
                                continue
                        
                        return filtered_metrics
            except Exception as e:
                logger.error(f"读取服务器 {server_name} 历史数据失败: {e}")
        return []
    
    def get_all_servers_latest_metrics(self) -> list:
        """获取所有服务器的最新指标"""
        all_metrics = []
        for server in self.get_all_servers():
            metrics = self.get_server_latest_metrics(server["name"])
            if metrics:
                all_metrics.append(metrics)
        return all_metrics

# 创建大屏管理器实例
dashboard_manager = DashboardManager()

@app.route('/')
def index():
    """主页面"""
    servers = dashboard_manager.get_all_servers()
    return render_template('dashboard.html', servers=servers)

@app.route('/api/servers')
def api_servers():
    """获取所有服务器列表"""
    servers = dashboard_manager.get_all_servers()
    return jsonify(servers)

@app.route('/api/metrics/<server_name>')
def api_server_metrics(server_name):
    """获取指定服务器的最新指标"""
    metrics = dashboard_manager.get_server_latest_metrics(server_name)
    return jsonify(metrics)

@app.route('/api/metrics/<server_name>/history')
def api_server_metrics_history(server_name):
    """获取指定服务器的历史指标"""
    hours = request.args.get('hours', 24, type=int)
    metrics = dashboard_manager.get_server_metrics_history(server_name, hours)
    return jsonify(metrics)

@app.route('/api/all-metrics')
def api_all_metrics():
    """获取所有服务器的最新指标"""
    metrics = dashboard_manager.get_all_servers_latest_metrics()
    return jsonify(metrics)

if __name__ == '__main__':
    # 创建templates目录
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    print("启动服务器监控大屏...")
    print("访问地址: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)