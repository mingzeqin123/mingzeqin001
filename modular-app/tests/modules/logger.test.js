/**
 * 日志工具模块测试
 */

const Logger = require('../../src/modules/utils/logger');

describe('Logger', () => {
    let logger;

    beforeEach(() => {
        logger = new Logger({ level: 'debug' });
    });

    afterEach(() => {
        logger.clearLogs();
    });

    describe('日志记录', () => {
        test('应该能够记录不同级别的日志', () => {
            logger.error('错误信息');
            logger.warn('警告信息');
            logger.info('信息');
            logger.debug('调试信息');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(4);
        });

        test('应该包含正确的日志级别', () => {
            logger.error('错误信息');
            logger.warn('警告信息');
            logger.info('信息');
            logger.debug('调试信息');

            const logs = logger.getLogs();
            expect(logs[0].level).toBe('ERROR');
            expect(logs[1].level).toBe('WARN');
            expect(logs[2].level).toBe('INFO');
            expect(logs[3].level).toBe('DEBUG');
        });

        test('应该包含时间戳', () => {
            logger.info('测试信息');
            
            const logs = logger.getLogs();
            expect(logs[0].timestamp).toBeDefined();
            expect(new Date(logs[0].timestamp)).toBeInstanceOf(Date);
        });

        test('应该包含元数据', () => {
            const meta = { userId: 123, action: 'login' };
            logger.info('用户登录', meta);
            
            const logs = logger.getLogs();
            expect(logs[0].meta).toEqual(meta);
        });
    });

    describe('日志级别过滤', () => {
        test('应该只记录指定级别及以上的日志', () => {
            logger.setLevel('warn');
            
            logger.error('错误信息');
            logger.warn('警告信息');
            logger.info('信息');
            logger.debug('调试信息');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0].level).toBe('ERROR');
            expect(logs[1].level).toBe('WARN');
        });

        test('应该拒绝无效的日志级别', () => {
            expect(() => {
                logger.setLevel('invalid');
            }).toThrow('无效的日志级别');
        });
    });

    describe('日志查询', () => {
        beforeEach(() => {
            logger.error('错误1');
            logger.warn('警告1');
            logger.info('信息1');
            logger.error('错误2');
            logger.warn('警告2');
        });

        test('应该能够按级别过滤日志', () => {
            const errorLogs = logger.getLogs({ level: 'error' });
            expect(errorLogs).toHaveLength(2);
            expect(errorLogs.every(log => log.level === 'ERROR')).toBe(true);
        });

        test('应该支持分页', () => {
            const logs = logger.getLogs({ limit: 2, offset: 1 });
            expect(logs).toHaveLength(2);
        });

        test('应该返回所有日志当没有过滤条件时', () => {
            const logs = logger.getLogs();
            expect(logs).toHaveLength(5);
        });
    });

    describe('子日志器', () => {
        test('应该能够创建子日志器', () => {
            const childLogger = logger.child('user-service');
            
            expect(childLogger).toBeDefined();
            expect(childLogger).toBeInstanceOf(Logger);
        });

        test('子日志器应该包含名称信息', () => {
            const childLogger = logger.child('user-service');
            childLogger.info('子日志器信息');
            
            const logs = logger.getLogs();
            expect(logs[0].meta.logger).toBe('user-service');
        });

        test('子日志器应该继承父日志器的配置', () => {
            const childLogger = logger.child('user-service');
            
            // 子日志器应该使用相同的级别
            childLogger.debug('调试信息');
            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
        });
    });

    describe('日志清理', () => {
        test('应该能够清空日志', () => {
            logger.info('信息1');
            logger.info('信息2');
            
            expect(logger.getLogs()).toHaveLength(2);
            
            logger.clearLogs();
            
            expect(logger.getLogs()).toHaveLength(0);
        });
    });

    describe('日志格式', () => {
        test('应该包含进程ID', () => {
            logger.info('测试信息');
            
            const logs = logger.getLogs();
            expect(logs[0].pid).toBe(process.pid);
        });

        test('应该包含消息内容', () => {
            const message = '测试消息';
            logger.info(message);
            
            const logs = logger.getLogs();
            expect(logs[0].message).toBe(message);
        });
    });
});