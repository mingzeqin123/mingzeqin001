/**
 * 数据处理模块
 * 提供数据存储、查询、分析等功能
 */

class DataService {
    constructor() {
        this.dataStore = new Map();
        this.dataTypes = new Set(['string', 'number', 'boolean', 'object', 'array']);
    }

    /**
     * 存储数据
     * @param {string} key - 数据键
     * @param {*} value - 数据值
     * @param {Object} options - 选项
     * @returns {Object} 存储结果
     */
    async store(key, value, options = {}) {
        try {
            const { ttl, metadata = {} } = options;
            
            // 验证数据类型
            const dataType = this.getDataType(value);
            if (!this.dataTypes.has(dataType)) {
                throw new Error(`不支持的数据类型: ${dataType}`);
            }

            const dataItem = {
                key,
                value,
                type: dataType,
                metadata,
                createdAt: new Date(),
                ttl: ttl ? Date.now() + ttl : null
            };

            this.dataStore.set(key, dataItem);

            return {
                success: true,
                message: '数据存储成功',
                key,
                dataType
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取数据
     * @param {string} key - 数据键
     * @returns {Object} 获取结果
     */
    async get(key) {
        try {
            const dataItem = this.dataStore.get(key);
            
            if (!dataItem) {
                throw new Error('数据不存在');
            }

            // 检查TTL
            if (dataItem.ttl && Date.now() > dataItem.ttl) {
                this.dataStore.delete(key);
                throw new Error('数据已过期');
            }

            return {
                success: true,
                data: dataItem.value,
                metadata: dataItem.metadata,
                createdAt: dataItem.createdAt
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 删除数据
     * @param {string} key - 数据键
     * @returns {Object} 删除结果
     */
    async delete(key) {
        try {
            if (!this.dataStore.has(key)) {
                throw new Error('数据不存在');
            }

            this.dataStore.delete(key);

            return {
                success: true,
                message: '数据删除成功'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 查询数据
     * @param {Object} query - 查询条件
     * @returns {Object} 查询结果
     */
    async query(query = {}) {
        try {
            const { type, metadata, limit = 100, offset = 0 } = query;
            let results = Array.from(this.dataStore.values());

            // 按类型过滤
            if (type) {
                results = results.filter(item => item.type === type);
            }

            // 按元数据过滤
            if (metadata) {
                results = results.filter(item => {
                    return Object.keys(metadata).every(key => 
                        item.metadata[key] === metadata[key]
                    );
                });
            }

            // 分页
            const total = results.length;
            const paginatedResults = results.slice(offset, offset + limit);

            return {
                success: true,
                data: paginatedResults.map(item => ({
                    key: item.key,
                    value: item.value,
                    type: item.type,
                    metadata: item.metadata,
                    createdAt: item.createdAt
                })),
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 数据分析
     * @param {string} key - 数据键
     * @returns {Object} 分析结果
     */
    async analyze(key) {
        try {
            const dataItem = this.dataStore.get(key);
            
            if (!dataItem) {
                throw new Error('数据不存在');
            }

            const analysis = {
                key,
                type: dataItem.type,
                size: this.calculateSize(dataItem.value),
                createdAt: dataItem.createdAt,
                age: Date.now() - dataItem.createdAt.getTime()
            };

            // 根据数据类型进行特定分析
            switch (dataItem.type) {
                case 'array':
                    analysis.length = dataItem.value.length;
                    analysis.elementTypes = this.analyzeArrayTypes(dataItem.value);
                    break;
                case 'object':
                    analysis.keys = Object.keys(dataItem.value);
                    analysis.keyCount = analysis.keys.length;
                    break;
                case 'string':
                    analysis.length = dataItem.value.length;
                    analysis.wordCount = dataItem.value.split(/\s+/).length;
                    break;
                case 'number':
                    analysis.isInteger = Number.isInteger(dataItem.value);
                    analysis.isPositive = dataItem.value > 0;
                    break;
            }

            return {
                success: true,
                analysis
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 清理过期数据
     * @returns {Object} 清理结果
     */
    async cleanup() {
        try {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [key, dataItem] of this.dataStore.entries()) {
                if (dataItem.ttl && now > dataItem.ttl) {
                    this.dataStore.delete(key);
                    cleanedCount++;
                }
            }

            return {
                success: true,
                message: `清理了 ${cleanedCount} 条过期数据`
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取数据类型
     * @param {*} value - 值
     * @returns {string} 数据类型
     */
    getDataType(value) {
        if (Array.isArray(value)) return 'array';
        if (value === null) return 'null';
        return typeof value;
    }

    /**
     * 计算数据大小
     * @param {*} value - 值
     * @returns {number} 字节大小
     */
    calculateSize(value) {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
    }

    /**
     * 分析数组元素类型
     * @param {Array} arr - 数组
     * @returns {Object} 元素类型统计
     */
    analyzeArrayTypes(arr) {
        const types = {};
        arr.forEach(item => {
            const type = this.getDataType(item);
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    /**
     * 获取存储统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const stats = {
            totalItems: this.dataStore.size,
            totalSize: 0,
            typeDistribution: {},
            oldestItem: null,
            newestItem: null
        };

        let oldestTime = Infinity;
        let newestTime = 0;

        for (const dataItem of this.dataStore.values()) {
            // 计算总大小
            stats.totalSize += this.calculateSize(dataItem.value);

            // 统计类型分布
            stats.typeDistribution[dataItem.type] = 
                (stats.typeDistribution[dataItem.type] || 0) + 1;

            // 找最老和最新的项目
            const time = dataItem.createdAt.getTime();
            if (time < oldestTime) {
                oldestTime = time;
                stats.oldestItem = dataItem;
            }
            if (time > newestTime) {
                newestTime = time;
                stats.newestItem = dataItem;
            }
        }

        return stats;
    }
}

module.exports = DataService;