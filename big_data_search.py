#!/usr/bin/env python3
"""
几十亿数据查找算法实现
支持多种查找策略：哈希表、B+树、布隆过滤器、外部排序等
"""

import hashlib
import mmap
import os
import struct
import time
import random
from typing import List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict
import pickle
import sqlite3
import math


@dataclass
class SearchResult:
    """查找结果"""
    found: bool
    value: Any = None
    position: int = -1
    search_time: float = 0.0


class HashTableSearch:
    """基于哈希表的内存查找算法"""
    
    def __init__(self, capacity: int = 1000000):
        self.capacity = capacity
        self.table = {}
        self.load_factor = 0.75
        self.size = 0
    
    def _hash(self, key: str) -> int:
        """计算哈希值"""
        return hash(key) % self.capacity
    
    def insert(self, key: str, value: Any) -> None:
        """插入数据"""
        if self.size >= self.capacity * self.load_factor:
            self._resize()
        
        hash_key = self._hash(key)
        if hash_key not in self.table:
            self.table[hash_key] = []
        
        # 处理哈希冲突（链式法）
        for i, (k, v) in enumerate(self.table[hash_key]):
            if k == key:
                self.table[hash_key][i] = (key, value)
                return
        
        self.table[hash_key].append((key, value))
        self.size += 1
    
    def _resize(self) -> None:
        """扩容哈希表"""
        old_table = self.table
        self.capacity *= 2
        self.table = {}
        self.size = 0
        
        for bucket in old_table.values():
            for key, value in bucket:
                self.insert(key, value)
    
    def search(self, key: str) -> SearchResult:
        """查找数据"""
        start_time = time.time()
        
        hash_key = self._hash(key)
        if hash_key not in self.table:
            return SearchResult(False, search_time=time.time() - start_time)
        
        for k, v in self.table[hash_key]:
            if k == key:
                return SearchResult(True, v, search_time=time.time() - start_time)
        
        return SearchResult(False, search_time=time.time() - start_time)


class BPlusTreeSearch:
    """基于B+树的查找算法"""
    
    def __init__(self, order: int = 100):
        self.order = order
        self.root = BPlusNode(True, order)
    
    def insert(self, key: str, value: Any) -> None:
        """插入数据"""
        result = self.root.insert(key, value)
        if result:
            new_root = BPlusNode(False, self.order)
            new_root.children.append(self.root)
            new_root.keys.append(result[0])
            new_root.children.append(result[1])
            self.root = new_root
    
    def search(self, key: str) -> SearchResult:
        """查找数据"""
        start_time = time.time()
        result = self.root.search(key)
        search_time = time.time() - start_time
        
        if result:
            return SearchResult(True, result, search_time=search_time)
        return SearchResult(False, search_time=search_time)


class BPlusNode:
    """B+树节点"""
    
    def __init__(self, is_leaf: bool, order: int):
        self.is_leaf = is_leaf
        self.order = order
        self.keys = []
        self.values = [] if is_leaf else []
        self.children = [] if not is_leaf else []
        self.next = None  # 叶子节点链表指针
    
    def insert(self, key: str, value: Any) -> Optional[Tuple[str, 'BPlusNode']]:
        """插入键值对"""
        if self.is_leaf:
            return self._insert_leaf(key, value)
        else:
            return self._insert_internal(key, value)
    
    def _insert_leaf(self, key: str, value: Any) -> Optional[Tuple[str, 'BPlusNode']]:
        """叶子节点插入"""
        # 找到插入位置
        pos = 0
        while pos < len(self.keys) and self.keys[pos] < key:
            pos += 1
        
        # 插入键值对
        self.keys.insert(pos, key)
        self.values.insert(pos, value)
        
        # 检查是否需要分裂
        if len(self.keys) > self.order:
            mid = len(self.keys) // 2
            new_node = BPlusNode(True, self.order)
            new_node.keys = self.keys[mid:]
            new_node.values = self.values[mid:]
            self.keys = self.keys[:mid]
            self.values = self.values[:mid]
            new_node.next = self.next
            self.next = new_node
            return (new_node.keys[0], new_node)
        
        return None
    
    def _insert_internal(self, key: str, value: Any) -> Optional[Tuple[str, 'BPlusNode']]:
        """内部节点插入"""
        # 找到子节点
        pos = 0
        while pos < len(self.keys) and self.keys[pos] < key:
            pos += 1
        
        result = self.children[pos].insert(key, value)
        if result:
            # 插入分裂结果
            self.keys.insert(pos, result[0])
            self.children.insert(pos + 1, result[1])
            
            # 检查是否需要分裂
            if len(self.keys) > self.order:
                mid = len(self.keys) // 2
                new_node = BPlusNode(False, self.order)
                new_node.keys = self.keys[mid + 1:]
                new_node.children = self.children[mid + 1:]
                self.keys = self.keys[:mid]
                self.children = self.children[:mid + 1]
                return (self.keys[mid], new_node)
        
        return None
    
    def search(self, key: str) -> Optional[Any]:
        """查找键值"""
        if self.is_leaf:
            # 叶子节点中查找
            for i, k in enumerate(self.keys):
                if k == key:
                    return self.values[i]
            return None
        else:
            # 内部节点中查找子节点
            pos = 0
            while pos < len(self.keys) and self.keys[pos] < key:
                pos += 1
            return self.children[pos].search(key)


class BloomFilterSearch:
    """基于布隆过滤器的查找算法"""
    
    def __init__(self, expected_items: int, false_positive_rate: float = 0.01):
        self.expected_items = expected_items
        self.false_positive_rate = false_positive_rate
        
        # 计算布隆过滤器参数
        self.bit_array_size = int(-(expected_items * math.log(false_positive_rate)) / (math.log(2) ** 2))
        self.hash_count = int((self.bit_array_size / expected_items) * math.log(2))
        
        self.bit_array = [False] * self.bit_array_size
        self.hash_functions = [self._create_hash_function(i) for i in range(self.hash_count)]
        
        # 实际存储的哈希表（用于确认存在的数据）
        self.storage = {}
    
    def _create_hash_function(self, seed: int):
        """创建哈希函数"""
        def hash_func(item):
            hash_obj = hashlib.md5()
            hash_obj.update(f"{item}_{seed}".encode())
            return int(hash_obj.hexdigest(), 16) % self.bit_array_size
        return hash_func
    
    def add(self, key: str, value: Any) -> None:
        """添加数据到布隆过滤器"""
        # 设置布隆过滤器位
        for hash_func in self.hash_functions:
            index = hash_func(key)
            self.bit_array[index] = True
        
        # 存储实际数据
        self.storage[key] = value
    
    def search(self, key: str) -> SearchResult:
        """查找数据"""
        start_time = time.time()
        
        # 首先检查布隆过滤器
        for hash_func in self.hash_functions:
            index = hash_func(key)
            if not self.bit_array[index]:
                # 确定不存在
                return SearchResult(False, search_time=time.time() - start_time)
        
        # 布隆过滤器显示可能存在，检查实际存储
        if key in self.storage:
            return SearchResult(True, self.storage[key], search_time=time.time() - start_time)
        
        return SearchResult(False, search_time=time.time() - start_time)


class ExternalSortSearch:
    """基于外部排序的查找算法"""
    
    def __init__(self, chunk_size: int = 1000000):
        self.chunk_size = chunk_size
        self.sorted_file = "sorted_data.dat"
        self.temp_files = []
    
    def create_sorted_file(self, data: List[Tuple[str, Any]]) -> None:
        """创建排序文件"""
        # 分块排序
        chunks = []
        for i in range(0, len(data), self.chunk_size):
            chunk = data[i:i + self.chunk_size]
            chunk.sort(key=lambda x: x[0])
            chunk_file = f"chunk_{i}.dat"
            self._write_chunk(chunk, chunk_file)
            chunks.append(chunk_file)
            self.temp_files.append(chunk_file)
        
        # 合并排序
        self._merge_chunks(chunks)
    
    def _write_chunk(self, chunk: List[Tuple[str, Any]], filename: str) -> None:
        """写入数据块"""
        with open(filename, 'wb') as f:
            for key, value in chunk:
                # 写入键长度、键、值
                key_bytes = key.encode('utf-8')
                value_bytes = pickle.dumps(value)
                f.write(struct.pack('I', len(key_bytes)))
                f.write(key_bytes)
                f.write(struct.pack('I', len(value_bytes)))
                f.write(value_bytes)
    
    def _merge_chunks(self, chunk_files: List[str]) -> None:
        """合并排序的数据块"""
        with open(self.sorted_file, 'wb') as outfile:
            # 打开所有块文件
            files = []
            for chunk_file in chunk_files:
                files.append(open(chunk_file, 'rb'))
            
            # 读取每个文件的第一个元素
            current_items = []
            for f in files:
                item = self._read_item(f)
                if item:
                    current_items.append((item, f))
            
            # 合并排序
            while current_items:
                # 找到最小的键
                min_item = min(current_items, key=lambda x: x[0][0])
                self._write_item(min_item[0], outfile)
                
                # 读取下一个元素
                next_item = self._read_item(min_item[1])
                if next_item:
                    current_items[current_items.index(min_item)] = (next_item, min_item[1])
                else:
                    current_items.remove(min_item)
                    min_item[1].close()
    
    def _read_item(self, file) -> Optional[Tuple[str, Any]]:
        """读取一个数据项"""
        try:
            # 读取键长度
            key_len_bytes = file.read(4)
            if not key_len_bytes:
                return None
            key_len = struct.unpack('I', key_len_bytes)[0]
            
            # 读取键
            key_bytes = file.read(key_len)
            key = key_bytes.decode('utf-8')
            
            # 读取值长度
            value_len_bytes = file.read(4)
            value_len = struct.unpack('I', value_len_bytes)[0]
            
            # 读取值
            value_bytes = file.read(value_len)
            value = pickle.loads(value_bytes)
            
            return (key, value)
        except:
            return None
    
    def _write_item(self, item: Tuple[str, Any], file) -> None:
        """写入一个数据项"""
        key, value = item
        key_bytes = key.encode('utf-8')
        value_bytes = pickle.dumps(value)
        file.write(struct.pack('I', len(key_bytes)))
        file.write(key_bytes)
        file.write(struct.pack('I', len(value_bytes)))
        file.write(value_bytes)
    
    def search(self, key: str) -> SearchResult:
        """二分查找"""
        start_time = time.time()
        
        with open(self.sorted_file, 'rb') as f:
            # 获取文件大小
            f.seek(0, 2)
            file_size = f.tell()
            f.seek(0)
            
            left = 0
            right = file_size
            
            while left < right:
                mid = (left + right) // 2
                f.seek(mid)
                
                # 找到下一个完整记录的起始位置
                current_key = None
                while mid < file_size:
                    f.seek(mid)
                    if f.read(1) == b'':
                        break
                    f.seek(mid)
                    try:
                        key_len_bytes = f.read(4)
                        if len(key_len_bytes) < 4:
                            break
                        key_len = struct.unpack('I', key_len_bytes)[0]
                        key_bytes = f.read(key_len)
                        if len(key_bytes) < key_len:
                            break
                        current_key = key_bytes.decode('utf-8')
                        break
                    except:
                        mid += 1
                else:
                    break
                
                if current_key is None:
                    break
                    
                if current_key < key:
                    left = mid + 1
                elif current_key > key:
                    right = mid
                else:
                    # 找到匹配的键，读取值
                    value_len_bytes = f.read(4)
                    value_len = struct.unpack('I', value_len_bytes)[0]
                    value_bytes = f.read(value_len)
                    value = pickle.loads(value_bytes)
                    return SearchResult(True, value, search_time=time.time() - start_time)
        
        return SearchResult(False, search_time=time.time() - start_time)
    
    def cleanup(self) -> None:
        """清理临时文件"""
        for temp_file in self.temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        if os.path.exists(self.sorted_file):
            os.remove(self.sorted_file)


class DatabaseSearch:
    """基于数据库的查找算法"""
    
    def __init__(self, db_file: str = "search.db"):
        self.db_file = db_file
        self.conn = sqlite3.connect(db_file)
        self.cursor = self.conn.cursor()
        
        # 创建表
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS data (
                key TEXT PRIMARY KEY,
                value BLOB
            )
        ''')
        
        # 创建索引
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_key ON data(key)')
        self.conn.commit()
    
    def insert(self, key: str, value: Any) -> None:
        """插入数据"""
        value_bytes = pickle.dumps(value)
        self.cursor.execute('INSERT OR REPLACE INTO data (key, value) VALUES (?, ?)', 
                          (key, value_bytes))
        self.conn.commit()
    
    def search(self, key: str) -> SearchResult:
        """查找数据"""
        start_time = time.time()
        
        self.cursor.execute('SELECT value FROM data WHERE key = ?', (key,))
        result = self.cursor.fetchone()
        
        search_time = time.time() - start_time
        
        if result:
            value = pickle.loads(result[0])
            return SearchResult(True, value, search_time=search_time)
        
        return SearchResult(False, search_time=search_time)
    
    def close(self) -> None:
        """关闭数据库连接"""
        self.conn.close()


def generate_test_data(size: int) -> List[Tuple[str, Any]]:
    """生成测试数据"""
    data = []
    for i in range(size):
        key = f"key_{i:010d}"
        value = {
            'id': i,
            'name': f"Item_{i}",
            'value': random.randint(1, 1000000),
            'timestamp': time.time()
        }
        data.append((key, value))
    return data


def benchmark_search_algorithms():
    """性能测试"""
    print("=== 几十亿数据查找算法性能测试 ===\n")
    
    # 测试数据大小（可以根据需要调整）
    test_sizes = [10000, 100000, 1000000]  # 可以根据内存情况调整
    
    for size in test_sizes:
        print(f"测试数据量: {size:,} 条记录")
        print("-" * 50)
        
        # 生成测试数据
        print("生成测试数据...")
        test_data = generate_test_data(size)
        search_key = test_data[size // 2][0]  # 选择中间的一个键进行查找
        
        # 测试哈希表
        print("测试哈希表查找...")
        hash_table = HashTableSearch(capacity=size)
        for key, value in test_data:
            hash_table.insert(key, value)
        
        result = hash_table.search(search_key)
        print(f"哈希表查找结果: {result.found}, 耗时: {result.search_time:.6f}秒")
        
        # 测试B+树
        print("测试B+树查找...")
        b_tree = BPlusTreeSearch(order=100)
        for key, value in test_data:
            b_tree.insert(key, value)
        
        result = b_tree.search(search_key)
        print(f"B+树查找结果: {result.found}, 耗时: {result.search_time:.6f}秒")
        
        # 测试布隆过滤器
        print("测试布隆过滤器查找...")
        bloom_filter = BloomFilterSearch(expected_items=size, false_positive_rate=0.01)
        for key, value in test_data:
            bloom_filter.add(key, value)
        
        result = bloom_filter.search(search_key)
        print(f"布隆过滤器查找结果: {result.found}, 耗时: {result.search_time:.6f}秒")
        
        # 测试数据库
        print("测试数据库查找...")
        db_search = DatabaseSearch(f"test_{size}.db")
        for key, value in test_data:
            db_search.insert(key, value)
        
        result = db_search.search(search_key)
        print(f"数据库查找结果: {result.found}, 耗时: {result.search_time:.6f}秒")
        
        # 测试外部排序（仅对小数据集）
        if size <= 100000:
            print("测试外部排序查找...")
            external_sort = ExternalSortSearch(chunk_size=10000)
            external_sort.create_sorted_file(test_data)
            result = external_sort.search(search_key)
            print(f"外部排序查找结果: {result.found}, 耗时: {result.search_time:.6f}秒")
            external_sort.cleanup()
        
        db_search.close()
        if os.path.exists(f"test_{size}.db"):
            os.remove(f"test_{size}.db")
        
        print()


def demonstrate_usage():
    """演示用法"""
    print("=== 几十亿数据查找算法使用示例 ===\n")
    
    # 创建示例数据
    sample_data = [
        ("user_001", {"name": "张三", "age": 25, "city": "北京"}),
        ("user_002", {"name": "李四", "age": 30, "city": "上海"}),
        ("user_003", {"name": "王五", "age": 28, "city": "广州"}),
        ("user_004", {"name": "赵六", "age": 35, "city": "深圳"}),
        ("user_005", {"name": "钱七", "age": 22, "city": "杭州"}),
    ]
    
    print("示例数据:")
    for key, value in sample_data:
        print(f"  {key}: {value}")
    print()
    
    # 演示哈希表查找
    print("1. 哈希表查找演示:")
    hash_table = HashTableSearch()
    for key, value in sample_data:
        hash_table.insert(key, value)
    
    search_key = "user_003"
    result = hash_table.search(search_key)
    print(f"查找 '{search_key}': {result}")
    print()
    
    # 演示B+树查找
    print("2. B+树查找演示:")
    b_tree = BPlusTreeSearch()
    for key, value in sample_data:
        b_tree.insert(key, value)
    
    result = b_tree.search(search_key)
    print(f"查找 '{search_key}': {result}")
    print()
    
    # 演示布隆过滤器查找
    print("3. 布隆过滤器查找演示:")
    bloom_filter = BloomFilterSearch(expected_items=1000)
    for key, value in sample_data:
        bloom_filter.add(key, value)
    
    result = bloom_filter.search(search_key)
    print(f"查找 '{search_key}': {result}")
    print()
    
    # 演示数据库查找
    print("4. 数据库查找演示:")
    db_search = DatabaseSearch("demo.db")
    for key, value in sample_data:
        db_search.insert(key, value)
    
    result = db_search.search(search_key)
    print(f"查找 '{search_key}': {result}")
    
    db_search.close()
    if os.path.exists("demo.db"):
        os.remove("demo.db")


if __name__ == "__main__":
    # 演示用法
    demonstrate_usage()
    
    # 性能测试
    benchmark_search_algorithms()
    
    print("=== 算法选择建议 ===")
    print("1. 哈希表: 适合内存充足，需要O(1)查找时间的场景")
    print("2. B+树: 适合需要范围查询和有序遍历的场景")
    print("3. 布隆过滤器: 适合需要快速判断数据是否存在的场景")
    print("4. 外部排序: 适合数据量超过内存限制的场景")
    print("5. 数据库: 适合需要持久化存储和复杂查询的场景")
    print("\n对于几十亿数据，推荐组合使用:")
    print("- 布隆过滤器 + 数据库: 先用布隆过滤器快速判断，再用数据库精确查找")
    print("- 外部排序 + 二分查找: 适合一次性排序，多次查找的场景")
    print("- 分布式哈希表: 将数据分散到多个节点，每个节点处理部分数据")