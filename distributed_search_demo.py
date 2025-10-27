#!/usr/bin/env python3
"""
分布式搜索和性能测试演示
"""

import os
import sys
import time
import hashlib
import json
from typing import List, Dict, Optional
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

# 导入主模块
from billion_data_search import DataRecord, ShardedHashIndex, ExternalSortedSearch, BloomFilterSearch


class DistributedSearch:
    """
    分布式搜索算法
    
    核心思想：
    1. 将数据分布到多个节点（进程/机器）
    2. 并行搜索所有节点
    3. 汇总结果返回
    
    适用场景：超大规模数据，需要线性扩展能力
    """
    
    def __init__(self, num_nodes: int = 4, base_dir: str = "/workspace/distributed_data"):
        """
        初始化分布式搜索
        
        Args:
            num_nodes: 节点数量
            base_dir: 基础数据目录
        """
        self.num_nodes = num_nodes
        self.base_dir = base_dir
        self.nodes = {}  # node_id -> ShardedHashIndex
        
        # 为每个节点创建独立的索引
        for node_id in range(num_nodes):
            node_dir = os.path.join(base_dir, f"node_{node_id}")
            self.nodes[node_id] = ShardedHashIndex(node_dir, num_shards=128)
    
    def _get_node_id(self, key: str) -> int:
        """根据key计算节点ID"""
        hash_value = int(hashlib.md5(key.encode()).hexdigest(), 16)
        return hash_value % self.num_nodes
    
    def distribute_data(self, records: List[DataRecord]):
        """
        将数据分布到各个节点
        
        Args:
            records: 数据记录列表
        """
        print(f"分布数据到 {self.num_nodes} 个节点，共 {len(records)} 条记录...")
        
        # 按节点分组记录
        node_records = defaultdict(list)
        for record in records:
            node_id = self._get_node_id(record.key)
            node_records[node_id].append(record)
        
        # 并行分布数据到各节点
        with ThreadPoolExecutor(max_workers=self.num_nodes) as executor:
            futures = []
            for node_id, records_for_node in node_records.items():
                future = executor.submit(self.nodes[node_id].insert_batch, records_for_node)
                futures.append((node_id, future))
            
            for node_id, future in futures:
                try:
                    future.result()
                    print(f"节点 {node_id} 完成数据插入: {len(node_records[node_id])} 条记录")
                except Exception as e:
                    print(f"节点 {node_id} 插入失败: {e}")
        
        print("数据分布完成")
    
    def search(self, key: str) -> Optional[DataRecord]:
        """
        搜索指定key
        
        Args:
            key: 要搜索的键
            
        Returns:
            找到的数据记录，如果不存在返回None
        """
        # 直接定位到对应节点搜索
        node_id = self._get_node_id(key)
        return self.nodes[node_id].search(key)
    
    def batch_search(self, keys: List[str]) -> Dict[str, Optional[DataRecord]]:
        """
        批量搜索
        
        Args:
            keys: 要搜索的键列表
            
        Returns:
            键到记录的映射字典
        """
        # 按节点分组keys
        node_keys = defaultdict(list)
        for key in keys:
            node_id = self._get_node_id(key)
            node_keys[node_id].append(key)
        
        results = {}
        
        # 并行搜索各个节点
        with ThreadPoolExecutor(max_workers=self.num_nodes) as executor:
            futures = []
            for node_id, keys_for_node in node_keys.items():
                future = executor.submit(self.nodes[node_id].batch_search, keys_for_node)
                futures.append(future)
            
            for future in as_completed(futures):
                try:
                    node_results = future.result()
                    results.update(node_results)
                except Exception as e:
                    print(f"节点搜索失败: {e}")
        
        return results
    
    def broadcast_search(self, key: str) -> List[DataRecord]:
        """
        广播搜索（在所有节点中搜索，用于模糊匹配等场景）
        
        Args:
            key: 要搜索的键
            
        Returns:
            所有匹配的记录列表
        """
        results = []
        
        # 并行搜索所有节点
        with ThreadPoolExecutor(max_workers=self.num_nodes) as executor:
            futures = []
            for node_id, node_index in self.nodes.items():
                future = executor.submit(node_index.search, key)
                futures.append(future)
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result:
                        results.append(result)
                except Exception as e:
                    print(f"节点搜索失败: {e}")
        
        return results
    
    def get_statistics(self) -> Dict:
        """获取集群统计信息"""
        cluster_stats = {
            "num_nodes": self.num_nodes,
            "nodes": {},
            "total_records": 0,
            "total_shards": 0
        }
        
        for node_id, node_index in self.nodes.items():
            node_stats = node_index.get_statistics()
            cluster_stats["nodes"][node_id] = node_stats
            cluster_stats["total_records"] += node_stats["total_records"]
            cluster_stats["total_shards"] += node_stats["total_shards"]
        
        return cluster_stats


def demo_distributed_search():
    """演示分布式搜索"""
    print("=== 分布式搜索演示 ===")
    
    # 创建分布式搜索集群
    cluster = DistributedSearch(num_nodes=4)
    
    # 生成测试数据
    print("生成测试数据...")
    test_records = []
    for i in range(200000):  # 20万条测试数据
        key = f"dist_key_{i:07d}"
        value = f"分布式测试数据第{i}条，存储在某个节点上"
        test_records.append(DataRecord(key, value))
    
    # 分布数据
    start_time = time.time()
    cluster.distribute_data(test_records)
    distribute_time = time.time() - start_time
    print(f"数据分布耗时: {distribute_time:.2f}秒")
    
    # 集群统计信息
    stats = cluster.get_statistics()
    print(f"\n集群统计:")
    print(f"  总节点数: {stats['num_nodes']}")
    print(f"  总记录数: {stats['total_records']}")
    print(f"  总分片数: {stats['total_shards']}")
    for node_id, node_stats in stats['nodes'].items():
        print(f"  节点{node_id}: {node_stats['total_records']} 条记录")
    
    # 单个搜索测试
    test_keys = ["dist_key_0001000", "dist_key_0100000", "dist_key_0199999", "dist_key_9999999"]
    print("\n单个搜索测试:")
    for key in test_keys:
        start_time = time.time()
        result = cluster.search(key)
        search_time = (time.time() - start_time) * 1000
        if result:
            print(f"找到 {key}: {result.value[:50]}... (耗时: {search_time:.3f}ms)")
        else:
            print(f"未找到 {key} (耗时: {search_time:.3f}ms)")
    
    # 批量搜索测试
    batch_keys = [f"dist_key_{i:07d}" for i in range(0, 200000, 20000)]  # 每2万个取一个
    print(f"\n批量搜索 {len(batch_keys)} 个key:")
    start_time = time.time()
    batch_results = cluster.batch_search(batch_keys)
    batch_time = time.time() - start_time
    found_count = sum(1 for r in batch_results.values() if r is not None)
    print(f"找到 {found_count}/{len(batch_keys)} 条记录，耗时: {batch_time:.2f}秒")
    print(f"平均每次搜索: {(batch_time * 1000) / len(batch_keys):.3f}ms")


def performance_comparison():
    """性能对比测试"""
    print("\n" + "="*60)
    print("性能对比测试")
    print("="*60)
    
    # 准备测试数据
    print("准备测试数据...")
    test_size = 100000  # 10万条数据
    test_records = []
    for i in range(test_size):
        key = f"perf_key_{i:07d}"
        value = f"性能测试数据第{i}条，用于对比不同算法的搜索效率"
        test_records.append(DataRecord(key, value))
    
    # 准备搜索keys
    search_keys = [f"perf_key_{i:07d}" for i in range(0, test_size, 1000)]  # 每1000个取一个
    non_exist_keys = [f"missing_{i}" for i in range(100)]  # 100个不存在的key
    
    algorithms = {}
    
    # 1. 分片哈希索引
    print("\n1. 测试分片哈希索引...")
    hash_index = ShardedHashIndex("/workspace/perf_hash", num_shards=128)
    start_time = time.time()
    hash_index.insert_batch(test_records)
    build_time = time.time() - start_time
    
    start_time = time.time()
    hash_results = hash_index.batch_search(search_keys)
    search_time = time.time() - start_time
    
    algorithms["分片哈希索引"] = {
        "build_time": build_time,
        "search_time": search_time,
        "found_count": sum(1 for r in hash_results.values() if r is not None)
    }
    hash_index.close()
    
    # 2. 外部排序搜索
    print("2. 测试外部排序搜索...")
    sorted_index = ExternalSortedSearch("/workspace/perf_sorted")
    start_time = time.time()
    sorted_index.build_sorted_index(test_records)
    build_time = time.time() - start_time
    
    start_time = time.time()
    sorted_results = 0
    for key in search_keys:
        result = sorted_index.search(key)
        if result:
            sorted_results += 1
    search_time = time.time() - start_time
    
    algorithms["外部排序搜索"] = {
        "build_time": build_time,
        "search_time": search_time,
        "found_count": sorted_results
    }
    
    # 3. 布隆过滤器搜索
    print("3. 测试布隆过滤器搜索...")
    bloom_index = BloomFilterSearch("/workspace/perf_bloom", capacity=test_size)
    start_time = time.time()
    bloom_index.build_index(test_records)
    build_time = time.time() - start_time
    
    # 测试存在的key和不存在的key
    all_test_keys = search_keys + non_exist_keys
    start_time = time.time()
    bloom_results = bloom_index.batch_search(all_test_keys)
    search_time = time.time() - start_time
    
    algorithms["布隆过滤器搜索"] = {
        "build_time": build_time,
        "search_time": search_time,
        "found_count": sum(1 for r in bloom_results.values() if r is not None)
    }
    
    # 4. 分布式搜索
    print("4. 测试分布式搜索...")
    dist_cluster = DistributedSearch(num_nodes=4, base_dir="/workspace/perf_dist")
    start_time = time.time()
    dist_cluster.distribute_data(test_records)
    build_time = time.time() - start_time
    
    start_time = time.time()
    dist_results = dist_cluster.batch_search(search_keys)
    search_time = time.time() - start_time
    
    algorithms["分布式搜索"] = {
        "build_time": build_time,
        "search_time": search_time,
        "found_count": sum(1 for r in dist_results.values() if r is not None)
    }
    
    # 输出对比结果
    print(f"\n性能对比结果 (数据量: {test_size:,} 条, 搜索: {len(search_keys)} 次):")
    print("-" * 80)
    print(f"{'算法':<15} {'构建时间(s)':<12} {'搜索时间(s)':<12} {'找到记录':<10} {'平均搜索(ms)':<15}")
    print("-" * 80)
    
    for name, metrics in algorithms.items():
        avg_search = (metrics["search_time"] * 1000) / len(search_keys)
        print(f"{name:<15} {metrics['build_time']:<12.2f} {metrics['search_time']:<12.3f} "
              f"{metrics['found_count']:<10} {avg_search:<15.3f}")
    
    print("-" * 80)
    print("\n算法选择建议:")
    print("• 分片哈希索引: 最快的精确匹配，适合高并发查询")
    print("• 外部排序搜索: 支持范围查询，内存使用少")
    print("• 布隆过滤器搜索: 快速排除不存在数据，节省I/O")
    print("• 分布式搜索: 线性扩展，适合超大规模数据")


def scalability_test():
    """可扩展性测试 - 测试不同数据规模下的性能"""
    print("\n" + "="*60)
    print("可扩展性测试")
    print("="*60)
    
    data_sizes = [10000, 50000, 100000, 500000]  # 不同数据规模
    
    for size in data_sizes:
        print(f"\n测试数据规模: {size:,} 条记录")
        print("-" * 40)
        
        # 生成测试数据
        test_records = []
        for i in range(size):
            key = f"scale_key_{i:08d}"
            value = f"可扩展性测试数据第{i}条"
            test_records.append(DataRecord(key, value))
        
        # 测试分片哈希索引
        hash_index = ShardedHashIndex(f"/workspace/scale_hash_{size}", num_shards=max(64, size//1000))
        
        # 构建时间
        start_time = time.time()
        hash_index.insert_batch(test_records)
        build_time = time.time() - start_time
        
        # 搜索时间（搜索100个随机key）
        search_keys = [f"scale_key_{i:08d}" for i in range(0, size, max(1, size//100))][:100]
        start_time = time.time()
        results = hash_index.batch_search(search_keys)
        search_time = time.time() - start_time
        
        found_count = sum(1 for r in results.values() if r is not None)
        
        print(f"构建时间: {build_time:.2f}秒")
        print(f"搜索时间: {search_time:.3f}秒 (100次搜索)")
        print(f"平均搜索: {(search_time * 1000) / 100:.3f}ms")
        print(f"找到记录: {found_count}/100")
        print(f"吞吐量: {size / build_time:.0f} 条/秒 (构建)")
        print(f"QPS: {100 / search_time:.0f} 次/秒 (搜索)")
        
        hash_index.close()


def memory_usage_analysis():
    """内存使用分析（简化版，不依赖psutil）"""
    print("\n" + "="*60)
    print("内存使用分析")
    print("="*60)
    
    import gc
    import sys
    
    # 测试不同算法的理论内存使用
    test_size = 100000
    test_records = []
    for i in range(test_size):
        key = f"mem_key_{i:07d}"
        value = f"内存测试数据第{i}条，包含一些额外的内容用于测试内存占用情况"
        test_records.append(DataRecord(key, value))
    
    # 估算单个记录的内存占用
    sample_record = test_records[0]
    record_size = sys.getsizeof(sample_record.key) + sys.getsizeof(sample_record.value) + sys.getsizeof(sample_record.metadata)
    
    print(f"单个记录估算内存: {record_size} 字节")
    print(f"总数据理论内存: {(record_size * test_size) / 1024 / 1024:.1f} MB")
    
    algorithms_info = {
        "分片哈希索引": {
            "内存特点": "每个分片维护哈希表索引",
            "内存占用": "中等（索引 + 数据引用）",
            "估算倍数": 1.5
        },
        "外部排序搜索": {
            "内存特点": "主要存储排序后的索引数组",
            "内存占用": "较低（仅索引结构）",
            "估算倍数": 0.3
        },
        "布隆过滤器搜索": {
            "内存特点": "布隆过滤器位数组 + 分片哈希",
            "内存占用": "中等（位数组 + 索引）",
            "估算倍数": 1.2
        },
        "分布式搜索": {
            "内存特点": "分布到多个节点，单节点内存较少",
            "内存占用": "低（单节点）",
            "估算倍数": 0.4
        }
    }
    
    print(f"\n各算法内存使用特点 (数据量: {test_size:,} 条):")
    print("-" * 70)
    print(f"{'算法':<15} {'内存特点':<25} {'估算内存(MB)':<12} {'内存占用':<10}")
    print("-" * 70)
    
    base_memory_mb = (record_size * test_size) / 1024 / 1024
    for name, info in algorithms_info.items():
        estimated_memory = base_memory_mb * info["估算倍数"]
        print(f"{name:<15} {info['内存特点']:<25} {estimated_memory:>8.1f} {info['内存占用']:<10}")
    
    print("-" * 70)
    print("\n内存优化建议:")
    print("• 大数据量时优先选择外部排序或分布式搜索")
    print("• 内存充足时可选择分片哈希索引获得最佳性能")
    print("• 布隆过滤器适合读多写少的场景")
    print("• 分布式搜索可通过增加节点数量线性降低单节点内存压力")


def main():
    """主函数"""
    print("分布式搜索和性能测试演示")
    print("="*60)
    
    try:
        # 分布式搜索演示
        demo_distributed_search()
        
        # 性能对比测试
        performance_comparison()
        
        # 可扩展性测试
        scalability_test()
        
        # 内存使用分析
        memory_usage_analysis()
        
        print(f"\n{'='*60}")
        print("所有测试完成！")
        print("\n几十亿数据搜索算法总结:")
        print("1. 分片哈希索引 - 最快的精确匹配，O(1)时间复杂度")
        print("2. 外部排序搜索 - 支持范围查询，内存友好，O(log n)时间复杂度")
        print("3. 布隆过滤器 - 快速排除不存在数据，显著减少I/O")
        print("4. 分布式搜索 - 水平扩展，线性处理能力提升")
        print("\n实际应用建议:")
        print("• 精确匹配 + 高并发: 分片哈希索引")
        print("• 范围查询 + 内存受限: 外部排序搜索")
        print("• 存在性判断 + 读多写少: 布隆过滤器")
        print("• 超大规模数据: 分布式搜索")
        print("• 混合场景: 组合使用多种算法")
        
    except Exception as e:
        print(f"测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()