const axios = require('axios');
const BaseAdapter = require('./BaseAdapter');
const logger = require('../utils/logger');

/**
 * HTTP/HTTPS API适配器
 * 支持RESTful API和普通HTTP API
 */
class HttpAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      maxRedirects: 5,
      validateStatus: () => true // 接受所有状态码，由我们自己处理
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        const responseTime = Date.now() - response.config.metadata.startTime;
        this.logApiCall(
          response.config.method.toUpperCase(),
          response.config.url,
          response.status,
          responseTime
        );
        return response;
      },
      (error) => {
        const responseTime = error.config?.metadata ? 
          Date.now() - error.config.metadata.startTime : 0;
        
        this.logApiCall(
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.config?.url || 'unknown',
          error.response?.status || 0,
          responseTime,
          error
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * 处理HTTP请求
   */
  async handleRequest(req, res) {
    try {
      this.validateRequest(req);

      // 构建目标URL
      const targetPath = this.buildTargetPath(req);
      const headers = this.prepareHeaders(req);

      // 准备请求配置
      const requestConfig = {
        method: req.method.toLowerCase(),
        url: targetPath,
        headers,
        params: req.query,
        timeout: this.timeout
      };

      // 如果有请求体，添加数据
      if (['post', 'put', 'patch'].includes(req.method.toLowerCase()) && req.body) {
        requestConfig.data = req.body;
      }

      // 执行请求（带重试）
      const response = await this.retry(async () => {
        return await this.client.request(requestConfig);
      });

      // 设置响应头
      this.setResponseHeaders(res, response);

      // 返回响应
      return res.status(response.status).json(response.data);

    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * 构建目标路径
   */
  buildTargetPath(req) {
    let targetPath = this.config.target || '';
    
    // 如果配置了路径映射
    if (this.config.pathMapping) {
      const sourcePath = req.path.replace(this.config.path.replace('/*', ''), '');
      targetPath = this.config.pathMapping.replace('*', sourcePath);
    } else if (this.config.target && this.config.target.includes('*')) {
      // 支持通配符路径
      const sourcePath = req.path.replace(this.config.path.replace('/*', ''), '');
      targetPath = this.config.target.replace('*', sourcePath);
    } else if (this.config.target) {
      targetPath = this.config.target;
    } else {
      // 使用原始路径
      targetPath = req.path.replace(this.config.path.replace('/*', ''), '');
    }

    return targetPath;
  }

  /**
   * 设置响应头
   */
  setResponseHeaders(res, response) {
    // 复制有用的响应头
    const headersToForward = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
      'expires',
      'location'
    ];

    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.set(header, response.headers[header]);
      }
    });

    // 添加自定义头表明这是代理响应
    res.set('X-Proxy-By', 'API-Proxy');
    res.set('X-Target-API', this.name);
  }

  /**
   * 验证HTTP请求
   */
  validateRequest(req) {
    super.validateRequest(req);

    // 检查是否支持该HTTP方法
    if (this.config.methods && !this.config.methods.includes(req.method)) {
      throw new Error(`HTTP method ${req.method} not allowed for this endpoint`);
    }

    return true;
  }

  /**
   * 处理文件上传
   */
  async handleFileUpload(req, res) {
    try {
      const targetPath = this.buildTargetPath(req);
      const headers = this.prepareHeaders(req, {
        'Content-Type': req.get('Content-Type')
      });

      const formData = new FormData();
      
      // 处理文件字段
      if (req.files) {
        Object.keys(req.files).forEach(key => {
          const file = req.files[key];
          formData.append(key, file.data, file.name);
        });
      }

      // 处理其他字段
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          formData.append(key, req.body[key]);
        });
      }

      const response = await this.retry(async () => {
        return await this.client.post(targetPath, formData, {
          headers: {
            ...headers,
            ...formData.getHeaders()
          }
        });
      });

      this.setResponseHeaders(res, response);
      return res.status(response.status).json(response.data);

    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * 获取适配器特定信息
   */
  getInfo() {
    return {
      ...super.getInfo(),
      supportedMethods: this.config.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      target: this.config.target,
      pathMapping: this.config.pathMapping
    };
  }
}

module.exports = HttpAdapter;