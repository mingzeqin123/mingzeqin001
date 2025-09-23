const { GraphQLClient } = require('graphql-request');
const BaseAdapter = require('./BaseAdapter');
const logger = require('../utils/logger');

/**
 * GraphQL API适配器
 * 支持GraphQL查询、变更和订阅
 */
class GraphQLAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    
    // 准备基础头部（不依赖req对象）
    const headers = {
      'User-Agent': 'API-Proxy/1.0.0'
    };
    
    // 添加认证头
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          if (this.config.auth.token) {
            headers['Authorization'] = `Bearer ${this.config.auth.token}`;
          }
          break;
        case 'basic':
          if (this.config.auth.username && this.config.auth.password) {
            const credentials = Buffer.from(
              `${this.config.auth.username}:${this.config.auth.password}`
            ).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'apikey':
          if (this.config.auth.key && this.config.auth.value) {
            headers[this.config.auth.key] = this.config.auth.value;
          }
          break;
      }
    }

    // 添加配置中的自定义头
    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }
    
    this.client = new GraphQLClient(this.baseUrl, {
      timeout: this.timeout,
      headers
    });
  }

  /**
   * 处理GraphQL请求
   */
  async handleRequest(req, res) {
    try {
      this.validateRequest(req);

      const startTime = Date.now();
      let response;

      // 处理不同的HTTP方法
      switch (req.method.toUpperCase()) {
        case 'POST':
          response = await this.handleGraphQLQuery(req);
          break;
        case 'GET':
          response = await this.handleGraphQLQueryViaGet(req);
          break;
        default:
          throw new Error(`HTTP method ${req.method} not supported for GraphQL`);
      }

      const responseTime = Date.now() - startTime;
      this.logApiCall(req.method, this.baseUrl, 200, responseTime);

      // 设置响应头
      res.set('Content-Type', 'application/json');
      res.set('X-Proxy-By', 'API-Proxy');
      res.set('X-Target-API', this.name);
      res.set('X-API-Type', 'GraphQL');

      return res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - (error.startTime || Date.now());
      this.logApiCall(req.method, this.baseUrl, 500, responseTime, error);
      return this.handleError(error, res);
    }
  }

  /**
   * 处理POST方式的GraphQL查询
   */
  async handleGraphQLQuery(req) {
    const { query, variables, operationName } = req.body;

    if (!query) {
      throw new Error('GraphQL query is required');
    }

    // 验证GraphQL查询
    this.validateGraphQLQuery(query);

    // 执行查询（带重试）
    const response = await this.retry(async () => {
      return await this.client.request(query, variables, {
        ...this.prepareHeaders(req),
        ...(operationName && { 'X-GraphQL-Operation-Name': operationName })
      });
    });

    return {
      data: response,
      extensions: {
        proxy: {
          adapter: this.name,
          type: 'GraphQL',
          operationType: this.detectOperationType(query)
        }
      }
    };
  }

  /**
   * 处理GET方式的GraphQL查询
   */
  async handleGraphQLQueryViaGet(req) {
    const { query, variables, operationName } = req.query;

    if (!query) {
      throw new Error('GraphQL query parameter is required');
    }

    let parsedVariables = {};
    if (variables) {
      try {
        parsedVariables = JSON.parse(variables);
      } catch (error) {
        throw new Error('Invalid variables JSON');
      }
    }

    // 验证GraphQL查询
    this.validateGraphQLQuery(query);

    // 执行查询（带重试）
    const response = await this.retry(async () => {
      return await this.client.request(query, parsedVariables, {
        ...this.prepareHeaders(req),
        ...(operationName && { 'X-GraphQL-Operation-Name': operationName })
      });
    });

    return {
      data: response,
      extensions: {
        proxy: {
          adapter: this.name,
          type: 'GraphQL',
          operationType: this.detectOperationType(query)
        }
      }
    };
  }

  /**
   * 验证GraphQL查询
   */
  validateGraphQLQuery(query) {
    if (typeof query !== 'string') {
      throw new Error('GraphQL query must be a string');
    }

    // 基础语法检查
    if (!query.trim()) {
      throw new Error('GraphQL query cannot be empty');
    }

    // 检查是否包含基本的GraphQL关键字
    const hasValidKeyword = /\b(query|mutation|subscription|fragment)\b/i.test(query);
    if (!hasValidKeyword && !/{/.test(query)) {
      throw new Error('Invalid GraphQL query format');
    }

    return true;
  }

  /**
   * 检测操作类型
   */
  detectOperationType(query) {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (trimmedQuery.startsWith('mutation')) {
      return 'mutation';
    } else if (trimmedQuery.startsWith('subscription')) {
      return 'subscription';
    } else if (trimmedQuery.startsWith('query') || trimmedQuery.startsWith('{')) {
      return 'query';
    } else if (trimmedQuery.startsWith('fragment')) {
      return 'fragment';
    }
    
    return 'unknown';
  }

  /**
   * 处理GraphQL订阅
   * 注意：这是一个基础实现，真正的订阅需要WebSocket支持
   */
  async handleSubscription(req, res) {
    try {
      // 对于订阅，我们返回一个错误，因为需要WebSocket连接
      throw new Error('GraphQL subscriptions require WebSocket connection. Use a GraphQL WebSocket client.');
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * 处理GraphQL内省查询
   */
  async handleIntrospection(req, res) {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
            description
          }
          queryType {
            name
          }
          mutationType {
            name
          }
          subscriptionType {
            name
          }
        }
      }
    `;

    try {
      const response = await this.client.request(introspectionQuery);
      
      res.set('Content-Type', 'application/json');
      res.set('X-Proxy-By', 'API-Proxy');
      res.set('X-Target-API', this.name);
      
      return res.status(200).json({
        data: response,
        extensions: {
          proxy: {
            adapter: this.name,
            type: 'GraphQL',
            operationType: 'introspection'
          }
        }
      });

    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * 验证GraphQL请求
   */
  validateRequest(req) {
    super.validateRequest(req);

    // GraphQL只支持GET和POST
    if (!['GET', 'POST'].includes(req.method)) {
      throw new Error(`HTTP method ${req.method} not supported for GraphQL`);
    }

    // POST请求必须有body
    if (req.method === 'POST' && !req.body) {
      throw new Error('Request body is required for GraphQL POST requests');
    }

    return true;
  }

  /**
   * 处理GraphQL错误
   */
  handleError(error, res) {
    // GraphQL特定的错误处理
    if (error.response && error.response.errors) {
      return res.status(200).json({
        data: error.response.data || null,
        errors: error.response.errors,
        extensions: {
          proxy: {
            adapter: this.name,
            type: 'GraphQL',
            error: true
          }
        }
      });
    }

    // 使用基类的错误处理
    return super.handleError(error, res);
  }

  /**
   * 获取适配器特定信息
   */
  getInfo() {
    return {
      ...super.getInfo(),
      supportedMethods: ['GET', 'POST'],
      features: ['Query', 'Mutation', 'Introspection'],
      endpoints: {
        query: this.config.path,
        introspection: `${this.config.path}/introspect`
      }
    };
  }

  /**
   * 更新GraphQL客户端头部
   */
  updateHeaders(newHeaders) {
    const headers = { ...this.client.requestConfig.headers, ...newHeaders };
    this.client = new GraphQLClient(this.baseUrl, {
      timeout: this.timeout,
      headers
    });
  }
}

module.exports = GraphQLAdapter;