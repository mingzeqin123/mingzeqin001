/**
 * 数据存储模块
 * 提供统一的数据访问接口（模拟数据库操作）
 */
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * 内存数据存储（生产环境应替换为真实数据库）
 */
class MemoryStore {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.data = new Map();
    this.indexes = new Map();
  }

  /**
   * 创建记录
   */
  async create(record) {
    try {
      const id = record.id || uuidv4();
      const recordWithId = { ...record, id };
      
      this.data.set(id, recordWithId);
      this.updateIndexes(recordWithId);
      
      logger.debug(`记录创建成功`, { collection: this.collectionName, id });
      return recordWithId;
    } catch (error) {
      logger.error(`记录创建失败`, { collection: this.collectionName, error: error.message });
      throw error;
    }
  }

  /**
   * 根据ID查找记录
   */
  async findById(id) {
    try {
      const record = this.data.get(id);
      return record || null;
    } catch (error) {
      logger.error(`根据ID查找记录失败`, { collection: this.collectionName, id, error: error.message });
      throw error;
    }
  }

  /**
   * 查找单个记录
   */
  async findOne(filters = {}) {
    try {
      for (const record of this.data.values()) {
        if (this.matchesFilters(record, filters)) {
          return record;
        }
      }
      return null;
    } catch (error) {
      logger.error(`查找单个记录失败`, { collection: this.collectionName, filters, error: error.message });
      throw error;
    }
  }

  /**
   * 查找多个记录
   */
  async findMany(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = {} } = options;
      
      // 过滤记录
      let results = [];
      for (const record of this.data.values()) {
        if (this.matchesFilters(record, filters)) {
          results.push(record);
        }
      }

      // 排序
      if (Object.keys(sort).length > 0) {
        results = this.sortResults(results, sort);
      }

      // 分页
      const total = results.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = results.slice(startIndex, endIndex);

      return {
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`查找多个记录失败`, { collection: this.collectionName, filters, options, error: error.message });
      throw error;
    }
  }

  /**
   * 更新记录
   */
  async update(id, updates) {
    try {
      const existingRecord = this.data.get(id);
      if (!existingRecord) {
        throw new Error(`记录不存在: ${id}`);
      }

      const updatedRecord = { ...existingRecord, ...updates, id };
      this.data.set(id, updatedRecord);
      this.updateIndexes(updatedRecord);

      logger.debug(`记录更新成功`, { collection: this.collectionName, id });
      return updatedRecord;
    } catch (error) {
      logger.error(`记录更新失败`, { collection: this.collectionName, id, error: error.message });
      throw error;
    }
  }

  /**
   * 删除记录
   */
  async delete(id) {
    try {
      const deleted = this.data.delete(id);
      if (deleted) {
        this.removeFromIndexes(id);
        logger.debug(`记录删除成功`, { collection: this.collectionName, id });
      }
      return deleted;
    } catch (error) {
      logger.error(`记录删除失败`, { collection: this.collectionName, id, error: error.message });
      throw error;
    }
  }

  /**
   * 获取记录总数
   */
  async count(filters = {}) {
    try {
      let count = 0;
      for (const record of this.data.values()) {
        if (this.matchesFilters(record, filters)) {
          count++;
        }
      }
      return count;
    } catch (error) {
      logger.error(`获取记录总数失败`, { collection: this.collectionName, filters, error: error.message });
      throw error;
    }
  }

  /**
   * 检查记录是否匹配过滤条件
   */
  matchesFilters(record, filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (key === '$or') {
        // OR 条件
        if (!value.some(orFilter => this.matchesFilters(record, orFilter))) {
          return false;
        }
      } else if (key === '$and') {
        // AND 条件
        if (!value.every(andFilter => this.matchesFilters(record, andFilter))) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (value.$regex) {
          // 正则表达式匹配
          const regex = new RegExp(value.$regex, value.$options || '');
          if (!regex.test(record[key])) {
            return false;
          }
        } else if (value.$in) {
          // 数组包含匹配
          if (!value.$in.includes(record[key])) {
            return false;
          }
        } else if (value.$ne) {
          // 不等于匹配
          if (record[key] === value.$ne) {
            return false;
          }
        }
      } else {
        // 直接值匹配
        if (record[key] !== value) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 排序结果
   */
  sortResults(results, sort) {
    return results.sort((a, b) => {
      for (const [field, order] of Object.entries(sort)) {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return order === 1 ? -1 : 1;
        if (aVal > bVal) return order === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * 更新索引
   */
  updateIndexes(record) {
    // 这里可以实现索引逻辑以提高查询性能
    // 目前为简化实现，暂时跳过
  }

  /**
   * 从索引中移除
   */
  removeFromIndexes(id) {
    // 这里可以实现索引清理逻辑
    // 目前为简化实现，暂时跳过
  }
}

/**
 * 数据存储管理器
 */
export class DataStore {
  constructor() {
    this.users = new MemoryStore('users');
    this.tasks = new MemoryStore('tasks');
    this.sessions = new MemoryStore('sessions');
  }

  /**
   * 初始化数据存储
   */
  async initialize() {
    try {
      logger.info('数据存储初始化开始');
      
      // 这里可以添加数据库连接、迁移等初始化逻辑
      // 对于内存存储，暂时不需要特殊初始化
      
      logger.info('数据存储初始化完成');
    } catch (error) {
      logger.error('数据存储初始化失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 清理数据存储
   */
  async cleanup() {
    try {
      logger.info('数据存储清理开始');
      
      // 清理所有数据
      this.users.data.clear();
      this.tasks.data.clear();
      this.sessions.data.clear();
      
      logger.info('数据存储清理完成');
    } catch (error) {
      logger.error('数据存储清理失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStats() {
    try {
      return {
        users: this.users.data.size,
        tasks: this.tasks.data.size,
        sessions: this.sessions.data.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('获取存储统计信息失败', { error: error.message });
      throw error;
    }
  }
}

export default DataStore;