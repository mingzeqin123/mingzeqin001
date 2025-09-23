const request = require('supertest');
const app = require('../src/app');

describe('API Proxy Basic Tests', () => {
  // 基础路由测试
  describe('Basic Routes', () => {
    test('GET / should return server info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });

    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('uptime');
    });

    test('GET /health/detailed should return detailed health info', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('adapters');
    });

    test('GET /config should return configuration', async () => {
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  // API代理路由测试
  describe('API Proxy Routes', () => {
    test('GET /api/info should return adapter information', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
    });

    test('GET /api/health should return adapter health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // 错误处理测试
  describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('path', '/nonexistent');
    });

    test('GET /api/nonexistent should return 404 with adapter info', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  // CORS测试
  describe('CORS', () => {
    test('OPTIONS request should include CORS headers', async () => {
      const response = await request(app)
        .options('/')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  // 安全头测试
  describe('Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // 检查Helmet添加的安全头
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });
  });
});