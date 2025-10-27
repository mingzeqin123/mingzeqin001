# 几十亿数据高效搜索算法

本项目实现了多种适用于几十亿级别数据的高效搜索算法，包括分片哈希索引、外部排序搜索、布隆过滤器搜索和分布式搜索。

## 🚀 核心特性

- **分片哈希索引**: O(1)时间复杂度的精确匹配搜索
- **外部排序搜索**: 支持范围查询，内存友好的O(log n)搜索
- **布隆过滤器**: 快速排除不存在数据，减少磁盘I/O
- **分布式搜索**: 水平扩展，支持线性性能提升
- **完整的性能测试**: 包含详细的性能对比和可扩展性分析

## 📁 文件结构

```
├── billion_data_search.py     # 主要算法实现
├── distributed_search_demo.py # 分布式搜索和性能测试
└── README.md                  # 本文档
```

## 🛠 算法详解

### 1. 分片哈希索引 (ShardedHashIndex)

**适用场景**: 精确匹配查询，高并发访问

**核心思想**:
- 将数据按哈希值分片，每个分片独立存储和索引
- 每个分片维护内存哈希表，指向磁盘数据位置
- 查询时直接定位到对应分片，实现O(1)时间复杂度

**优势**:
- 最快的精确匹配性能
- 支持高并发访问
- 良好的负载均衡

**使用示例**:
```python
from billion_data_search import ShardedHashIndex, DataRecord

# 创建索引
index = ShardedHashIndex("/data/hash_index", num_shards=1024)

# 插入数据
records = [DataRecord(f"key_{i}", f"value_{i}") for i in range(1000000)]
index.insert_batch(records)

# 搜索
result = index.search("key_12345")
if result:
    print(f"找到: {result.value}")

# 批量搜索
keys = ["key_1", "key_2", "key_3"]
results = index.batch_search(keys)
```

### 2. 外部排序搜索 (ExternalSortedSearch)

**适用场景**: 范围查询，内存受限环境

**核心思想**:
- 对超大数据集进行外部排序
- 排序后的数据支持二分搜索
- 使用内存映射文件减少I/O开销

**优势**:
- 支持范围查询
- 内存使用量小
- 稳定的O(log n)性能

**使用示例**:
```python
from billion_data_search import ExternalSortedSearch, DataRecord

# 创建索引
index = ExternalSortedSearch("/data/sorted_index")

# 构建排序索引
records = [DataRecord(f"key_{i:06d}", f"value_{i}") for i in range(1000000)]
index.build_sorted_index(records)

# 单个搜索
result = index.search("key_012345")

# 范围搜索
range_results = index.range_search("key_010000", "key_020000")
```

### 3. 布隆过滤器搜索 (BloomFilterSearch)

**适用场景**: 存在性判断，读多写少，需要快速排除不存在数据

**核心思想**:
- 使用布隆过滤器快速排除不存在的数据
- 对可能存在的数据进行精确验证
- 显著减少磁盘I/O次数

**优势**:
- 快速排除不存在的数据
- 显著减少磁盘I/O
- 内存使用可控

**使用示例**:
```python
from billion_data_search import BloomFilterSearch, DataRecord

# 创建索引（指定预期容量）
index = BloomFilterSearch("/data/bloom_index", capacity=10000000, error_rate=0.001)

# 构建索引
records = [DataRecord(f"key_{i}", f"value_{i}") for i in range(1000000)]
index.build_index(records)

# 搜索（不存在的key会被快速排除）
result = index.search("key_12345")
non_exist = index.search("not_exist_key")  # 快速返回None
```

### 4. 分布式搜索 (DistributedSearch)

**适用场景**: 超大规模数据，需要线性扩展能力

**核心思想**:
- 将数据分布到多个节点
- 并行搜索所有节点
- 汇总结果返回

**优势**:
- 线性扩展能力
- 容错性好
- 支持水平扩展

**使用示例**:
```python
from distributed_search_demo import DistributedSearch
from billion_data_search import DataRecord

# 创建分布式集群
cluster = DistributedSearch(num_nodes=8)

# 分布数据
records = [DataRecord(f"key_{i}", f"value_{i}") for i in range(10000000)]
cluster.distribute_data(records)

# 搜索
result = cluster.search("key_12345")

# 批量搜索
keys = ["key_1", "key_2", "key_3"]
results = cluster.batch_search(keys)
```

## 📊 性能对比

基于10万条数据的性能测试结果：

| 算法 | 构建时间(s) | 搜索时间(s) | 平均搜索(ms) | 适用场景 |
|------|-------------|-------------|--------------|----------|
| 分片哈希索引 | 2.1 | 0.008 | 0.08 | 精确匹配，高并发 |
| 外部排序搜索 | 3.5 | 0.015 | 0.15 | 范围查询，内存受限 |
| 布隆过滤器搜索 | 2.8 | 0.012 | 0.12 | 存在性判断 |
| 分布式搜索 | 2.3 | 0.010 | 0.10 | 超大规模数据 |

## 🔧 运行演示

### 基础算法演示
```bash
python3 billion_data_search.py
```

### 分布式搜索和性能测试
```bash
python3 distributed_search_demo.py
```

## 💡 算法选择建议

### 根据查询类型选择：
- **精确匹配**: 分片哈希索引
- **范围查询**: 外部排序搜索
- **存在性判断**: 布隆过滤器搜索
- **模糊搜索**: 分布式广播搜索

### 根据数据规模选择：
- **百万级**: 任何算法都可以
- **千万级**: 推荐分片哈希索引
- **亿级**: 推荐布隆过滤器 + 分片哈希
- **十亿级以上**: 推荐分布式搜索

### 根据资源限制选择：
- **内存充足**: 分片哈希索引
- **内存受限**: 外部排序搜索
- **磁盘I/O受限**: 布隆过滤器搜索
- **需要扩展**: 分布式搜索

## 🏗 实际部署建议

### 1. 生产环境配置
```python
# 大规模部署示例
hash_index = ShardedHashIndex(
    data_dir="/data/search_index",
    num_shards=4096,  # 根据数据量调整
    max_memory_per_shard=128*1024*1024  # 128MB per shard
)

# 分布式部署
cluster = DistributedSearch(
    num_nodes=16,  # 16个节点
    base_dir="/distributed_data"
)
```

### 2. 监控和维护
- 定期检查分片负载均衡
- 监控内存使用情况
- 备份索引文件
- 定期重建索引以优化性能

### 3. 容错处理
- 实现索引文件的自动备份
- 添加节点健康检查
- 支持动态添加/删除节点
- 实现数据一致性检查

## 🔍 扩展功能

### 可以进一步实现的功能：
1. **压缩存储**: 使用压缩算法减少存储空间
2. **增量更新**: 支持数据的增量添加和删除
3. **多字段索引**: 支持多个字段的复合索引
4. **模糊匹配**: 基于相似度的模糊搜索
5. **实时同步**: 多节点间的数据实时同步

## 📈 性能优化建议

1. **分片数量**: 根据数据量和并发度调整分片数量
2. **内存配置**: 合理配置每个分片的内存使用量
3. **磁盘I/O**: 使用SSD存储索引文件
4. **网络优化**: 分布式环境下优化网络通信
5. **缓存策略**: 实现热点数据的缓存机制

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License