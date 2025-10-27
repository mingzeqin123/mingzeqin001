#!/usr/bin/env python3
"""
测试B+树实现
"""

from big_data_search import BPlusTreeSearch

def test_b_tree():
    """测试B+树"""
    print("测试B+树实现")
    print("-" * 30)
    
    # 创建B+树
    b_tree = BPlusTreeSearch(order=5)
    
    # 插入测试数据
    test_data = [
        ("key_001", "value_001"),
        ("key_002", "value_002"),
        ("key_003", "value_003"),
        ("key_004", "value_004"),
        ("key_005", "value_005"),
    ]
    
    print("插入数据:")
    for key, value in test_data:
        b_tree.insert(key, value)
        print(f"  插入 {key}: {value}")
    
    print("\n查找数据:")
    for key, value in test_data:
        result = b_tree.search(key)
        print(f"  查找 {key}: {'找到' if result.found else '未找到'} - {result.value}")
    
    # 测试不存在的键
    result = b_tree.search("key_999")
    print(f"  查找不存在的键: {'找到' if result.found else '未找到'}")

if __name__ == "__main__":
    test_b_tree()