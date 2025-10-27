module.exports = {
  // 默认要汇总的表
  defaultTables: ['users', 'orders', 'products'],
  
  // 表聚合配置
  tableConfigs: {
    users: {
      groupBy: ['status', 'DATE(created_at)'],
      selectFields: ['id', 'username', 'email', 'status', 'created_at'],
      aggregations: [
        { function: 'COUNT', field: 'id', alias: 'user_count' },
        { function: 'AVG', field: 'age', alias: 'avg_age' }
      ],
      where: 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      orderBy: 'created_at DESC',
      limit: 1000
    },
    
    orders: {
      groupBy: ['status', 'DATE(created_at)'],
      selectFields: ['id', 'user_id', 'amount', 'status', 'created_at'],
      aggregations: [
        { function: 'COUNT', field: 'id', alias: 'order_count' },
        { function: 'SUM', field: 'amount', alias: 'total_amount' },
        { function: 'AVG', field: 'amount', alias: 'avg_amount' }
      ],
      where: 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      orderBy: 'created_at DESC',
      limit: 5000
    },
    
    products: {
      groupBy: ['category', 'status'],
      selectFields: ['id', 'name', 'category', 'price', 'status', 'created_at'],
      aggregations: [
        { function: 'COUNT', field: 'id', alias: 'product_count' },
        { function: 'AVG', field: 'price', alias: 'avg_price' },
        { function: 'MAX', field: 'price', alias: 'max_price' },
        { function: 'MIN', field: 'price', alias: 'min_price' }
      ],
      where: 'status = "active"',
      orderBy: 'created_at DESC',
      limit: 2000
    }
  },
  
  // 输出格式配置
  outputFormats: {
    json: {
      enabled: true,
      pretty: true
    },
    csv: {
      enabled: true,
      encoding: 'utf8',
      delimiter: ','
    },
    excel: {
      enabled: true,
      includeMetadata: true
    }
  },
  
  // 文件命名规则
  fileNaming: {
    pattern: '{table}_{timestamp}.{format}',
    timestampFormat: 'YYYYMMDD_HHmmss'
  },
  
  // OSS路径配置
  ossPath: {
    prefix: 'data-aggregation/',
    dateFormat: 'YYYY/MM/DD',
    includeTime: true
  }
};