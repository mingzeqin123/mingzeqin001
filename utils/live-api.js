// 直播系统API工具类
const LIVE_CONFIG = require('../config/live-config.js');

class LiveAPI {
  constructor() {
    this.baseUrl = LIVE_CONFIG.api.baseUrl;
    this.endpoints = LIVE_CONFIG.api.endpoints;
  }

  /**
   * 通用请求方法
   * @param {string} url 请求地址
   * @param {object} options 请求选项
   */
  async request(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      }
    };

    const requestOptions = Object.assign({}, defaultOptions, options);
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: this.baseUrl + url,
          ...requestOptions,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200) {
        return response.data;
      } else {
        throw new Error(`Request failed with status ${response.statusCode}`);
      }
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * 创建直播间
   * @param {object} roomInfo 直播间信息
   */
  async createRoom(roomInfo) {
    return await this.request(this.endpoints.createRoom, {
      method: 'POST',
      data: roomInfo
    });
  }

  /**
   * 获取推流地址
   * @param {string} roomId 直播间ID
   */
  async getPushUrl(roomId) {
    return await this.request(`${this.endpoints.getPushUrl}?roomId=${roomId}`);
  }

  /**
   * 获取拉流地址
   * @param {string} roomId 直播间ID
   */
  async getPullUrl(roomId) {
    return await this.request(`${this.endpoints.getPullUrl}?roomId=${roomId}`);
  }

  /**
   * 获取直播间列表
   * @param {object} params 查询参数
   */
  async getRoomList(params = {}) {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const url = queryString ? 
      `${this.endpoints.roomList}?${queryString}` : 
      this.endpoints.roomList;
    
    return await this.request(url);
  }

  /**
   * 进入直播间
   * @param {string} roomId 直播间ID
   * @param {object} userInfo 用户信息
   */
  async joinRoom(roomId, userInfo) {
    return await this.request(this.endpoints.joinRoom, {
      method: 'POST',
      data: {
        roomId,
        ...userInfo
      }
    });
  }

  /**
   * 离开直播间
   * @param {string} roomId 直播间ID
   * @param {string} userId 用户ID
   */
  async leaveRoom(roomId, userId) {
    return await this.request(this.endpoints.leaveRoom, {
      method: 'POST',
      data: {
        roomId,
        userId
      }
    });
  }

  /**
   * 发送聊天消息
   * @param {string} roomId 直播间ID
   * @param {object} message 消息内容
   */
  async sendMessage(roomId, message) {
    return await this.request(this.endpoints.sendMessage, {
      method: 'POST',
      data: {
        roomId,
        ...message
      }
    });
  }

  /**
   * 获取聊天消息
   * @param {string} roomId 直播间ID
   * @param {object} params 查询参数
   */
  async getMessages(roomId, params = {}) {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const url = `${this.endpoints.getMessages}?roomId=${roomId}&${queryString}`;
    return await this.request(url);
  }
}

// 网易云信SDK集成工具
class NeteaseSDK {
  constructor() {
    this.config = LIVE_CONFIG.netease;
    this.isInitialized = false;
  }

  /**
   * 初始化SDK
   */
  async initialize() {
    try {
      // 这里集成网易云信SDK初始化逻辑
      // 实际项目中需要引入网易云信小程序SDK
      console.log('Initializing Netease SDK...');
      
      // 模拟SDK初始化
      this.isInitialized = true;
      return { success: true, message: 'SDK initialized successfully' };
    } catch (error) {
      console.error('SDK initialization failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 生成推流URL
   * @param {string} streamName 流名称
   */
  generatePushUrl(streamName) {
    const { pushDomain, pushProtocol } = this.config.streaming;
    const timestamp = Date.now();
    
    // 这里应该根据网易云的鉴权规则生成真实的推流地址
    // 以下是示例格式
    return `${pushProtocol}://${pushDomain}/live/${streamName}?t=${timestamp}`;
  }

  /**
   * 生成拉流URL
   * @param {string} streamName 流名称
   * @param {string} protocol 协议类型
   */
  generatePullUrl(streamName, protocol = 'http-flv') {
    const { pullDomain } = this.config.streaming;
    const timestamp = Date.now();
    
    let url;
    switch (protocol) {
      case 'http-flv':
        url = `http://${pullDomain}/live/${streamName}.flv?t=${timestamp}`;
        break;
      case 'hls':
        url = `http://${pullDomain}/live/${streamName}.m3u8?t=${timestamp}`;
        break;
      case 'rtmp':
        url = `rtmp://${pullDomain}/live/${streamName}?t=${timestamp}`;
        break;
      default:
        url = `http://${pullDomain}/live/${streamName}.flv?t=${timestamp}`;
    }
    
    return url;
  }

  /**
   * 创建直播流
   * @param {object} streamConfig 流配置
   */
  async createStream(streamConfig) {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized');
    }

    try {
      // 这里调用网易云信API创建直播流
      console.log('Creating stream with config:', streamConfig);
      
      const streamName = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        streamName,
        pushUrl: this.generatePushUrl(streamName),
        pullUrl: this.generatePullUrl(streamName),
        config: streamConfig
      };
    } catch (error) {
      console.error('Create stream failed:', error);
      throw error;
    }
  }

  /**
   * 停止直播流
   * @param {string} streamName 流名称
   */
  async stopStream(streamName) {
    try {
      // 这里调用网易云信API停止直播流
      console.log('Stopping stream:', streamName);
      
      return {
        success: true,
        message: 'Stream stopped successfully'
      };
    } catch (error) {
      console.error('Stop stream failed:', error);
      throw error;
    }
  }
}

module.exports = {
  LiveAPI,
  NeteaseSDK
};