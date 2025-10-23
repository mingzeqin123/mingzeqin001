#!/usr/bin/env python3
"""
服务器监控API服务器
提供REST API接口来获取服务器监控数据
"""

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import json
import threading
import time
import asyncio
from datetime import datetime, timedelta
from server_monitor import ServerMonitor
from multi_server_client import MultiServerClient
from config import get_config
import logging
from typing import Dict, List
import os

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)  # 允许跨域请求

# 全局变量
monitor = ServerMonitor()
metrics_history = []  # 存储历史数据
MAX_HISTORY_SIZE = 100  # 最多保存100条历史记录
multi_server_data = {}  # 多服务器数据
config = get_config()  # 配置管理


class MetricsCollector:
    """指标收集器"""
    
    def __init__(self):
        self.running = False
        self.thread = None
    
    def start(self, interval=30):
        """开始收集指标"""
        self.running = True
        self.thread = threading.Thread(target=self._collect_loop, args=(interval,))
        self.thread.daemon = True
        self.thread.start()
        logger.info(f"指标收集器已启动，收集间隔: {interval}秒")
    
    def stop(self):
        """停止收集指标"""
        self.running = False
        if self.thread:
            self.thread.join()
        logger.info("指标收集器已停止")
    
    def _collect_loop(self, interval):
        """收集循环"""
        while self.running:
            try:
                metrics = monitor.get_all_metrics()
                metrics_history.append(metrics)
                
                # 保持历史记录在限制范围内
                if len(metrics_history) > MAX_HISTORY_SIZE:
                    metrics_history.pop(0)
                
                logger.info(f"收集到指标数据: {metrics['timestamp']}")
                
            except Exception as e:
                logger.error(f"收集指标时发生错误: {e}")
            
            time.sleep(interval)


# 创建指标收集器实例
collector = MetricsCollector()


@app.route('/')
def index():
    """主页 - 显示监控大屏"""
    return render_template('dashboard.html')


@app.route('/api/metrics')
def get_current_metrics():
    """获取当前服务器指标"""
    try:
        metrics = monitor.get_all_metrics()
        return jsonify({
            'success': True,
            'data': metrics
        })
    except Exception as e:
        logger.error(f"获取当前指标失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/metrics/history')
def get_metrics_history():
    """获取历史指标数据"""
    try:
        # 获取查询参数
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, MAX_HISTORY_SIZE)  # 限制最大返回数量
        
        # 返回最近的数据
        recent_data = metrics_history[-limit:] if metrics_history else []
        
        return jsonify({
            'success': True,
            'data': recent_data,
            'total': len(metrics_history)
        })
    except Exception as e:
        logger.error(f"获取历史指标失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/metrics/summary')
def get_metrics_summary():
    """获取指标摘要"""
    try:
        if not metrics_history:
            return jsonify({
                'success': True,
                'data': {
                    'total_records': 0,
                    'latest_timestamp': None,
                    'server_name': monitor.server_name
                }
            })
        
        latest = metrics_history[-1]
        
        # 计算平均值（最近10条记录）
        recent_records = metrics_history[-10:]
        avg_cpu = sum(record['cpu']['usage_percent'] for record in recent_records) / len(recent_records)
        avg_memory = sum(record['memory']['usage_percent'] for record in recent_records) / len(recent_records)
        
        summary = {
            'total_records': len(metrics_history),
            'latest_timestamp': latest['timestamp'],
            'server_name': latest['server_name'],
            'current_cpu': latest['cpu']['usage_percent'],
            'current_memory': latest['memory']['usage_percent'],
            'avg_cpu_10min': round(avg_cpu, 2),
            'avg_memory_10min': round(avg_memory, 2),
            'system_info': latest['system']
        }
        
        return jsonify({
            'success': True,
            'data': summary
        })
    except Exception as e:
        logger.error(f"获取指标摘要失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/servers')
def get_servers():
    """获取服务器列表"""
    try:
        servers = []
        all_servers = config.get_all_servers()
        
        for server_id, server_config in all_servers.items():
            server_info = {
                'id': server_id,
                'name': server_config['name'],
                'host': server_config['host'],
                'port': server_config['port'],
                'enabled': server_config.get('enabled', True),
                'description': server_config.get('description', ''),
                'tags': server_config.get('tags', []),
                'status': 'unknown',
                'last_update': None
            }
            
            # 如果有多服务器数据，更新状态
            if server_id in multi_server_data:
                server_data = multi_server_data[server_id]
                server_info['status'] = 'online'
                server_info['last_update'] = server_data.get('timestamp')
                server_info['metrics'] = {
                    'cpu_percent': server_data['cpu']['usage_percent'],
                    'memory_percent': server_data['memory']['usage_percent'],
                    'disk_count': len(server_data['disk'])
                }
            
            servers.append(server_info)
        
        return jsonify({
            'success': True,
            'data': servers
        })
    except Exception as e:
        logger.error(f"获取服务器列表失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/servers/multi')
def get_multi_server_metrics():
    """获取多服务器聚合数据"""
    try:
        # 使用异步函数获取多服务器数据
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def fetch_data():
            async with MultiServerClient() as client:
                await client.fetch_all_servers_metrics()
                return client.get_aggregated_metrics()
        
        aggregated_data = loop.run_until_complete(fetch_data())
        loop.close()
        
        # 更新全局多服务器数据
        global multi_server_data
        multi_server_data = aggregated_data.get('servers', {})
        
        return jsonify({
            'success': True,
            'data': aggregated_data
        })
    except Exception as e:
        logger.error(f"获取多服务器数据失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/servers/alerts')
def get_server_alerts():
    """获取服务器告警信息"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def fetch_alerts():
            async with MultiServerClient() as client:
                await client.fetch_all_servers_metrics()
                return client.get_server_alerts()
        
        alerts = loop.run_until_complete(fetch_alerts())
        loop.close()
        
        return jsonify({
            'success': True,
            'data': alerts
        })
    except Exception as e:
        logger.error(f"获取告警信息失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/servers/<server_id>')
def get_server_metrics(server_id):
    """获取指定服务器的详细指标"""
    try:
        if server_id == 'local':
            # 返回本地服务器数据
            metrics = monitor.get_all_metrics()
            return jsonify({
                'success': True,
                'data': metrics
            })
        else:
            # 返回多服务器数据中的指定服务器
            if server_id in multi_server_data:
                return jsonify({
                    'success': True,
                    'data': multi_server_data[server_id]
                })
            else:
                return jsonify({
                    'success': False,
                    'error': f'服务器 {server_id} 数据不可用'
                }), 404
    except Exception as e:
        logger.error(f"获取服务器 {server_id} 指标失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health')
def health_check():
    """健康检查接口"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'server': monitor.server_name
    })


@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    return jsonify({
        'success': False,
        'error': 'API endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


def create_directories():
    """创建必要的目录"""
    directories = ['templates', 'static', 'static/css', 'static/js']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)


def main():
    """主函数"""
    # 创建必要的目录
    create_directories()
    
    # 启动指标收集器
    collector.start(interval=10)  # 每10秒收集一次
    
    try:
        # 启动Flask应用
        logger.info("启动服务器监控API服务器...")
        logger.info("访问 http://localhost:5000 查看监控大屏")
        logger.info("API文档:")
        logger.info("  GET /api/metrics - 获取当前指标")
        logger.info("  GET /api/metrics/history - 获取历史指标")
        logger.info("  GET /api/metrics/summary - 获取指标摘要")
        logger.info("  GET /api/servers - 获取服务器列表")
        logger.info("  GET /api/health - 健康检查")
        
        app.run(host='0.0.0.0', port=5000, debug=False)
        
    except KeyboardInterrupt:
        logger.info("收到停止信号...")
    finally:
        # 停止指标收集器
        collector.stop()
        logger.info("服务器已关闭")


if __name__ == "__main__":
    main()