// 测试环境设置
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_NAME = 'coupon_system_test';
process.env.LOG_LEVEL = 'error';

// 全局测试超时
jest.setTimeout(30000);

// 模拟日期
const mockDate = new Date('2023-01-01T00:00:00.000Z');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new Date(...args);
  }
  
  static now() {
    return mockDate.getTime();
  }
};