#!/usr/bin/env python3
"""
分布式几十亿数据查找算法
支持数据分片、负载均衡、故障恢复等特性
"""

import hashlib
import json
import time
import threading
import socket
import pickle
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import asyncio
import aiofiles
import redis
import zookeeper


@dataclass
class SearchRequest:
    """查找请求"""
    key: str
    request_id: str
    timestamp: float
    priority: int = 1


@dataclass
class SearchResponse:
    """查找响应"""
    request_id: str
    found: bool
    value: Any = None
    node_id: str = ""
    search_time: float = 0.0
    error: str = ""


class ConsistentHash:
    """一致性哈希算法"""
    
    def __init__(self, nodes: List[str], replicas: int = 150):
        self.replicas = replicas
        self.ring = {}
        self.sorted_keys = []
        
        for node in nodes:
            self.add_node(node)
    
    def _hash(self, key: str) -> int:
        """计算哈希值"""
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
    
    def add_node(self, node: str) -> None:
        """添加节点"""
        for i in range(self.replicas):
            key = self._hash(f"{node}:{i}")
            self.ring[key] = node
            self.sorted_keys.append(key)
        
        self.sorted_keys.sort()
    
    def remove_node(self, node: str) -> None:
        """移除节点"""
        keys_to_remove = []
        for key, n in self.ring.items():
            if n == node:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.ring[key]
            self.sorted_keys.remove(key)
    
    def get_node(self, key: str) -> str:
        """获取键对应的节点"""
        if not self.ring:
            return None
        
        hash_key = self._hash(key)
        for key in self.sorted_keys:
            if hash_key <= key:
                return self.ring[key]
        
        return self.ring[self.sorted_keys[0]]


class DataShard:
    """数据分片"""
    
    def __init__(self, shard_id: str, capacity: int = 1000000):
        self.shard_id = shard_id
        self.capacity = capacity
        self.data = {}
        self.index = {}  # 二级索引
        self.lock = threading.RLock()
        self.stats = {
            'hits': 0,
            'misses': 0,
            'total_searches': 0,
            'avg_search_time': 0.0
        }
    
    def insert(self, key: str, value: Any) -> bool:
        """插入数据"""
        with self.lock:
            if len(self.data) >= self.capacity:
                return False
            
            self.data[key] = value
            
            # 更新二级索引
            for field, field_value in value.items() if isinstance(value, dict) else {}:
                if field not in self.index:
                    self.index[field] = {}
                if field_value not in self.index[field]:
                    self.index[field][field_value] = set()
                self.index[field][field_value].add(key)
            
            return True
    
    def search(self, key: str) -> Tuple[bool, Any, float]:
        """查找数据"""
        start_time = time.time()
        
        with self.lock:
            self.stats['total_searches'] += 1
            
            if key in self.data:
                self.stats['hits'] += 1
                search_time = time.time() - start_time
                self._update_avg_search_time(search_time)
                return True, self.data[key], search_time
            else:
                self.stats['misses'] += 1
                search_time = time.time() - start_time
                self._update_avg_search_time(search_time)
                return False, None, search_time
    
    def search_by_field(self, field: str, value: Any) -> List[Tuple[str, Any]]:
        """按字段查找"""
        with self.lock:
            if field in self.index and value in self.index[field]:
                return [(key, self.data[key]) for key in self.index[field][value] if key in self.data]
            return []
    
    def _update_avg_search_time(self, search_time: float) -> None:
        """更新平均查找时间"""
        total = self.stats['total_searches']
        current_avg = self.stats['avg_search_time']
        self.stats['avg_search_time'] = (current_avg * (total - 1) + search_time) / total
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        with self.lock:
            hit_rate = self.stats['hits'] / max(self.stats['total_searches'], 1)
            return {
                'shard_id': self.shard_id,
                'data_size': len(self.data),
                'hit_rate': hit_rate,
                'avg_search_time': self.stats['avg_search_time'],
                **self.stats
            }


class SearchNode:
    """查找节点"""
    
    def __init__(self, node_id: str, port: int, shard_count: int = 10):
        self.node_id = node_id
        self.port = port
        self.shard_count = shard_count
        self.shards = {}
        self.running = False
        self.server_socket = None
        self.thread_pool = ThreadPoolExecutor(max_workers=20)
        
        # 初始化分片
        for i in range(shard_count):
            shard_id = f"{node_id}_shard_{i}"
            self.shards[shard_id] = DataShard(shard_id)
    
    def start(self) -> None:
        """启动节点"""
        self.running = True
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind(('localhost', self.port))
        self.server_socket.listen(100)
        
        print(f"节点 {self.node_id} 启动在端口 {self.port}")
        
        while self.running:
            try:
                client_socket, address = self.server_socket.accept()
                self.thread_pool.submit(self._handle_request, client_socket)
            except Exception as e:
                if self.running:
                    print(f"节点 {self.node_id} 接受连接时出错: {e}")
    
    def stop(self) -> None:
        """停止节点"""
        self.running = False
        if self.server_socket:
            self.server_socket.close()
        self.thread_pool.shutdown(wait=True)
    
    def _handle_request(self, client_socket: socket.socket) -> None:
        """处理请求"""
        try:
            data = client_socket.recv(4096)
            if not data:
                return
            
            request = pickle.loads(data)
            response = self._process_search_request(request)
            
            response_data = pickle.dumps(response)
            client_socket.send(response_data)
            
        except Exception as e:
            error_response = SearchResponse(
                request_id="",
                found=False,
                error=str(e)
            )
            client_socket.send(pickle.dumps(error_response))
        finally:
            client_socket.close()
    
    def _process_search_request(self, request: SearchRequest) -> SearchResponse:
        """处理查找请求"""
        start_time = time.time()
        
        # 根据键的哈希值选择分片
        shard_id = self._select_shard(request.key)
        shard = self.shards[shard_id]
        
        found, value, search_time = shard.search(request.key)
        
        return SearchResponse(
            request_id=request.request_id,
            found=found,
            value=value,
            node_id=self.node_id,
            search_time=search_time
        )
    
    def _select_shard(self, key: str) -> str:
        """选择分片"""
        hash_value = hash(key) % self.shard_count
        return f"{self.node_id}_shard_{hash_value}"
    
    def insert_data(self, key: str, value: Any) -> bool:
        """插入数据"""
        shard_id = self._select_shard(key)
        shard = self.shards[shard_id]
        return shard.insert(key, value)
    
    def get_stats(self) -> Dict[str, Any]:
        """获取节点统计信息"""
        shard_stats = [shard.get_stats() for shard in self.shards.values()]
        return {
            'node_id': self.node_id,
            'port': self.port,
            'shard_count': self.shard_count,
            'shards': shard_stats
        }


class DistributedSearchCluster:
    """分布式查找集群"""
    
    def __init__(self, nodes: List[Tuple[str, int]]):
        self.nodes = nodes
        self.consistent_hash = ConsistentHash([f"{host}:{port}" for host, port in nodes])
        self.node_connections = {}
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.cache_ttl = 300  # 5分钟缓存
        self.load_balancer = LoadBalancer(nodes)
    
    def search(self, key: str, use_cache: bool = True) -> SearchResponse:
        """分布式查找"""
        request_id = f"{key}_{int(time.time() * 1000)}"
        
        # 检查缓存
        if use_cache:
            cached_result = self._get_from_cache(key)
            if cached_result:
                return cached_result
        
        # 选择节点
        node_info = self.consistent_hash.get_node(key)
        if not node_info:
            return SearchResponse(request_id=request_id, found=False, error="No available nodes")
        
        host, port = node_info.split(':')
        
        # 发送请求
        try:
            request = SearchRequest(key=key, request_id=request_id, timestamp=time.time())
            response = self._send_request(host, int(port), request)
            
            # 缓存结果
            if use_cache and response.found:
                self._set_cache(key, response)
            
            return response
            
        except Exception as e:
            return SearchResponse(
                request_id=request_id,
                found=False,
                error=f"Search failed: {str(e)}"
            )
    
    def batch_search(self, keys: List[str]) -> List[SearchResponse]:
        """批量查找"""
        with ThreadPoolExecutor(max_workers=min(len(keys), 50)) as executor:
            futures = [executor.submit(self.search, key) for key in keys]
            return [future.result() for future in as_completed(futures)]
    
    def insert_data(self, key: str, value: Any) -> bool:
        """插入数据"""
        node_info = self.consistent_hash.get_node(key)
        if not node_info:
            return False
        
        host, port = node_info.split(':')
        
        try:
            # 这里简化处理，实际应该通过RPC调用
            # 在实际实现中，应该通过消息队列或RPC框架
            return True
        except Exception as e:
            print(f"Insert failed: {e}")
            return False
    
    def _send_request(self, host: str, port: int, request: SearchRequest) -> SearchResponse:
        """发送请求到指定节点"""
        try:
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.settimeout(5.0)
            client_socket.connect((host, port))
            
            request_data = pickle.dumps(request)
            client_socket.send(request_data)
            
            response_data = client_socket.recv(4096)
            response = pickle.loads(response_data)
            
            client_socket.close()
            return response
            
        except Exception as e:
            raise Exception(f"Failed to send request to {host}:{port}: {e}")
    
    def _get_from_cache(self, key: str) -> Optional[SearchResponse]:
        """从缓存获取结果"""
        try:
            cached_data = self.redis_client.get(f"search:{key}")
            if cached_data:
                return pickle.loads(cached_data)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    def _set_cache(self, key: str, response: SearchResponse) -> None:
        """设置缓存"""
        try:
            self.redis_client.setex(
                f"search:{key}",
                self.cache_ttl,
                pickle.dumps(response)
            )
        except Exception as e:
            print(f"Cache set error: {e}")
    
    def get_cluster_stats(self) -> Dict[str, Any]:
        """获取集群统计信息"""
        return {
            'node_count': len(self.nodes),
            'consistent_hash_ring_size': len(self.consistent_hash.ring),
            'cache_ttl': self.cache_ttl
        }


class LoadBalancer:
    """负载均衡器"""
    
    def __init__(self, nodes: List[Tuple[str, int]]):
        self.nodes = nodes
        self.current_index = 0
        self.node_weights = {f"{host}:{port}": 1.0 for host, port in nodes}
        self.node_stats = {f"{host}:{port}": {'requests': 0, 'errors': 0} for host, port in nodes}
        self.lock = threading.Lock()
    
    def get_next_node(self) -> Tuple[str, int]:
        """获取下一个节点（轮询）"""
        with self.lock:
            host, port = self.nodes[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.nodes)
            return host, port
    
    def get_weighted_node(self) -> Tuple[str, int]:
        """获取加权节点"""
        with self.lock:
            # 简单的加权轮询实现
            total_weight = sum(self.node_weights.values())
            if total_weight == 0:
                return self.get_next_node()
            
            # 选择权重最高的节点
            best_node = max(self.node_weights.items(), key=lambda x: x[1])
            node_info = best_node[0]
            host, port = node_info.split(':')
            return host, int(port)
    
    def update_node_weight(self, node_info: str, weight: float) -> None:
        """更新节点权重"""
        with self.lock:
            self.node_weights[node_info] = weight
    
    def record_request(self, node_info: str, success: bool) -> None:
        """记录请求统计"""
        with self.lock:
            if node_info in self.node_stats:
                self.node_stats[node_info]['requests'] += 1
                if not success:
                    self.node_stats[node_info]['errors'] += 1


class FaultToleranceManager:
    """故障容错管理器"""
    
    def __init__(self, cluster: DistributedSearchCluster):
        self.cluster = cluster
        self.health_check_interval = 30  # 30秒健康检查
        self.failed_nodes = set()
        self.replication_factor = 2
        self.running = False
        self.health_check_thread = None
    
    def start(self) -> None:
        """启动故障容错管理"""
        self.running = True
        self.health_check_thread = threading.Thread(target=self._health_check_loop)
        self.health_check_thread.daemon = True
        self.health_check_thread.start()
    
    def stop(self) -> None:
        """停止故障容错管理"""
        self.running = False
        if self.health_check_thread:
            self.health_check_thread.join()
    
    def _health_check_loop(self) -> None:
        """健康检查循环"""
        while self.running:
            try:
                self._check_node_health()
                time.sleep(self.health_check_interval)
            except Exception as e:
                print(f"Health check error: {e}")
    
    def _check_node_health(self) -> None:
        """检查节点健康状态"""
        for host, port in self.cluster.nodes:
            node_info = f"{host}:{port}"
            if self._is_node_healthy(host, port):
                if node_info in self.failed_nodes:
                    print(f"Node {node_info} recovered")
                    self.failed_nodes.remove(node_info)
            else:
                if node_info not in self.failed_nodes:
                    print(f"Node {node_info} failed")
                    self.failed_nodes.add(node_info)
    
    def _is_node_healthy(self, host: str, port: int) -> bool:
        """检查节点是否健康"""
        try:
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.settimeout(5.0)
            client_socket.connect((host, port))
            client_socket.close()
            return True
        except:
            return False


def create_test_cluster() -> DistributedSearchCluster:
    """创建测试集群"""
    nodes = [
        ("localhost", 8001),
        ("localhost", 8002),
        ("localhost", 8003),
        ("localhost", 8004),
    ]
    
    cluster = DistributedSearchCluster(nodes)
    return cluster


def run_performance_test():
    """运行性能测试"""
    print("=== 分布式查找性能测试 ===\n")
    
    # 创建测试数据
    test_data = []
    for i in range(10000):
        key = f"key_{i:06d}"
        value = {
            "id": i,
            "name": f"Item_{i}",
            "value": i * 2,
            "timestamp": time.time()
        }
        test_data.append((key, value))
    
    # 创建集群
    cluster = create_test_cluster()
    
    # 插入测试数据
    print("插入测试数据...")
    for key, value in test_data:
        cluster.insert_data(key, value)
    
    # 测试查找性能
    print("测试查找性能...")
    search_keys = [f"key_{i:06d}" for i in range(0, 10000, 100)]
    
    start_time = time.time()
    results = cluster.batch_search(search_keys)
    total_time = time.time() - start_time
    
    found_count = sum(1 for result in results if result.found)
    print(f"查找完成: {found_count}/{len(search_keys)} 找到")
    print(f"总耗时: {total_time:.3f}秒")
    print(f"平均每次查找: {total_time/len(search_keys):.6f}秒")
    print(f"QPS: {len(search_keys)/total_time:.2f}")
    
    # 显示集群统计
    stats = cluster.get_cluster_stats()
    print(f"\n集群统计: {stats}")


if __name__ == "__main__":
    print("分布式几十亿数据查找算法")
    print("=" * 50)
    
    # 运行性能测试
    run_performance_test()
    
    print("\n=== 使用建议 ===")
    print("1. 数据分片: 将几十亿数据分散到多个节点")
    print("2. 一致性哈希: 确保数据均匀分布和负载均衡")
    print("3. 缓存策略: 使用Redis等缓存热点数据")
    print("4. 故障容错: 实现节点健康检查和自动故障转移")
    print("5. 负载均衡: 根据节点性能动态调整负载")
    print("6. 数据复制: 关键数据多副本存储")
    print("7. 监控告警: 实时监控集群状态和性能指标")