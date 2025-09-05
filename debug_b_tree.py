#!/usr/bin/env python3
"""
调试B+树实现
"""

from big_data_search import BPlusTreeSearch

def debug_b_tree():
    """调试B+树"""
    print("调试B+树实现")
    print("-" * 30)
    
    # 创建B+树
    b_tree = BPlusTreeSearch(order=3)  # 使用小的order便于调试
    
    # 插入少量数据
    test_data = [
        ("key_001", "value_001"),
        ("key_002", "value_002"),
        ("key_003", "value_003"),
        ("key_004", "value_004"),
        ("key_005", "value_005"),
        ("key_006", "value_006"),
        ("key_007", "value_007"),
    ]
    
    print("插入数据:")
    for i, (key, value) in enumerate(test_data):
        print(f"\n插入 {key}: {value}")
        b_tree.insert(key, value)
        
        # 打印树结构
        print(f"  根节点类型: {'叶子' if b_tree.root.is_leaf else '内部'}")
        print(f"  根节点键数: {len(b_tree.root.keys)}")
        if b_tree.root.is_leaf:
            print(f"  根节点值数: {len(b_tree.root.values)}")
        else:
            print(f"  根节点子节点数: {len(b_tree.root.children)}")
    
    print("\n查找数据:")
    for key, value in test_data:
        result = b_tree.search(key)
        print(f"  查找 {key}: {'找到' if result.found else '未找到'} - {result.value}")

if __name__ == "__main__":
    debug_b_tree()