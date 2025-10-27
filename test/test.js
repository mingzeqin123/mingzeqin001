const request = require('supertest');
const app = require('../server');

describe('数据汇总服务测试', () => {
  test('健康检查接口', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });

  test('获取任务状态接口', async () => {
    const response = await request(app)
      .get('/status')
      .expect(200);
    
    expect(response.body.status).toBeDefined();
    expect(response.body.isRunning).toBeDefined();
  });

  test('手动触发汇总接口', async () => {
    const response = await request(app)
      .post('/aggregate')
      .expect(200);
    
    expect(response.body.success).toBeDefined();
    expect(response.body.message).toBeDefined();
  });
});