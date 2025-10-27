#!/usr/bin/env python3
"""
几十亿数据搜索算法 - 快速入门示例
"""

from billion_data_search import ShardedHashIndex, ExternalSortedSearch, BloomFilterSearch, DataRecord
from distributed_search_demo import DistributedSearch
import time


def quick_demo():
    """快速演示各种算法的基本用法"""
    print("几十亿数据搜索算法 - 快速入门")
    print("="*50)
    
    # 准备测试数据
    print("1. 准备测试数据...")
    records = []
    for i in range(10000):  # 1万条测试数据
        key = f"user_{i:06d}"
        value = f"用户{i}的详细信息，包含姓名、年龄、地址等数据"
        metadata = {"id": i, "created_time": time.time()}
        records.append(DataRecord(key, value, metadata))
    
    print(f"   生成了 {len(records)} 条测试数据")
    
    # 1. 分片哈希索引 - 最快的精确匹配
    print("\n2. 分片哈希索引演示（推荐用于高并发精确匹配）")
    hash_index = ShardedHashIndex("/tmp/quick_hash", num_shards=32)
    
    start_time = time.time()
    hash_index.insert_batch(records)
    build_time = time.time() - start_time
    print(f"   构建耗时: {build_time:.2f}秒")
    
    # 搜索测试
    start_time = time.time()
    result = hash_index.search("user_005000")
    search_time = (time.time() - start_time) * 1000
    print(f"   搜索 user_005000: {'找到' if result else '未找到'} (耗时: {search_time:.2f}ms)")
    
    hash_index.close()
    
    # 2. 外部排序搜索 - 支持范围查询
    print("\n3. 外部排序搜索演示（推荐用于范围查询）")
    sorted_index = ExternalSortedSearch("/tmp/quick_sorted")
    
    start_time = time.time()
    sorted_index.build_sorted_index(records)
    build_time = time.time() - start_time
    print(f"   构建耗时: {build_time:.2f}秒")
    
    # 范围搜索测试
    start_time = time.time()
    range_results = sorted_index.range_search("user_005000", "user_005010")
    search_time = (time.time() - start_time) * 1000
    print(f"   范围搜索 user_005000-005010: 找到 {len(range_results)} 条记录 (耗时: {search_time:.2f}ms)")
    
    # 3. 布隆过滤器搜索 - 快速排除不存在数据
    print("\n4. 布隆过滤器搜索演示（推荐用于存在性判断）")
    bloom_index = BloomFilterSearch("/tmp/quick_bloom", capacity=20000)
    
    start_time = time.time()
    bloom_index.build_index(records)
    build_time = time.time() - start_time
    print(f"   构建耗时: {build_time:.2f}秒")
    
    # 测试存在和不存在的数据
    start_time = time.time()
    exist_result = bloom_index.search("user_005000")
    exist_time = (time.time() - start_time) * 1000
    
    start_time = time.time()
    not_exist_result = bloom_index.search("user_999999")
    not_exist_time = (time.time() - start_time) * 1000
    
    print(f"   搜索存在的数据: {'找到' if exist_result else '未找到'} (耗时: {exist_time:.2f}ms)")
    print(f"   搜索不存在的数据: {'找到' if not_exist_result else '未找到'} (耗时: {not_exist_time:.2f}ms)")
    
    # 4. 分布式搜索 - 水平扩展
    print("\n5. 分布式搜索演示（推荐用于超大规模数据）")
    cluster = DistributedSearch(num_nodes=2, base_dir="/tmp/quick_distributed")
    
    start_time = time.time()
    cluster.distribute_data(records)
    build_time = time.time() - start_time
    print(f"   分布耗时: {build_time:.2f}秒")
    
    # 搜索测试
    start_time = time.time()
    result = cluster.search("user_005000")
    search_time = (time.time() - start_time) * 1000
    print(f"   分布式搜索: {'找到' if result else '未找到'} (耗时: {search_time:.2f}ms)")
    
    print(f"\n{'='*50}")
    print("快速演示完成！")
    print("\n算法选择指南:")
    print("• 精确匹配 + 高并发 → 分片哈希索引")
    print("• 范围查询 + 排序需求 → 外部排序搜索")
    print("• 存在性判断 + 减少I/O → 布隆过滤器搜索")
    print("• 超大规模 + 水平扩展 → 分布式搜索")


def performance_comparison_simple():
    """简化的性能对比"""
    print("\n" + "="*50)
    print("性能对比（1万条数据）")
    print("="*50)
    
    # 生成测试数据
    records = []
    for i in range(10000):
        key = f"perf_{i:05d}"
        value = f"性能测试数据{i}"
        records.append(DataRecord(key, value))
    
    # 测试搜索keys
    search_keys = [f"perf_{i:05d}" for i in range(0, 10000, 1000)]  # 10个key
    
    results = {}
    
    # 1. 分片哈希
    hash_index = ShardedHashIndex("/tmp/perf_hash", num_shards=16)
    start_time = time.time()
    hash_index.insert_batch(records)
    build_time = time.time() - start_time
    
    start_time = time.time()
    hash_results = hash_index.batch_search(search_keys)
    search_time = time.time() - start_time
    
    results["分片哈希"] = {
        "构建": build_time,
        "搜索": search_time,
        "找到": sum(1 for r in hash_results.values() if r is not None)
    }
    hash_index.close()
    
    # 2. 外部排序
    sorted_index = ExternalSortedSearch("/tmp/perf_sorted")
    start_time = time.time()
    sorted_index.build_sorted_index(records)
    build_time = time.time() - start_time
    
    start_time = time.time()
    found = 0
    for key in search_keys:
        if sorted_index.search(key):
            found += 1
    search_time = time.time() - start_time
    
    results["外部排序"] = {
        "构建": build_time,
        "搜索": search_time,
        "找到": found
    }
    
    # 3. 布隆过滤器
    bloom_index = BloomFilterSearch("/tmp/perf_bloom", capacity=15000)
    start_time = time.time()
    bloom_index.build_index(records)
    build_time = time.time() - start_time
    
    start_time = time.time()
    bloom_results = bloom_index.batch_search(search_keys)
    search_time = time.time() - start_time
    
    results["布隆过滤器"] = {
        "构建": build_time,
        "搜索": search_time,
        "找到": sum(1 for r in bloom_results.values() if r is not None)
    }
    
    # 输出结果
    print(f"{'算法':<10} {'构建(s)':<8} {'搜索(s)':<8} {'找到':<6} {'平均(ms)':<10}")
    print("-" * 50)
    for name, metrics in results.items():
        avg_time = (metrics["搜索"] * 1000) / len(search_keys)
        print(f"{name:<10} {metrics['构建']:<8.2f} {metrics['搜索']:<8.3f} "
              f"{metrics['找到']:<6} {avg_time:<10.2f}")


if __name__ == "__main__":
    quick_demo()
    performance_comparison_simple()