/**
 * API服务模块测试
 */

const ApiService = require('../../src/modules/api/apiService');

describe('ApiService', () => {
    let apiService;

    beforeEach(() => {
        apiService = new ApiService({
            baseURL: 'https://api.example.com',
            timeout: 5000
        });
    });

    describe('初始化', () => {
        test('应该正确初始化API服务', () => {
            expect(apiService).toBeDefined();
            expect(apiService.baseURL).toBe('https://api.example.com');
            expect(apiService.timeout).toBe(5000);
            expect(apiService.headers).toBeDefined();
        });

        test('应该设置默认请求头', () => {
            expect(apiService.headers['Content-Type']).toBe('application/json');
            expect(apiService.headers['User-Agent']).toBeDefined();
        });
    });

    describe('配置管理', () => {
        test('应该能够设置基础URL', () => {
            apiService.setBaseURL('https://new-api.example.com');
            expect(apiService.baseURL).toBe('https://new-api.example.com');
        });

        test('应该能够设置请求头', () => {
            const newHeaders = { 'Authorization': 'Bearer token' };
            apiService.setHeaders(newHeaders);
            
            expect(apiService.headers.Authorization).toBe('Bearer token');
        });

        test('应该能够设置超时时间', () => {
            apiService.setTimeout(10000);
            expect(apiService.timeout).toBe(10000);
        });
    });

    describe('拦截器', () => {
        test('应该能够添加请求拦截器', () => {
            const interceptor = jest.fn((options, data) => ({ options, data }));
            apiService.addRequestInterceptor(interceptor);
            
            expect(apiService.interceptors.request).toContain(interceptor);
        });

        test('应该能够添加响应拦截器', () => {
            const interceptor = jest.fn((response) => response);
            apiService.addResponseInterceptor(interceptor);
            
            expect(apiService.interceptors.response).toContain(interceptor);
        });

        test('应该应用请求拦截器', () => {
            const interceptor = jest.fn((options, data) => ({
                options: { ...options, headers: { ...options.headers, 'X-Custom': 'value' } },
                data
            }));
            
            apiService.addRequestInterceptor(interceptor);
            
            const result = apiService.applyRequestInterceptors(
                { headers: {} },
                { test: 'data' }
            );
            
            expect(interceptor).toHaveBeenCalled();
            expect(result.headers['X-Custom']).toBe('value');
        });

        test('应该应用响应拦截器', () => {
            const interceptor = jest.fn((response) => ({
                ...response,
                processed: true
            }));
            
            apiService.addResponseInterceptor(interceptor);
            
            const response = { status: 200, data: 'test' };
            const result = apiService.applyResponseInterceptors(response);
            
            expect(interceptor).toHaveBeenCalledWith(response);
            expect(result.processed).toBe(true);
        });
    });

    describe('响应数据解析', () => {
        test('应该解析JSON响应', () => {
            const data = '{"name": "test", "value": 123}';
            const contentType = 'application/json';
            
            const result = apiService.parseResponseData(data, contentType);
            
            expect(result).toEqual({ name: 'test', value: 123 });
        });

        test('应该处理无效JSON', () => {
            const data = 'invalid json';
            const contentType = 'application/json';
            
            const result = apiService.parseResponseData(data, contentType);
            
            expect(result).toBe('invalid json');
        });

        test('应该处理非JSON响应', () => {
            const data = 'plain text response';
            const contentType = 'text/plain';
            
            const result = apiService.parseResponseData(data, contentType);
            
            expect(result).toBe('plain text response');
        });

        test('应该处理XML响应', () => {
            const data = '<xml>test</xml>';
            const contentType = 'application/xml';
            
            const result = apiService.parseResponseData(data, contentType);
            
            expect(result).toBe('<xml>test</xml>');
        });

        test('应该处理无内容类型的响应', () => {
            const data = 'some data';
            
            const result = apiService.parseResponseData(data);
            
            expect(result).toBe('some data');
        });
    });

    describe('静态方法', () => {
        test('应该能够创建API实例', () => {
            const instance = ApiService.create({
                baseURL: 'https://test.com',
                timeout: 3000
            });
            
            expect(instance).toBeInstanceOf(ApiService);
            expect(instance.baseURL).toBe('https://test.com');
            expect(instance.timeout).toBe(3000);
        });
    });

    // 注意：以下测试需要模拟HTTP请求，在实际项目中应该使用nock或类似的库
    describe('HTTP请求方法', () => {
        // 这些测试在真实环境中会失败，因为没有网络连接
        // 在实际项目中应该使用HTTP模拟库
        test.skip('应该能够发送GET请求', async () => {
            // 这个测试需要HTTP模拟
            const response = await apiService.get('/test');
            expect(response).toBeDefined();
        });

        test.skip('应该能够发送POST请求', async () => {
            // 这个测试需要HTTP模拟
            const data = { name: 'test' };
            const response = await apiService.post('/test', data);
            expect(response).toBeDefined();
        });

        test.skip('应该能够发送PUT请求', async () => {
            // 这个测试需要HTTP模拟
            const data = { name: 'updated' };
            const response = await apiService.put('/test/1', data);
            expect(response).toBeDefined();
        });

        test.skip('应该能够发送DELETE请求', async () => {
            // 这个测试需要HTTP模拟
            const response = await apiService.delete('/test/1');
            expect(response).toBeDefined();
        });
    });
});