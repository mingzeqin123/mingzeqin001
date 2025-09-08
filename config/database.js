module.exports = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test_db',
    charset: 'utf8mb4',
    timezone: '+08:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  },
  
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+08:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  }
};