/**
 * 日志工具模块
 * 提供统一的日志记录功能
 */

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.format = options.format || 'text';
        this.output = options.output || 'console';
        this.logs = [];
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * 记录错误日志
     * @param {string} message - 日志消息
     * @param {Object} meta - 元数据
     */
    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    /**
     * 记录警告日志
     * @param {string} message - 日志消息
     * @param {Object} meta - 元数据
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    /**
     * 记录信息日志
     * @param {string} message - 日志消息
     * @param {Object} meta - 元数据
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    /**
     * 记录调试日志
     * @param {string} message - 日志消息
     * @param {Object} meta - 元数据
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * 记录日志
     * @param {string} level - 日志级别
     * @param {string} message - 日志消息
     * @param {Object} meta - 元数据
     */
    log(level, message, meta = {}) {
        if (this.levels[level] > this.levels[this.level]) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            meta,
            pid: process.pid
        };

        this.logs.push(logEntry);

        if (this.output === 'console') {
            this.outputToConsole(logEntry);
        }
    }

    /**
     * 输出到控制台
     * @param {Object} logEntry - 日志条目
     */
    outputToConsole(logEntry) {
        const { timestamp, level, message, meta } = logEntry;
        
        let output = `[${timestamp}] ${level}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            output += ` ${JSON.stringify(meta)}`;
        }

        switch (level) {
            case 'ERROR':
                console.error(output);
                break;
            case 'WARN':
                console.warn(output);
                break;
            case 'DEBUG':
                console.debug(output);
                break;
            default:
                console.log(output);
        }
    }

    /**
     * 获取日志历史
     * @param {Object} options - 选项
     * @returns {Array} 日志列表
     */
    getLogs(options = {}) {
        const { level, limit = 100, offset = 0 } = options;
        let logs = this.logs;

        if (level) {
            logs = logs.filter(log => log.level === level.toUpperCase());
        }

        return logs.slice(offset, offset + limit);
    }

    /**
     * 清空日志
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * 设置日志级别
     * @param {string} level - 日志级别
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
        } else {
            throw new Error(`无效的日志级别: ${level}`);
        }
    }

    /**
     * 创建子日志器
     * @param {string} name - 子日志器名称
     * @param {Object} options - 选项
     * @returns {Logger} 子日志器
     */
    child(name, options = {}) {
        const childLogger = new Logger({
            ...options,
            level: this.level,
            format: this.format,
            output: this.output
        });

        // 重写log方法以包含子日志器名称
        const originalLog = childLogger.log.bind(childLogger);
        childLogger.log = (level, message, meta = {}) => {
            originalLog(level, message, { ...meta, logger: name });
        };

        return childLogger;
    }
}

module.exports = Logger;