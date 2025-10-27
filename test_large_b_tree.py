#!/usr/bin/env python3
"""
测试B+树在大数据集上的表现
"""

from big_data_search import BPlusTreeSearch, generate_test_data

def test_large_b_tree():
    """测试B+树在大数据集上的表现"""
    print("测试B+树大数据集表现")
    print("-" * 40)
    
    # 生成测试数据
    test_data = generate_test_data(1000)
    search_key = test_data[500][0]  # 选择一个存在的键
    
    print(f"数据量: {len(test_data):,} 条")
    print(f"查找键: {search_key}")
    print()
    
    # 创建B+树
    b_tree = BPlusTreeSearch(order=10)
    
    # 插入数据
    print("插入数据...")
    for i, (key, value) in enumerate(test_data):
        b_tree.insert(key, value)
        if (i + 1) % 100 == 0:
            print(f"  已插入 {i + 1:,} 条数据")
    
    print("插入完成")
    print()
    
    # 查找数据
    print("查找数据...")
    result = b_tree.search(search_key)
    print(f"查找结果: {'找到' if result.found else '未找到'}")
    print(f"查找耗时: {result.search_time:.6f}秒")
    if result.found:
        print(f"找到的值: {result.value}")
    
    # 测试多个查找
    print("\n测试多个查找...")
    test_keys = [test_data[i][0] for i in range(0, len(test_data), 100)]
    found_count = 0
    
    for key in test_keys:
        result = b_tree.search(key)
        if result.found:
            found_count += 1
    
    print(f"测试 {len(test_keys)} 个键，找到 {found_count} 个")

if __name__ == "__main__":
    test_large_b_tree()