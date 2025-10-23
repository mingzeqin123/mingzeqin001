#!/usr/bin/env python3
"""
服务器监控系统演示脚本
展示系统的主要功能
"""

import asyncio
import json
import time
from server_monitor import ServerMonitor
from multi_server_client import MultiServerClient
from config import get_config


def demo_basic_monitoring():
    """演示基础监控功能"""
    print("🔍 基础监控功能演示")
    print("=" * 50)
    
    monitor = ServerMonitor()
    metrics = monitor.get_all_metrics()
    
    # 显示系统信息
    system = metrics['system']
    print(f"📊 服务器: {system['hostname']}")
    print(f"🖥️  系统: {system['system']}")
    print(f"⏰ 运行时间: {system['uptime_hours']} 小时")
    
    # 显示关键指标
    cpu = metrics['cpu']
    memory = metrics['memory']
    
    print(f"\n💻 CPU使用率: {cpu['usage_percent']}%")
    print(f"   核心数: {cpu['count_physical']} 物理 / {cpu['count_logical']} 逻辑")
    
    print(f"\n🧠 内存使用率: {memory['usage_percent']}%")
    print(f"   总量: {memory['total_gb']} GB")
    print(f"   已用: {memory['used_gb']} GB")
    print(f"   可用: {memory['available_gb']} GB")
    
    print(f"\n💾 磁盘信息:")
    for i, disk in enumerate(metrics['disk'][:3], 1):  # 只显示前3个
        print(f"   {i}. {disk['device']}: {disk['usage_percent']}% "
              f"({disk['used_gb']}/{disk['total_gb']} GB)")
    
    # 网络统计
    network = metrics['network']
    print(f"\n🌐 网络统计:")
    print(f"   发送: {network['bytes_sent'] / (1024**2):.2f} MB")
    print(f"   接收: {network['bytes_recv'] / (1024**2):.2f} MB")


def demo_configuration():
    """演示配置管理功能"""
    print("\n\n⚙️  配置管理功能演示")
    print("=" * 50)
    
    config = get_config()
    
    # 显示当前配置
    servers = config.get_all_servers()
    print(f"📋 当前配置的服务器数量: {len(servers)}")
    
    for server_id, server_info in servers.items():
        status = "✅ 启用" if server_info.get('enabled', True) else "❌ 禁用"
        print(f"   • {server_id}: {server_info['name']} ({server_info['host']}:{server_info['port']}) {status}")
        
        # 显示告警阈值
        thresholds = server_info.get('thresholds', {})
        print(f"     告警阈值: CPU {thresholds.get('cpu_warning', 70)}%/{thresholds.get('cpu_critical', 90)}% "
              f"内存 {thresholds.get('memory_warning', 80)}%/{thresholds.get('memory_critical', 95)}%")


async def demo_multi_server():
    """演示多服务器监控功能"""
    print("\n\n🌐 多服务器监控功能演示")
    print("=" * 50)
    
    try:
        async with MultiServerClient() as client:
            print("🔄 正在获取多服务器数据...")
            
            # 获取所有服务器数据
            results = await client.fetch_all_servers_metrics()
            
            if results:
                print(f"✅ 成功获取 {len(results)} 个服务器的数据")
                
                for server_id, metrics in results.items():
                    print(f"\n📊 服务器: {server_id} ({metrics['server_name']})")
                    print(f"   CPU: {metrics['cpu']['usage_percent']}%")
                    print(f"   内存: {metrics['memory']['usage_percent']}%")
                    print(f"   磁盘: {len(metrics['disk'])} 个分区")
                    print(f"   更新: {metrics['timestamp']}")
                
                # 获取聚合数据
                aggregated = client.get_aggregated_metrics()
                print(f"\n📈 聚合统计:")
                print(f"   总服务器: {aggregated['total_servers']}")
                print(f"   在线: {aggregated['online_servers']}")
                print(f"   离线: {aggregated['offline_servers']}")
                
                avg_metrics = aggregated['average_metrics']
                print(f"   平均CPU: {avg_metrics['cpu_percent']}%")
                print(f"   平均内存: {avg_metrics['memory_percent']}%")
                print(f"   平均磁盘: {avg_metrics['disk_percent']}%")
                
                # 获取告警
                alerts = client.get_server_alerts()
                if alerts:
                    print(f"\n🚨 告警信息 ({len(alerts)} 条):")
                    for alert in alerts:
                        level_icon = "🔴" if alert['level'] == 'critical' else "🟡"
                        print(f"   {level_icon} {alert['server_name']}: {alert['message']}")
                else:
                    print(f"\n✅ 无告警信息")
            else:
                print("⚠️  未能获取到服务器数据（可能是因为只有本地服务器且API服务器未运行）")
                
    except Exception as e:
        print(f"❌ 多服务器监控演示失败: {e}")
        print("💡 提示: 需要先启动API服务器才能进行多服务器监控")


def demo_json_output():
    """演示JSON数据输出"""
    print("\n\n📄 JSON数据格式演示")
    print("=" * 50)
    
    monitor = ServerMonitor()
    metrics = monitor.get_all_metrics()
    
    # 显示JSON格式的部分数据
    sample_data = {
        'timestamp': metrics['timestamp'],
        'server_name': metrics['server_name'],
        'cpu_usage': metrics['cpu']['usage_percent'],
        'memory_usage': metrics['memory']['usage_percent'],
        'disk_count': len(metrics['disk'])
    }
    
    print("📋 示例JSON输出:")
    print(json.dumps(sample_data, ensure_ascii=False, indent=2))


def demo_performance_tips():
    """演示性能提示"""
    print("\n\n⚡ 性能优化提示")
    print("=" * 50)
    
    print("🚀 系统性能特性:")
    print("   • 异步并发获取多服务器数据")
    print("   • 前端图表增量更新")
    print("   • 历史数据自动清理")
    print("   • 页面可见性检测")
    print("   • 错误重试机制")
    
    print("\n📊 推荐配置:")
    print("   • 更新间隔: 10-30秒")
    print("   • 历史记录: 50-100条")
    print("   • 告警阈值: CPU 70%/90%, 内存 80%/95%")
    print("   • 网络超时: 10秒")


def main():
    """主演示函数"""
    print("🎯 服务器监控系统功能演示")
    print("=" * 60)
    print("这个演示将展示系统的主要功能和特性")
    print("=" * 60)
    
    try:
        # 基础监控演示
        demo_basic_monitoring()
        
        # 配置管理演示
        demo_configuration()
        
        # 多服务器监控演示
        asyncio.run(demo_multi_server())
        
        # JSON输出演示
        demo_json_output()
        
        # 性能提示
        demo_performance_tips()
        
        print("\n\n🎉 演示完成！")
        print("=" * 60)
        print("💡 下一步:")
        print("   1. 运行 'python3 start_monitor.py' 启动完整系统")
        print("   2. 访问 http://localhost:5000 查看监控大屏")
        print("   3. 查看 README_server_monitor.md 了解详细文档")
        print("   4. 编辑 servers_config.json 添加更多服务器")
        
    except KeyboardInterrupt:
        print("\n\n👋 演示已停止")
    except Exception as e:
        print(f"\n❌ 演示过程中发生错误: {e}")


if __name__ == "__main__":
    main()