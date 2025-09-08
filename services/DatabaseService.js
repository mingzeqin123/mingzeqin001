const mysql = require('mysql2/promise');
const winston = require('winston');

class DatabaseService {
  constructor(logger) {
    this.logger = logger;
    this.connection = null;
    this.pool = null;
    this.init();
  }

  async init() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });

      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      this.logger.info('数据库连接池初始化成功');
    } catch (error) {
      this.logger.error('数据库连接失败:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      this.logger.error('数据库查询失败:', { sql, params, error: error.message });
      throw error;
    }
  }

  async getTableData(tableName, options = {}) {
    const {
      limit = 1000,
      offset = 0,
      where = '',
      orderBy = 'id',
      orderDirection = 'ASC'
    } = options;

    let sql = `SELECT * FROM ${tableName}`;
    const params = [];

    if (where) {
      sql += ` WHERE ${where}`;
    }

    sql += ` ORDER BY ${orderBy} ${orderDirection}`;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    return await this.query(sql, params);
  }

  async getTableSchema(tableName) {
    const sql = `DESCRIBE ${tableName}`;
    return await this.query(sql);
  }

  async getTableCount(tableName, where = '') {
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    const result = await this.query(sql);
    return result[0].count;
  }

  async getAggregatedData(tableName, aggregationConfig) {
    const {
      groupBy = [],
      selectFields = ['*'],
      where = '',
      having = '',
      orderBy = '',
      limit = 1000
    } = aggregationConfig;

    let sql = 'SELECT ';
    
    // 添加选择字段
    if (selectFields.includes('*')) {
      sql += '*';
    } else {
      sql += selectFields.join(', ');
    }

    // 添加聚合函数
    if (aggregationConfig.aggregations) {
      const aggFields = aggregationConfig.aggregations.map(agg => 
        `${agg.function}(${agg.field}) as ${agg.alias}`
      );
      if (selectFields.includes('*')) {
        sql = sql.replace('*', '*') + ', ' + aggFields.join(', ');
      } else {
        sql += ', ' + aggFields.join(', ');
      }
    }

    sql += ` FROM ${tableName}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.join(', ')}`;
    }

    if (having) {
      sql += ` HAVING ${having}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    this.logger.info(`执行聚合查询: ${sql}`);
    return await this.query(sql);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('数据库连接池已关闭');
    }
  }
}

module.exports = DatabaseService;