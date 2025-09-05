#!/usr/bin/env python3
"""
几十亿数据查找算法演示脚本
"""

import sys
import time
import random
from big_data_search import (
    HashTableSearch, BPlusTreeSearch, BloomFilterSearch, 
    ExternalSortSearch, DatabaseSearch, generate_test_data
)


def demo_basic_algorithms():
    """演示基础算法"""
    print("=== 基础查找算法演示 ===\n")
    
    # 生成测试数据
    print("生成测试数据...")
    test_data = generate_test_data(10000)
    search_key = test_data[5000][0]  # 选择一个存在的键
    
    print(f"测试数据量: {len(test_data):,} 条")
    print(f"查找键: {search_key}")
    print("-" * 50)
    
    # 1. 哈希表查找
    print("1. 哈希表查找:")
    hash_table = HashTableSearch(capacity=20000)
    
    # 插入数据
    for key, value in test_data:
        hash_table.insert(key, value)
    
    # 查找
    result = hash_table.search(search_key)
    print(f"   结果: {'找到' if result.found else '未找到'}")
    print(f"   耗时: {result.search_time:.6f}秒")
    if result.found:
        print(f"   值: {result.value}")
    print()
    
    # 2. B+树查找
    print("2. B+树查找:")
    b_tree = BPlusTreeSearch(order=50)
    
    # 插入数据
    for key, value in test_data:
        b_tree.insert(key, value)
    
    # 查找
    result = b_tree.search(search_key)
    print(f"   结果: {'找到' if result.found else '未找到'}")
    print(f"   耗时: {result.search_time:.6f}秒")
    if result.found:
        print(f"   值: {result.value}")
    print()
    
    # 3. 布隆过滤器查找
    print("3. 布隆过滤器查找:")
    bloom_filter = BloomFilterSearch(expected_items=20000, false_positive_rate=0.01)
    
    # 添加数据
    for key, value in test_data:
        bloom_filter.add(key, value)
    
    # 查找
    result = bloom_filter.search(search_key)
    print(f"   结果: {'找到' if result.found else '未找到'}")
    print(f"   耗时: {result.search_time:.6f}秒")
    if result.found:
        print(f"   值: {result.value}")
    print()
    
    # 4. 数据库查找
    print("4. 数据库查找:")
    db_search = DatabaseSearch("demo.db")
    
    # 插入数据
    for key, value in test_data:
        db_search.insert(key, value)
    
    # 查找
    result = db_search.search(search_key)
    print(f"   结果: {'找到' if result.found else '未找到'}")
    print(f"   耗时: {result.search_time:.6f}秒")
    if result.found:
        print(f"   值: {result.value}")
    
    # 清理
    db_search.close()
    import os
    if os.path.exists("demo.db"):
        os.remove("demo.db")
    print()


def demo_performance_comparison():
    """性能比较演示"""
    print("=== 性能比较演示 ===\n")
    
    # 不同数据量的测试
    test_sizes = [1000, 10000, 100000]
    
    for size in test_sizes:
        print(f"数据量: {size:,} 条")
        print("-" * 30)
        
        # 生成测试数据
        test_data = generate_test_data(size)
        search_keys = [test_data[i][0] for i in range(0, size, size // 10)]  # 选择10个键进行查找
        
        # 测试哈希表
        print("哈希表:")
        hash_table = HashTableSearch(capacity=size * 2)
        for key, value in test_data:
            hash_table.insert(key, value)
        
        start_time = time.time()
        for key in search_keys:
            hash_table.search(key)
        hash_time = time.time() - start_time
        print(f"  总耗时: {hash_time:.6f}秒")
        print(f"  平均每次: {hash_time/len(search_keys):.6f}秒")
        print()
        
        # 测试B+树
        print("B+树:")
        b_tree = BPlusTreeSearch(order=100)
        for key, value in test_data:
            b_tree.insert(key, value)
        
        start_time = time.time()
        for key in search_keys:
            b_tree.search(key)
        btree_time = time.time() - start_time
        print(f"  总耗时: {btree_time:.6f}秒")
        print(f"  平均每次: {btree_time/len(search_keys):.6f}秒")
        print()
        
        # 测试布隆过滤器
        print("布隆过滤器:")
        bloom_filter = BloomFilterSearch(expected_items=size * 2, false_positive_rate=0.01)
        for key, value in test_data:
            bloom_filter.add(key, value)
        
        start_time = time.time()
        for key in search_keys:
            bloom_filter.search(key)
        bloom_time = time.time() - start_time
        print(f"  总耗时: {bloom_time:.6f}秒")
        print(f"  平均每次: {bloom_time/len(search_keys):.6f}秒")
        print()
        
        print("=" * 50)
        print()


def demo_external_sort():
    """外部排序演示"""
    print("=== 外部排序查找演示 ===\n")
    
    # 生成测试数据
    test_data = generate_test_data(50000)
    search_key = test_data[25000][0]
    
    print(f"数据量: {len(test_data):,} 条")
    print(f"查找键: {search_key}")
    print("-" * 30)
    
    # 创建外部排序
    external_sort = ExternalSortSearch(chunk_size=10000)
    
    print("创建排序文件...")
    start_time = time.time()
    external_sort.create_sorted_file(test_data)
    sort_time = time.time() - start_time
    print(f"排序耗时: {sort_time:.3f}秒")
    
    # 查找
    print("执行查找...")
    result = external_sort.search(search_key)
    print(f"结果: {'找到' if result.found else '未找到'}")
    print(f"查找耗时: {result.search_time:.6f}秒")
    if result.found:
        print(f"值: {result.value}")
    
    # 清理
    external_sort.cleanup()
    print()


def demo_memory_usage():
    """内存使用演示"""
    print("=== 内存使用分析 ===\n")
    
    import psutil
    import os
    
    def get_memory_usage():
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # MB
    
    # 测试不同数据结构的内存使用
    test_sizes = [10000, 50000, 100000]
    
    for size in test_sizes:
        print(f"数据量: {size:,} 条")
        print("-" * 30)
        
        # 生成测试数据
        test_data = generate_test_data(size)
        
        # 测试哈希表内存使用
        initial_memory = get_memory_usage()
        hash_table = HashTableSearch(capacity=size * 2)
        for key, value in test_data:
            hash_table.insert(key, value)
        hash_memory = get_memory_usage()
        print(f"哈希表内存使用: {hash_memory - initial_memory:.2f} MB")
        
        # 测试B+树内存使用
        initial_memory = get_memory_usage()
        b_tree = BPlusTreeSearch(order=100)
        for key, value in test_data:
            b_tree.insert(key, value)
        btree_memory = get_memory_usage()
        print(f"B+树内存使用: {btree_memory - initial_memory:.2f} MB")
        
        # 测试布隆过滤器内存使用
        initial_memory = get_memory_usage()
        bloom_filter = BloomFilterSearch(expected_items=size * 2, false_positive_rate=0.01)
        for key, value in test_data:
            bloom_filter.add(key, value)
        bloom_memory = get_memory_usage()
        print(f"布隆过滤器内存使用: {bloom_memory - initial_memory:.2f} MB")
        
        print()


def demo_algorithm_recommendations():
    """算法推荐演示"""
    print("=== 算法选择推荐 ===\n")
    
    scenarios = [
        {
            "name": "小数据集 (< 100万条)",
            "description": "数据量较小，可以全部加载到内存",
            "recommendations": [
                "哈希表: O(1)查找时间，适合精确查找",
                "B+树: 支持范围查询和有序遍历",
                "布隆过滤器: 快速判断数据是否存在"
            ]
        },
        {
            "name": "中等数据集 (100万 - 1亿条)",
            "description": "数据量中等，需要考虑内存管理",
            "recommendations": [
                "B+树: 平衡的查找性能和内存使用",
                "数据库: 持久化存储，支持复杂查询",
                "分片哈希表: 将数据分散到多个哈希表"
            ]
        },
        {
            "name": "大数据集 (1亿 - 100亿条)",
            "description": "数据量巨大，需要分布式处理",
            "recommendations": [
                "分布式哈希表: 多节点协作处理",
                "外部排序 + 二分查找: 适合一次性排序多次查找",
                "布隆过滤器 + 数据库: 先用布隆过滤器快速判断"
            ]
        },
        {
            "name": "超大数据集 (> 100亿条)",
            "description": "数据量超大规模，需要特殊处理",
            "recommendations": [
                "分布式存储系统: 如HBase、Cassandra等",
                "搜索引擎: 如Elasticsearch、Solr等",
                "列式存储: 如ClickHouse、Druid等"
            ]
        }
    ]
    
    for scenario in scenarios:
        print(f"场景: {scenario['name']}")
        print(f"描述: {scenario['description']}")
        print("推荐算法:")
        for rec in scenario['recommendations']:
            print(f"  - {rec}")
        print()


def main():
    """主函数"""
    print("几十亿数据查找算法演示")
    print("=" * 50)
    print()
    
    try:
        # 基础算法演示
        demo_basic_algorithms()
        
        # 性能比较
        demo_performance_comparison()
        
        # 外部排序演示
        demo_external_sort()
        
        # 内存使用分析
        try:
            demo_memory_usage()
        except ImportError:
            print("内存使用分析需要psutil库，跳过此演示")
        
        # 算法推荐
        demo_algorithm_recommendations()
        
        print("演示完成！")
        
    except KeyboardInterrupt:
        print("\n演示被用户中断")
    except Exception as e:
        print(f"演示过程中出现错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()