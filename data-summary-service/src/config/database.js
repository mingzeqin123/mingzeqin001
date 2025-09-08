const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.init();
  }

  init() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000
      });
      
      logger.info('数据库连接池初始化成功');
    } catch (error) {
      logger.error('数据库连接池初始化失败:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('数据库查询失败:', error);
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.getConnection();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('数据库连接池已关闭');
    }
  }
}

module.exports = new DatabaseService();