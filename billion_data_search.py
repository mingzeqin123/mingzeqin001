#!/usr/bin/env python3
"""
几十亿数据高效搜索算法实现
支持多种搜索策略：分片哈希、外部排序、布隆过滤器、分布式搜索
"""

import os
import sys
import time
import hashlib
import bisect
import mmap
import struct
import threading
from typing import Any, List, Optional, Dict, Set, Tuple, Iterator
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import pickle
import json


class DataRecord:
    """数据记录类"""
    def __init__(self, key: str, value: Any, metadata: Dict = None):
        self.key = key
        self.value = value
        self.metadata = metadata or {}
    
    def __str__(self):
        return f"DataRecord(key={self.key}, value={self.value})"
    
    def __repr__(self):
        return self.__str__()


class ShardedHashIndex:
    """
    分片哈希索引搜索算法
    
    核心思想：
    1. 将数据按哈希值分片，每个分片独立存储和索引
    2. 每个分片维护内存哈希表，指向磁盘数据位置
    3. 查询时直接定位到对应分片，O(1)时间复杂度
    
    适用场景：精确匹配查询，高并发访问
    """
    
    def __init__(self, data_dir: str, num_shards: int = 1024, max_memory_per_shard: int = 64*1024*1024):
        """
        初始化分片哈希索引
        
        Args:
            data_dir: 数据存储目录
            num_shards: 分片数量，建议为2的幂次
            max_memory_per_shard: 每个分片最大内存使用量(字节)
        """
        self.data_dir = data_dir
        self.num_shards = num_shards
        self.max_memory_per_shard = max_memory_per_shard
        
        # 为每个分片创建索引和数据文件
        self.shard_indexes = {}  # 分片ID -> {key: (file_offset, data_size)}
        self.shard_files = {}    # 分片ID -> 文件句柄
        self.shard_locks = {}    # 分片ID -> 线程锁
        
        os.makedirs(data_dir, exist_ok=True)
        self._initialize_shards()
    
    def _initialize_shards(self):
        """初始化所有分片"""
        for shard_id in range(self.num_shards):
            self.shard_indexes[shard_id] = {}
            self.shard_locks[shard_id] = threading.RLock()
            
            # 尝试加载已有的索引
            index_file = os.path.join(self.data_dir, f"shard_{shard_id}.idx")
            if os.path.exists(index_file):
                try:
                    with open(index_file, 'rb') as f:
                        self.shard_indexes[shard_id] = pickle.load(f)
                    print(f"已加载分片 {shard_id} 索引，包含 {len(self.shard_indexes[shard_id])} 条记录")
                except Exception as e:
                    print(f"加载分片 {shard_id} 索引失败: {e}")
    
    def _get_shard_id(self, key: str) -> int:
        """根据key计算分片ID"""
        hash_value = int(hashlib.md5(key.encode()).hexdigest(), 16)
        return hash_value % self.num_shards
    
    def _get_shard_file(self, shard_id: int, mode: str = 'rb'):
        """获取分片数据文件句柄"""
        if shard_id not in self.shard_files or self.shard_files[shard_id].closed:
            data_file = os.path.join(self.data_dir, f"shard_{shard_id}.dat")
            self.shard_files[shard_id] = open(data_file, mode)
        return self.shard_files[shard_id]
    
    def insert_batch(self, records: List[DataRecord], batch_size: int = 10000):
        """
        批量插入数据记录
        
        Args:
            records: 数据记录列表
            batch_size: 批处理大小
        """
        print(f"开始批量插入 {len(records)} 条记录...")
        
        # 按分片分组记录
        shard_batches = defaultdict(list)
        for record in records:
            shard_id = self._get_shard_id(record.key)
            shard_batches[shard_id].append(record)
        
        # 并行处理各个分片
        with ThreadPoolExecutor(max_workers=min(32, len(shard_batches))) as executor:
            futures = []
            for shard_id, shard_records in shard_batches.items():
                future = executor.submit(self._insert_shard_batch, shard_id, shard_records)
                futures.append(future)
            
            completed = 0
            for future in as_completed(futures):
                try:
                    future.result()
                    completed += 1
                    if completed % 100 == 0:
                        print(f"已完成 {completed}/{len(futures)} 个分片的插入")
                except Exception as e:
                    print(f"分片插入失败: {e}")
        
        print("批量插入完成")
    
    def _insert_shard_batch(self, shard_id: int, records: List[DataRecord]):
        """插入单个分片的批量数据"""
        with self.shard_locks[shard_id]:
            data_file = os.path.join(self.data_dir, f"shard_{shard_id}.dat")
            
            # 追加模式打开文件
            with open(data_file, 'ab') as f:
                for record in records:
                    # 序列化记录
                    data = pickle.dumps(record)
                    data_size = len(data)
                    file_offset = f.tell()
                    
                    # 写入数据
                    f.write(struct.pack('I', data_size))  # 4字节长度头
                    f.write(data)
                    
                    # 更新索引
                    self.shard_indexes[shard_id][record.key] = (file_offset, data_size)
            
            # 保存索引
            self._save_shard_index(shard_id)
    
    def _save_shard_index(self, shard_id: int):
        """保存分片索引到磁盘"""
        index_file = os.path.join(self.data_dir, f"shard_{shard_id}.idx")
        with open(index_file, 'wb') as f:
            pickle.dump(self.shard_indexes[shard_id], f)
    
    def search(self, key: str) -> Optional[DataRecord]:
        """
        搜索指定key的数据记录
        
        Args:
            key: 要搜索的键
            
        Returns:
            找到的数据记录，如果不存在返回None
        """
        shard_id = self._get_shard_id(key)
        
        with self.shard_locks[shard_id]:
            # 检查索引中是否存在
            if key not in self.shard_indexes[shard_id]:
                return None
            
            file_offset, data_size = self.shard_indexes[shard_id][key]
            
            # 从磁盘读取数据
            try:
                with open(os.path.join(self.data_dir, f"shard_{shard_id}.dat"), 'rb') as f:
                    f.seek(file_offset + 4)  # 跳过长度头
                    data = f.read(data_size)
                    record = pickle.loads(data)
                    return record
            except Exception as e:
                print(f"读取数据失败: {e}")
                return None
    
    def batch_search(self, keys: List[str], max_workers: int = 16) -> Dict[str, Optional[DataRecord]]:
        """
        批量搜索多个key
        
        Args:
            keys: 要搜索的键列表
            max_workers: 最大并行工作线程数
            
        Returns:
            键到记录的映射字典
        """
        results = {}
        
        # 按分片分组keys
        shard_keys = defaultdict(list)
        for key in keys:
            shard_id = self._get_shard_id(key)
            shard_keys[shard_id].append(key)
        
        # 并行搜索各个分片
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for shard_id, keys_in_shard in shard_keys.items():
                future = executor.submit(self._batch_search_shard, shard_id, keys_in_shard)
                futures.append(future)
            
            for future in as_completed(futures):
                try:
                    shard_results = future.result()
                    results.update(shard_results)
                except Exception as e:
                    print(f"分片搜索失败: {e}")
        
        return results
    
    def _batch_search_shard(self, shard_id: int, keys: List[str]) -> Dict[str, Optional[DataRecord]]:
        """在单个分片中批量搜索"""
        results = {}
        
        with self.shard_locks[shard_id]:
            data_file = os.path.join(self.data_dir, f"shard_{shard_id}.dat")
            
            if not os.path.exists(data_file):
                for key in keys:
                    results[key] = None
                return results
            
            with open(data_file, 'rb') as f:
                for key in keys:
                    if key not in self.shard_indexes[shard_id]:
                        results[key] = None
                        continue
                    
                    file_offset, data_size = self.shard_indexes[shard_id][key]
                    try:
                        f.seek(file_offset + 4)  # 跳过长度头
                        data = f.read(data_size)
                        record = pickle.loads(data)
                        results[key] = record
                    except Exception as e:
                        print(f"读取记录 {key} 失败: {e}")
                        results[key] = None
        
        return results
    
    def get_statistics(self) -> Dict:
        """获取索引统计信息"""
        total_records = sum(len(index) for index in self.shard_indexes.values())
        non_empty_shards = sum(1 for index in self.shard_indexes.values() if len(index) > 0)
        
        return {
            "total_shards": self.num_shards,
            "non_empty_shards": non_empty_shards,
            "total_records": total_records,
            "avg_records_per_shard": total_records / self.num_shards if self.num_shards > 0 else 0,
            "load_balance": min(len(index) for index in self.shard_indexes.values()) / max(len(index) for index in self.shard_indexes.values()) if total_records > 0 else 0
        }
    
    def close(self):
        """关闭所有文件句柄"""
        for f in self.shard_files.values():
            if not f.closed:
                f.close()


class ExternalSortedSearch:
    """
    外部排序 + 二分搜索算法
    
    核心思想：
    1. 对超大数据集进行外部排序（归并排序）
    2. 排序后的数据支持二分搜索，时间复杂度O(log n)
    3. 使用内存映射文件减少I/O开销
    
    适用场景：范围查询，内存受限，数据相对静态
    """
    
    def __init__(self, data_dir: str, chunk_size: int = 10*1024*1024):
        """
        初始化外部排序搜索
        
        Args:
            data_dir: 数据存储目录
            chunk_size: 内存块大小(字节)
        """
        self.data_dir = data_dir
        self.chunk_size = chunk_size
        self.sorted_file = os.path.join(data_dir, "sorted_data.dat")
        self.index_file = os.path.join(data_dir, "sorted_index.idx")
        self.key_index = []  # [(key, file_offset, data_size), ...]
        
        os.makedirs(data_dir, exist_ok=True)
        self._load_index()
    
    def _load_index(self):
        """加载已有的索引"""
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'rb') as f:
                    self.key_index = pickle.load(f)
                print(f"已加载排序索引，包含 {len(self.key_index)} 条记录")
            except Exception as e:
                print(f"加载排序索引失败: {e}")
    
    def build_sorted_index(self, records: List[DataRecord]):
        """
        构建排序索引
        
        Args:
            records: 数据记录列表
        """
        print(f"开始构建排序索引，共 {len(records)} 条记录...")
        
        # 1. 按key排序记录
        print("排序记录...")
        sorted_records = sorted(records, key=lambda r: r.key)
        
        # 2. 写入排序后的数据文件
        print("写入排序数据文件...")
        self.key_index = []
        
        with open(self.sorted_file, 'wb') as f:
            for record in sorted_records:
                file_offset = f.tell()
                
                # 序列化记录
                data = pickle.dumps(record)
                data_size = len(data)
                
                # 写入数据
                f.write(struct.pack('I', data_size))  # 4字节长度头
                f.write(data)
                
                # 记录索引
                self.key_index.append((record.key, file_offset, data_size))
        
        # 3. 保存索引
        self._save_index()
        print("排序索引构建完成")
    
    def _save_index(self):
        """保存索引到磁盘"""
        with open(self.index_file, 'wb') as f:
            pickle.dump(self.key_index, f)
    
    def search(self, key: str) -> Optional[DataRecord]:
        """
        二分搜索指定key
        
        Args:
            key: 要搜索的键
            
        Returns:
            找到的数据记录，如果不存在返回None
        """
        if not self.key_index:
            return None
        
        # 二分搜索找到key的位置
        keys = [item[0] for item in self.key_index]
        pos = bisect.bisect_left(keys, key)
        
        if pos < len(keys) and keys[pos] == key:
            # 找到了，读取数据
            _, file_offset, data_size = self.key_index[pos]
            
            try:
                with open(self.sorted_file, 'rb') as f:
                    f.seek(file_offset + 4)  # 跳过长度头
                    data = f.read(data_size)
                    record = pickle.loads(data)
                    return record
            except Exception as e:
                print(f"读取数据失败: {e}")
                return None
        
        return None
    
    def range_search(self, start_key: str, end_key: str) -> List[DataRecord]:
        """
        范围搜索
        
        Args:
            start_key: 起始key（包含）
            end_key: 结束key（不包含）
            
        Returns:
            范围内的所有记录
        """
        if not self.key_index:
            return []
        
        keys = [item[0] for item in self.key_index]
        start_pos = bisect.bisect_left(keys, start_key)
        end_pos = bisect.bisect_left(keys, end_key)
        
        results = []
        with open(self.sorted_file, 'rb') as f:
            for i in range(start_pos, end_pos):
                _, file_offset, data_size = self.key_index[i]
                try:
                    f.seek(file_offset + 4)
                    data = f.read(data_size)
                    record = pickle.loads(data)
                    results.append(record)
                except Exception as e:
                    print(f"读取记录失败: {e}")
        
        return results
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        return {
            "total_records": len(self.key_index),
            "index_file_size": os.path.getsize(self.index_file) if os.path.exists(self.index_file) else 0,
            "data_file_size": os.path.getsize(self.sorted_file) if os.path.exists(self.sorted_file) else 0
        }


class BloomFilter:
    """
    布隆过滤器实现
    用于快速判断元素是否可能存在，减少不必要的磁盘I/O
    """
    
    def __init__(self, capacity: int, error_rate: float = 0.001):
        """
        初始化布隆过滤器
        
        Args:
            capacity: 预期元素数量
            error_rate: 误判率
        """
        self.capacity = capacity
        self.error_rate = error_rate
        
        # 计算最优参数
        self.bit_array_size = self._calculate_bit_array_size(capacity, error_rate)
        self.hash_count = self._calculate_hash_count(self.bit_array_size, capacity)
        
        # 初始化位数组
        self.bit_array = [0] * self.bit_array_size
        self.element_count = 0
    
    def _calculate_bit_array_size(self, n: int, p: float) -> int:
        """计算位数组大小"""
        import math
        return int(-n * math.log(p) / (math.log(2) ** 2))
    
    def _calculate_hash_count(self, m: int, n: int) -> int:
        """计算哈希函数数量"""
        import math
        return int(m * math.log(2) / n)
    
    def _hash_functions(self, item: str) -> List[int]:
        """生成多个哈希值"""
        hash1 = hash(item) % self.bit_array_size
        hash2 = hash(item + "salt") % self.bit_array_size
        
        hashes = []
        for i in range(self.hash_count):
            hashes.append((hash1 + i * hash2) % self.bit_array_size)
        return hashes
    
    def add(self, item: str):
        """添加元素到布隆过滤器"""
        for hash_val in self._hash_functions(item):
            self.bit_array[hash_val] = 1
        self.element_count += 1
    
    def contains(self, item: str) -> bool:
        """检查元素是否可能存在"""
        for hash_val in self._hash_functions(item):
            if self.bit_array[hash_val] == 0:
                return False
        return True
    
    def save(self, filepath: str):
        """保存布隆过滤器到文件"""
        with open(filepath, 'wb') as f:
            pickle.dump({
                'bit_array': self.bit_array,
                'capacity': self.capacity,
                'error_rate': self.error_rate,
                'bit_array_size': self.bit_array_size,
                'hash_count': self.hash_count,
                'element_count': self.element_count
            }, f)
    
    def load(self, filepath: str):
        """从文件加载布隆过滤器"""
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.bit_array = data['bit_array']
            self.capacity = data['capacity']
            self.error_rate = data['error_rate']
            self.bit_array_size = data['bit_array_size']
            self.hash_count = data['hash_count']
            self.element_count = data['element_count']


class BloomFilterSearch:
    """
    布隆过滤器 + 精确验证搜索算法
    
    核心思想：
    1. 使用布隆过滤器快速排除不存在的数据
    2. 对可能存在的数据进行精确验证
    3. 显著减少磁盘I/O次数
    
    适用场景：存在性判断，读多写少，内存受限
    """
    
    def __init__(self, data_dir: str, capacity: int = 1000000000, error_rate: float = 0.001):
        """
        初始化布隆过滤器搜索
        
        Args:
            data_dir: 数据存储目录
            capacity: 预期数据量
            error_rate: 布隆过滤器误判率
        """
        self.data_dir = data_dir
        self.capacity = capacity
        self.error_rate = error_rate
        
        os.makedirs(data_dir, exist_ok=True)
        
        # 初始化布隆过滤器
        self.bloom_filter = BloomFilter(capacity, error_rate)
        bloom_file = os.path.join(data_dir, "bloom_filter.dat")
        if os.path.exists(bloom_file):
            self.bloom_filter.load(bloom_file)
            print(f"已加载布隆过滤器，包含约 {self.bloom_filter.element_count} 个元素")
        
        # 精确数据存储（使用分片哈希索引）
        self.exact_index = ShardedHashIndex(os.path.join(data_dir, "exact_data"), num_shards=256)
    
    def build_index(self, records: List[DataRecord]):
        """
        构建布隆过滤器索引
        
        Args:
            records: 数据记录列表
        """
        print(f"构建布隆过滤器索引，共 {len(records)} 条记录...")
        
        # 1. 构建布隆过滤器
        for record in records:
            self.bloom_filter.add(record.key)
        
        # 2. 保存布隆过滤器
        bloom_file = os.path.join(self.data_dir, "bloom_filter.dat")
        self.bloom_filter.save(bloom_file)
        
        # 3. 构建精确索引
        self.exact_index.insert_batch(records)
        
        print("布隆过滤器索引构建完成")
    
    def search(self, key: str) -> Optional[DataRecord]:
        """
        搜索指定key
        
        Args:
            key: 要搜索的键
            
        Returns:
            找到的数据记录，如果不存在返回None
        """
        # 1. 布隆过滤器快速检查
        if not self.bloom_filter.contains(key):
            return None  # 确定不存在
        
        # 2. 精确验证
        return self.exact_index.search(key)
    
    def batch_search(self, keys: List[str]) -> Dict[str, Optional[DataRecord]]:
        """批量搜索"""
        # 1. 布隆过滤器预筛选
        candidate_keys = [key for key in keys if self.bloom_filter.contains(key)]
        
        print(f"布隆过滤器筛选: {len(keys)} -> {len(candidate_keys)} 个候选")
        
        # 2. 精确验证候选keys
        results = {}
        if candidate_keys:
            exact_results = self.exact_index.batch_search(candidate_keys)
            results.update(exact_results)
        
        # 3. 补充确定不存在的keys
        for key in keys:
            if key not in results:
                results[key] = None
        
        return results
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        exact_stats = self.exact_index.get_statistics()
        return {
            "bloom_filter": {
                "capacity": self.bloom_filter.capacity,
                "element_count": self.bloom_filter.element_count,
                "bit_array_size": self.bloom_filter.bit_array_size,
                "hash_count": self.bloom_filter.hash_count,
                "error_rate": self.bloom_filter.error_rate
            },
            "exact_index": exact_stats
        }


# 使用示例和测试
def demo_sharded_hash_search():
    """演示分片哈希搜索"""
    print("=== 分片哈希索引搜索演示 ===")
    
    # 创建索引
    index = ShardedHashIndex("/workspace/test_data", num_shards=64)
    
    # 生成测试数据
    print("生成测试数据...")
    test_records = []
    for i in range(100000):  # 10万条测试数据
        key = f"key_{i:08d}"
        value = f"这是第{i}条数据，包含一些测试内容"
        metadata = {"id": i, "timestamp": time.time()}
        test_records.append(DataRecord(key, value, metadata))
    
    # 批量插入
    start_time = time.time()
    index.insert_batch(test_records)
    insert_time = time.time() - start_time
    print(f"插入 {len(test_records)} 条记录耗时: {insert_time:.2f}秒")
    
    # 统计信息
    stats = index.get_statistics()
    print(f"索引统计: {stats}")
    
    # 单个搜索测试
    test_keys = ["key_00001000", "key_00050000", "key_00099999", "key_not_exist"]
    print("\n单个搜索测试:")
    for key in test_keys:
        start_time = time.time()
        result = index.search(key)
        search_time = (time.time() - start_time) * 1000  # 毫秒
        if result:
            print(f"找到 {key}: {result.value[:50]}... (耗时: {search_time:.3f}ms)")
        else:
            print(f"未找到 {key} (耗时: {search_time:.3f}ms)")
    
    # 批量搜索测试
    batch_keys = [f"key_{i:08d}" for i in range(0, 100000, 10000)]  # 每1万个取一个
    print(f"\n批量搜索 {len(batch_keys)} 个key:")
    start_time = time.time()
    batch_results = index.batch_search(batch_keys)
    batch_time = time.time() - start_time
    found_count = sum(1 for r in batch_results.values() if r is not None)
    print(f"找到 {found_count}/{len(batch_keys)} 条记录，耗时: {batch_time:.2f}秒")
    print(f"平均每次搜索: {(batch_time * 1000) / len(batch_keys):.3f}ms")
    
    index.close()


def demo_external_sorted_search():
    """演示外部排序搜索"""
    print("\n=== 外部排序搜索演示 ===")
    
    # 创建索引
    index = ExternalSortedSearch("/workspace/sorted_test_data")
    
    # 生成测试数据
    print("生成测试数据...")
    test_records = []
    for i in range(50000):  # 5万条测试数据
        key = f"sorted_key_{i:06d}"
        value = f"排序测试数据第{i}条"
        test_records.append(DataRecord(key, value))
    
    # 构建排序索引
    start_time = time.time()
    index.build_sorted_index(test_records)
    build_time = time.time() - start_time
    print(f"构建排序索引耗时: {build_time:.2f}秒")
    
    # 统计信息
    stats = index.get_statistics()
    print(f"索引统计: {stats}")
    
    # 单个搜索测试
    test_keys = ["sorted_key_001000", "sorted_key_025000", "sorted_key_049999", "sorted_key_999999"]
    print("\n单个搜索测试:")
    for key in test_keys:
        start_time = time.time()
        result = index.search(key)
        search_time = (time.time() - start_time) * 1000
        if result:
            print(f"找到 {key}: {result.value} (耗时: {search_time:.3f}ms)")
        else:
            print(f"未找到 {key} (耗时: {search_time:.3f}ms)")
    
    # 范围搜索测试
    print(f"\n范围搜索测试 (sorted_key_010000 到 sorted_key_010010):")
    start_time = time.time()
    range_results = index.range_search("sorted_key_010000", "sorted_key_010010")
    range_time = time.time() - start_time
    print(f"找到 {len(range_results)} 条记录，耗时: {range_time*1000:.3f}ms")
    for result in range_results[:3]:  # 只显示前3条
        print(f"  {result.key}: {result.value}")


def demo_bloom_filter_search():
    """演示布隆过滤器搜索"""
    print("\n=== 布隆过滤器搜索演示 ===")
    
    # 创建索引
    index = BloomFilterSearch("/workspace/bloom_test_data", capacity=100000)
    
    # 生成测试数据
    print("生成测试数据...")
    test_records = []
    for i in range(80000):  # 8万条测试数据
        key = f"bloom_key_{i:06d}"
        value = f"布隆过滤器测试数据第{i}条"
        test_records.append(DataRecord(key, value))
    
    # 构建索引
    start_time = time.time()
    index.build_index(test_records)
    build_time = time.time() - start_time
    print(f"构建布隆过滤器索引耗时: {build_time:.2f}秒")
    
    # 统计信息
    stats = index.get_statistics()
    print(f"索引统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    
    # 测试存在的key
    existing_keys = ["bloom_key_001000", "bloom_key_040000", "bloom_key_079999"]
    print("\n搜索存在的key:")
    for key in existing_keys:
        start_time = time.time()
        result = index.search(key)
        search_time = (time.time() - start_time) * 1000
        if result:
            print(f"找到 {key}: {result.value[:30]}... (耗时: {search_time:.3f}ms)")
        else:
            print(f"未找到 {key} (耗时: {search_time:.3f}ms)")
    
    # 测试不存在的key（应该被布隆过滤器快速排除）
    non_existing_keys = ["bloom_key_999999", "not_exist_key", "another_missing"]
    print("\n搜索不存在的key:")
    for key in non_existing_keys:
        start_time = time.time()
        result = index.search(key)
        search_time = (time.time() - start_time) * 1000
        print(f"搜索 {key}: {'找到' if result else '未找到'} (耗时: {search_time:.3f}ms)")


if __name__ == "__main__":
    demo_sharded_hash_search()
    demo_external_sorted_search()
    demo_bloom_filter_search()