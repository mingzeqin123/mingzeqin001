const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const BaseAdapter = require('./BaseAdapter');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * gRPC API适配器
 * 支持gRPC服务调用，将HTTP请求转换为gRPC调用
 */
class GrpcAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    
    this.host = config.host || 'localhost:50051';
    this.protoPath = config.protoPath;
    this.serviceName = config.serviceName;
    this.packageName = config.packageName;
    
    this.client = null;
    this.proto = null;
    this.methods = new Map();
    
    this.initialized = false;
  }

  /**
   * 初始化gRPC客户端
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 加载proto文件
      await this.loadProtoFile();
      
      // 创建gRPC客户端
      this.createClient();
      
      this.initialized = true;
      logger.info(`gRPC adapter ${this.name} initialized successfully`);
      
    } catch (error) {
      logger.error(`Failed to initialize gRPC adapter ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * 加载Proto文件
   */
  async loadProtoFile() {
    if (!this.protoPath) {
      throw new Error('Proto file path is required for gRPC adapter');
    }

    const fullProtoPath = path.resolve(this.protoPath);
    
    if (!fs.existsSync(fullProtoPath)) {
      throw new Error(`Proto file not found: ${fullProtoPath}`);
    }

    // Proto加载选项
    const packageDefinition = protoLoader.loadSync(fullProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    this.proto = grpc.loadPackageDefinition(packageDefinition);
    
    logger.info(`Proto file loaded: ${fullProtoPath}`);
  }

  /**
   * 创建gRPC客户端
   */
  createClient() {
    if (!this.proto) {
      throw new Error('Proto definition not loaded');
    }

    // 获取服务定义
    let ServiceClass;
    
    if (this.packageName) {
      ServiceClass = this.proto[this.packageName][this.serviceName];
    } else {
      ServiceClass = this.proto[this.serviceName];
    }

    if (!ServiceClass) {
      throw new Error(`Service ${this.serviceName} not found in proto definition`);
    }

    // 创建客户端实例
    this.client = new ServiceClass(this.host, grpc.credentials.createInsecure(), {
      'grpc.keepalive_time_ms': 30000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': true,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.http2.min_time_between_pings_ms': 10000,
      'grpc.http2.min_ping_interval_without_data_ms': 300000
    });

    // 收集所有可用的方法
    this.collectMethods(ServiceClass);
    
    logger.info(`gRPC client created for service ${this.serviceName} at ${this.host}`);
  }

  /**
   * 收集服务方法
   */
  collectMethods(ServiceClass) {
    const serviceDefinition = ServiceClass.service;
    
    Object.keys(serviceDefinition).forEach(methodName => {
      const methodDefinition = serviceDefinition[methodName];
      this.methods.set(methodName.toLowerCase(), {
        name: methodName,
        requestType: methodDefinition.requestType,
        responseType: methodDefinition.responseType,
        requestStream: methodDefinition.requestStream,
        responseStream: methodDefinition.responseStream
      });
    });

    logger.info(`Found ${this.methods.size} gRPC methods:`, Array.from(this.methods.keys()));
  }

  /**
   * 处理HTTP到gRPC的请求
   */
  async handleRequest(req, res) {
    try {
      // 确保适配器已初始化
      if (!this.initialized) {
        await this.initialize();
      }

      this.validateRequest(req);

      const startTime = Date.now();
      
      // 从URL路径中提取方法名
      const methodName = this.extractMethodName(req.path);
      const methodInfo = this.methods.get(methodName.toLowerCase());
      
      if (!methodInfo) {
        throw new Error(`gRPC method ${methodName} not found`);
      }

      // 准备请求数据
      const requestData = this.prepareRequestData(req, methodInfo);
      
      // 调用gRPC方法
      const response = await this.callGrpcMethod(methodInfo, requestData);
      
      const responseTime = Date.now() - startTime;
      this.logApiCall(req.method, `grpc://${this.host}/${methodName}`, 200, responseTime);

      // 设置响应头
      res.set('Content-Type', 'application/json');
      res.set('X-Proxy-By', 'API-Proxy');
      res.set('X-Target-API', this.name);
      res.set('X-API-Type', 'gRPC');
      res.set('X-gRPC-Method', methodInfo.name);

      return res.status(200).json({
        success: true,
        data: response,
        metadata: {
          method: methodInfo.name,
          service: this.serviceName,
          responseTime: `${responseTime}ms`
        }
      });

    } catch (error) {
      const responseTime = Date.now() - (error.startTime || Date.now());
      this.logApiCall(req.method, `grpc://${this.host}`, 500, responseTime, error);
      return this.handleError(error, res);
    }
  }

  /**
   * 从路径中提取方法名
   */
  extractMethodName(path) {
    // 假设路径格式为 /api/v1/grpc/MethodName
    const pathParts = path.split('/');
    const methodName = pathParts[pathParts.length - 1];
    
    if (!methodName) {
      throw new Error('gRPC method name not found in path');
    }
    
    return methodName;
  }

  /**
   * 准备gRPC请求数据
   */
  prepareRequestData(req, methodInfo) {
    let requestData = {};
    
    // 合并query参数和body数据
    if (req.query && Object.keys(req.query).length > 0) {
      requestData = { ...requestData, ...req.query };
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      requestData = { ...requestData, ...req.body };
    }

    // 转换数据类型以匹配proto定义
    return this.convertDataTypes(requestData, methodInfo.requestType);
  }

  /**
   * 转换数据类型
   */
  convertDataTypes(data, type) {
    // 这里可以根据proto定义进行更复杂的类型转换
    // 目前只做基础转换
    const converted = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      if (typeof value === 'string' && !isNaN(value)) {
        // 尝试转换数字字符串
        converted[key] = Number(value);
      } else if (value === 'true' || value === 'false') {
        // 转换布尔值字符串
        converted[key] = value === 'true';
      } else {
        converted[key] = value;
      }
    });
    
    return converted;
  }

  /**
   * 调用gRPC方法
   */
  async callGrpcMethod(methodInfo, requestData) {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + (this.timeout / 1000));

      const call = this.client[methodInfo.name](
        requestData,
        { deadline },
        (error, response) => {
          if (error) {
            reject(this.convertGrpcError(error));
          } else {
            resolve(response);
          }
        }
      );

      // 处理流式调用
      if (methodInfo.responseStream) {
        const responses = [];
        
        call.on('data', (data) => {
          responses.push(data);
        });
        
        call.on('end', () => {
          resolve(responses);
        });
        
        call.on('error', (error) => {
          reject(this.convertGrpcError(error));
        });
      }
    });
  }

  /**
   * 转换gRPC错误
   */
  convertGrpcError(grpcError) {
    const error = new Error(grpcError.details || grpcError.message);
    
    // 映射gRPC状态码到HTTP状态码
    const statusMap = {
      [grpc.status.OK]: 200,
      [grpc.status.CANCELLED]: 499,
      [grpc.status.UNKNOWN]: 500,
      [grpc.status.INVALID_ARGUMENT]: 400,
      [grpc.status.DEADLINE_EXCEEDED]: 504,
      [grpc.status.NOT_FOUND]: 404,
      [grpc.status.ALREADY_EXISTS]: 409,
      [grpc.status.PERMISSION_DENIED]: 403,
      [grpc.status.UNAUTHENTICATED]: 401,
      [grpc.status.RESOURCE_EXHAUSTED]: 429,
      [grpc.status.FAILED_PRECONDITION]: 400,
      [grpc.status.ABORTED]: 409,
      [grpc.status.OUT_OF_RANGE]: 400,
      [grpc.status.UNIMPLEMENTED]: 501,
      [grpc.status.INTERNAL]: 500,
      [grpc.status.UNAVAILABLE]: 503,
      [grpc.status.DATA_LOSS]: 500
    };

    error.httpStatus = statusMap[grpcError.code] || 500;
    error.grpcCode = grpcError.code;
    error.grpcStatus = Object.keys(grpc.status).find(
      key => grpc.status[key] === grpcError.code
    );
    
    return error;
  }

  /**
   * 验证gRPC请求
   */
  validateRequest(req) {
    super.validateRequest(req);

    // gRPC适配器主要支持POST请求
    if (!['POST', 'GET'].includes(req.method)) {
      throw new Error(`HTTP method ${req.method} not supported for gRPC adapter`);
    }

    return true;
  }

  /**
   * 处理gRPC特定的错误
   */
  handleError(error, res) {
    if (error.httpStatus) {
      return res.status(error.httpStatus).json({
        success: false,
        error: error.message,
        grpc: {
          code: error.grpcCode,
          status: error.grpcStatus
        },
        adapter: this.name,
        type: this.type
      });
    }

    return super.handleError(error, res);
  }

  /**
   * 获取适配器特定信息
   */
  getInfo() {
    return {
      ...super.getInfo(),
      host: this.host,
      serviceName: this.serviceName,
      packageName: this.packageName,
      protoPath: this.protoPath,
      initialized: this.initialized,
      availableMethods: Array.from(this.methods.keys()),
      supportedMethods: ['GET', 'POST']
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    if (!this.initialized) {
      return { status: 'not_initialized' };
    }

    try {
      // 这里可以调用gRPC服务的健康检查方法
      // 或者简单地检查连接状态
      return {
        status: 'healthy',
        service: this.serviceName,
        host: this.host,
        methods: this.methods.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 关闭gRPC客户端
   */
  async close() {
    if (this.client) {
      this.client.close();
      this.initialized = false;
      logger.info(`gRPC adapter ${this.name} closed`);
    }
  }
}

module.exports = GrpcAdapter;