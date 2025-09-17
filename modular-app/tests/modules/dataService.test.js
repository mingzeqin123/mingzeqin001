/**
 * 数据服务模块测试
 */

const DataService = require('../../src/modules/data/dataService');

describe('DataService', () => {
    let dataService;

    beforeEach(() => {
        dataService = new DataService();
    });

    describe('数据存储', () => {
        test('应该能够存储字符串数据', async () => {
            const result = await dataService.store('test:string', 'hello world');
            
            expect(result.success).toBe(true);
            expect(result.key).toBe('test:string');
            expect(result.dataType).toBe('string');
        });

        test('应该能够存储对象数据', async () => {
            const data = { name: 'test', value: 123 };
            const result = await dataService.store('test:object', data);
            
            expect(result.success).toBe(true);
            expect(result.dataType).toBe('object');
        });

        test('应该能够存储数组数据', async () => {
            const data = [1, 2, 3, 'test'];
            const result = await dataService.store('test:array', data);
            
            expect(result.success).toBe(true);
            expect(result.dataType).toBe('array');
        });

        test('应该能够存储数值数据', async () => {
            const result = await dataService.store('test:number', 42);
            
            expect(result.success).toBe(true);
            expect(result.dataType).toBe('number');
        });

        test('应该能够存储布尔数据', async () => {
            const result = await dataService.store('test:boolean', true);
            
            expect(result.success).toBe(true);
            expect(result.dataType).toBe('boolean');
        });

        test('应该支持TTL选项', async () => {
            const result = await dataService.store('test:ttl', 'data', { ttl: 1000 });
            
            expect(result.success).toBe(true);
        });

        test('应该支持元数据', async () => {
            const metadata = { category: 'test', priority: 'high' };
            const result = await dataService.store('test:metadata', 'data', { metadata });
            
            expect(result.success).toBe(true);
        });
    });

    describe('数据获取', () => {
        beforeEach(async () => {
            await dataService.store('test:get', { value: 'test data' });
        });

        test('应该能够获取存储的数据', async () => {
            const result = await dataService.get('test:get');
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ value: 'test data' });
        });

        test('应该返回不存在的数据错误', async () => {
            const result = await dataService.get('nonexistent:key');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('不存在');
        });

        test('应该返回元数据', async () => {
            const metadata = { category: 'test' };
            await dataService.store('test:metadata', 'data', { metadata });
            
            const result = await dataService.get('test:metadata');
            
            expect(result.success).toBe(true);
            expect(result.metadata).toEqual(metadata);
        });
    });

    describe('数据删除', () => {
        beforeEach(async () => {
            await dataService.store('test:delete', 'data to delete');
        });

        test('应该能够删除数据', async () => {
            const result = await dataService.delete('test:delete');
            
            expect(result.success).toBe(true);
            
            // 验证数据已被删除
            const getResult = await dataService.get('test:delete');
            expect(getResult.success).toBe(false);
        });

        test('应该返回删除不存在数据的错误', async () => {
            const result = await dataService.delete('nonexistent:key');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('不存在');
        });
    });

    describe('数据查询', () => {
        beforeEach(async () => {
            // 存储测试数据
            await dataService.store('user:1', { name: 'Alice', role: 'admin' }, { 
                metadata: { type: 'user', category: 'admin' } 
            });
            await dataService.store('user:2', { name: 'Bob', role: 'user' }, { 
                metadata: { type: 'user', category: 'regular' } 
            });
            await dataService.store('config:theme', 'dark', { 
                metadata: { type: 'config' } 
            });
        });

        test('应该能够查询所有数据', async () => {
            const result = await dataService.query();
            
            expect(result.success).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);
        });

        test('应该能够按类型过滤', async () => {
            const result = await dataService.query({ type: 'object' });
            
            expect(result.success).toBe(true);
            expect(result.data.every(item => item.type === 'object')).toBe(true);
        });

        test('应该能够按元数据过滤', async () => {
            const result = await dataService.query({ 
                metadata: { type: 'user' } 
            });
            
            expect(result.success).toBe(true);
            expect(result.data.every(item => item.metadata.type === 'user')).toBe(true);
        });

        test('应该支持分页', async () => {
            const result = await dataService.query({ limit: 2, offset: 0 });
            
            expect(result.success).toBe(true);
            expect(result.data.length).toBeLessThanOrEqual(2);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.limit).toBe(2);
            expect(result.pagination.offset).toBe(0);
        });
    });

    describe('数据分析', () => {
        beforeEach(async () => {
            await dataService.store('test:array', [1, 2, 3, 'test', true]);
            await dataService.store('test:object', { a: 1, b: 'test', c: true });
            await dataService.store('test:string', 'hello world');
            await dataService.store('test:number', 42);
        });

        test('应该能够分析数组数据', async () => {
            const result = await dataService.analyze('test:array');
            
            expect(result.success).toBe(true);
            expect(result.analysis.type).toBe('array');
            expect(result.analysis.length).toBe(5);
            expect(result.analysis.elementTypes).toBeDefined();
        });

        test('应该能够分析对象数据', async () => {
            const result = await dataService.analyze('test:object');
            
            expect(result.success).toBe(true);
            expect(result.analysis.type).toBe('object');
            expect(result.analysis.keys).toEqual(['a', 'b', 'c']);
            expect(result.analysis.keyCount).toBe(3);
        });

        test('应该能够分析字符串数据', async () => {
            const result = await dataService.analyze('test:string');
            
            expect(result.success).toBe(true);
            expect(result.analysis.type).toBe('string');
            expect(result.analysis.length).toBe(11);
            expect(result.analysis.wordCount).toBe(2);
        });

        test('应该能够分析数值数据', async () => {
            const result = await dataService.analyze('test:number');
            
            expect(result.success).toBe(true);
            expect(result.analysis.type).toBe('number');
            expect(result.analysis.isInteger).toBe(true);
            expect(result.analysis.isPositive).toBe(true);
        });

        test('应该返回不存在数据的错误', async () => {
            const result = await dataService.analyze('nonexistent:key');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('不存在');
        });
    });

    describe('数据清理', () => {
        test('应该能够清理过期数据', async () => {
            // 存储一个会立即过期的数据
            await dataService.store('test:expired', 'data', { ttl: 1 });
            
            // 等待过期
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const result = await dataService.cleanup();
            
            expect(result.success).toBe(true);
        });
    });

    describe('统计信息', () => {
        beforeEach(async () => {
            await dataService.store('test:1', 'data1');
            await dataService.store('test:2', 'data2');
            await dataService.store('test:3', { data: 'object' });
        });

        test('应该能够获取统计信息', () => {
            const stats = dataService.getStats();
            
            expect(stats.totalItems).toBe(3);
            expect(stats.totalSize).toBeGreaterThan(0);
            expect(stats.typeDistribution).toBeDefined();
            expect(stats.oldestItem).toBeDefined();
            expect(stats.newestItem).toBeDefined();
        });
    });
});