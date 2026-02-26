/**
 * LRU (Least Recently Used) 缓存实现
 * 通过「哈希表 + 双向链表」保证 get/put 操作复杂度为 O(1)
 */

class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  /**
   * @param {number} capacity 缓存容量，必须为正整数
   */
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('LRUCache capacity must be a positive integer');
    }

    this.capacity = capacity;
    this.cache = new Map();

    // 使用哨兵节点简化边界处理
    this.head = new Node('__HEAD__', null);
    this.tail = new Node('__TAIL__', null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 获取缓存值。命中时将该节点提升为最近使用。
   * @param {string|number} key
   * @returns {*|undefined} 未命中返回 undefined
   */
  get(key) {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    this._moveToHead(node);
    return node.value;
  }

  /**
   * 写入缓存。若 key 已存在则更新并提升为最近使用；
   * 若容量超限则淘汰最久未使用节点。
   * @param {string|number} key
   * @param {*} value
   */
  put(key, value) {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.value = value;
      this._moveToHead(existingNode);
      return;
    }

    const newNode = new Node(key, value);
    this.cache.set(key, newNode);
    this._addToHead(newNode);

    if (this.cache.size > this.capacity) {
      const lruNode = this._removeTail();
      if (lruNode) {
        this.cache.delete(lruNode.key);
      }
    }
  }

  /**
   * 判断 key 是否存在（不会改变使用顺序）
   * @param {string|number} key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * 删除指定 key
   * @param {string|number} key
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this._removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 当前缓存数量
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * 按「最近使用 -> 最久未使用」返回 key 列表
   * @returns {Array}
   */
  keys() {
    const result = [];
    let current = this.head.next;
    while (current && current !== this.tail) {
      result.push(current.key);
      current = current.next;
    }
    return result;
  }

  _addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  _removeTail() {
    const node = this.tail.prev;
    if (node === this.head) {
      return null;
    }

    this._removeNode(node);
    return node;
  }
}

module.exports = LRUCache;
