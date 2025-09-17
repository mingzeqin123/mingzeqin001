/**
 * API服务模块
 * 提供HTTP请求封装和API管理功能
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class ApiService {
    constructor(options = {}) {
        this.baseURL = options.baseURL || '';
        this.timeout = options.timeout || 5000;
        this.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ModularApp/1.0.0',
            ...options.headers
        };
        this.interceptors = {
            request: [],
            response: []
        };
    }

    /**
     * 发送HTTP请求
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应结果
     */
    async request(options) {
        const {
            method = 'GET',
            url,
            data,
            headers = {},
            timeout = this.timeout
        } = options;

        return new Promise((resolve, reject) => {
            const fullUrl = this.baseURL ? `${this.baseURL}${url}` : url;
            const urlObj = new URL(fullUrl);
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: method.toUpperCase(),
                headers: {
                    ...this.headers,
                    ...headers
                },
                timeout
            };

            // 应用请求拦截器
            const processedOptions = this.applyRequestInterceptors(requestOptions, data);

            const client = urlObj.protocol === 'https:' ? https : http;
            const req = client.request(processedOptions, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = {
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            headers: res.headers,
                            data: this.parseResponseData(responseData, res.headers['content-type'])
                        };

                        // 应用响应拦截器
                        const processedResponse = this.applyResponseInterceptors(response);
                        resolve(processedResponse);
                    } catch (error) {
                        reject(new Error(`响应解析失败: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`请求失败: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('请求超时'));
            });

            // 发送请求体数据
            if (data) {
                const requestData = typeof data === 'string' ? data : JSON.stringify(data);
                req.write(requestData);
            }

            req.end();
        });
    }

    /**
     * GET请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应结果
     */
    async get(url, options = {}) {
        return this.request({
            method: 'GET',
            url,
            ...options
        });
    }

    /**
     * POST请求
     * @param {string} url - 请求URL
     * @param {*} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应结果
     */
    async post(url, data, options = {}) {
        return this.request({
            method: 'POST',
            url,
            data,
            ...options
        });
    }

    /**
     * PUT请求
     * @param {string} url - 请求URL
     * @param {*} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应结果
     */
    async put(url, data, options = {}) {
        return this.request({
            method: 'PUT',
            url,
            data,
            ...options
        });
    }

    /**
     * DELETE请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应结果
     */
    async delete(url, options = {}) {
        return this.request({
            method: 'DELETE',
            url,
            ...options
        });
    }

    /**
     * 添加请求拦截器
     * @param {Function} interceptor - 拦截器函数
     */
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }

    /**
     * 添加响应拦截器
     * @param {Function} interceptor - 拦截器函数
     */
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }

    /**
     * 应用请求拦截器
     * @param {Object} options - 请求选项
     * @param {*} data - 请求数据
     * @returns {Object} 处理后的选项
     */
    applyRequestInterceptors(options, data) {
        let processedOptions = { ...options };
        let processedData = data;

        for (const interceptor of this.interceptors.request) {
            const result = interceptor(processedOptions, processedData);
            if (result) {
                processedOptions = result.options || processedOptions;
                processedData = result.data !== undefined ? result.data : processedData;
            }
        }

        return { ...processedOptions, data: processedData };
    }

    /**
     * 应用响应拦截器
     * @param {Object} response - 响应对象
     * @returns {Object} 处理后的响应
     */
    applyResponseInterceptors(response) {
        let processedResponse = { ...response };

        for (const interceptor of this.interceptors.response) {
            const result = interceptor(processedResponse);
            if (result) {
                processedResponse = result;
            }
        }

        return processedResponse;
    }

    /**
     * 解析响应数据
     * @param {string} data - 原始数据
     * @param {string} contentType - 内容类型
     * @returns {*} 解析后的数据
     */
    parseResponseData(data, contentType) {
        if (!contentType) {
            return data;
        }

        if (contentType.includes('application/json')) {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }

        if (contentType.includes('application/xml')) {
            // 简单的XML解析，实际项目中应使用专门的XML解析库
            return data;
        }

        return data;
    }

    /**
     * 设置基础URL
     * @param {string} baseURL - 基础URL
     */
    setBaseURL(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * 设置默认请求头
     * @param {Object} headers - 请求头
     */
    setHeaders(headers) {
        this.headers = { ...this.headers, ...headers };
    }

    /**
     * 设置超时时间
     * @param {number} timeout - 超时时间（毫秒）
     */
    setTimeout(timeout) {
        this.timeout = timeout;
    }

    /**
     * 创建API实例
     * @param {Object} options - 选项
     * @returns {ApiService} API实例
     */
    static create(options = {}) {
        return new ApiService(options);
    }
}

module.exports = ApiService;