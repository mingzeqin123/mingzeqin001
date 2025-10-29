const axios = require('axios');
const crypto = require('crypto');

/**
 * 网易云推流服务
 * 集成网易云推流平台的API和SDK
 */
class NeteaseService {
  constructor() {
    this.appKey = process.env.NETEASE_APP_KEY;
    this.appSecret = process.env.NETEASE_APP_SECRET;
    this.baseUrl = process.env.NETEASE_BASE_URL || 'https://vcloud.163.com';
    this.version = 'v1';
  }

  /**
   * 生成签名
   * @param {string} method HTTP方法
   * @param {string} uri 请求路径
   * @param {object} params 请求参数
   * @param {string} nonce 随机数
   * @param {number} curTime 当前时间戳
   * @returns {string} 签名字符串
   */
  generateSignature(method, uri, params, nonce, curTime) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const checkSum = crypto
      .createHash('sha1')
      .update(this.appSecret + nonce + curTime)
      .digest('hex');
    
    return crypto
      .createHash('sha1')
      .update(method + uri + paramStr + checkSum)
      .digest('hex');
  }

  /**
   * 发送请求到网易云API
   * @param {string} method HTTP方法
   * @param {string} uri 请求路径
   * @param {object} data 请求数据
   * @returns {Promise<object>} API响应
   */
  async request(method, uri, data = {}) {
    const nonce = Math.random().toString(36).substring(2);
    const curTime = Math.floor(Date.now() / 1000);
    
    const params = {
      ...data,
      appkey: this.appKey,
      nonce,
      curTime
    };
    
    const signature = this.generateSignature(method, uri, params, nonce, curTime);
    
    const headers = {
      'Content-Type': 'application/json',
      'AppKey': this.appKey,
      'Nonce': nonce,
      'CurTime': curTime.toString(),
      'CheckSum': signature
    };
    
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${uri}`,
        headers,
        data: method === 'GET' ? undefined : params,
        params: method === 'GET' ? params : undefined,
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('网易云API请求失败:', error.response?.data || error.message);
      throw new Error(`网易云API请求失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 创建推流频道
   * @param {string} roomId 直播间ID
   * @param {string} title 直播标题
   * @param {string} cover 封面图片URL
   * @returns {Promise<object>} 推流信息
   */
  async createChannel(roomId, title, cover) {
    const data = {
      cid: roomId,
      name: title,
      type: 0, // 0: 推流频道
      record: 1, // 1: 开启录制
      format: 0, // 0: 录制为MP4格式
      maxUsers: 10000, // 最大观看人数
      pushUrl: '', // 推流地址，由服务器生成
      httpPullUrl: '', // HTTP拉流地址
      hlsPullUrl: '', // HLS拉流地址
      rtmpPullUrl: '', // RTMP拉流地址
      cover: cover || ''
    };
    
    const response = await this.request('POST', '/app/channel/create', data);
    
    if (response.code !== 200) {
      throw new Error(response.msg || '创建推流频道失败');
    }
    
    return {
      cid: response.ret.cid,
      pushUrl: response.ret.pushUrl,
      httpPullUrl: response.ret.httpPullUrl,
      hlsPullUrl: response.ret.hlsPullUrl,
      rtmpPullUrl: response.ret.rtmpPullUrl
    };
  }

  /**
   * 获取推流地址
   * @param {string} roomId 直播间ID
   * @param {string} title 直播标题
   * @param {string} cover 封面图片URL
   * @returns {Promise<object>} 推流和拉流地址
   */
  async getPushUrl(roomId, title, cover = '') {
    try {
      // 先尝试获取已存在的频道
      const channelInfo = await this.getChannel(roomId);
      
      if (channelInfo) {
        return {
          pushUrl: channelInfo.pushUrl,
          streamUrl: channelInfo.httpPullUrl,
          hlsUrl: channelInfo.hlsPullUrl,
          rtmpUrl: channelInfo.rtmpPullUrl
        };
      }
    } catch (error) {
      console.log('频道不存在，创建新频道:', error.message);
    }
    
    // 创建新频道
    const channelInfo = await this.createChannel(roomId, title, cover);
    
    return {
      pushUrl: channelInfo.pushUrl,
      streamUrl: channelInfo.httpPullUrl,
      hlsUrl: channelInfo.hlsPullUrl,
      rtmpUrl: channelInfo.rtmpPullUrl
    };
  }

  /**
   * 获取频道信息
   * @param {string} roomId 直播间ID
   * @returns {Promise<object|null>} 频道信息
   */
  async getChannel(roomId) {
    try {
      const response = await this.request('GET', '/app/channel/get', {
        cid: roomId
      });
      
      if (response.code === 200) {
        return response.ret;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 删除频道
   * @param {string} roomId 直播间ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteChannel(roomId) {
    try {
      const response = await this.request('POST', '/app/channel/delete', {
        cid: roomId
      });
      
      return response.code === 200;
    } catch (error) {
      console.error('删除频道失败:', error.message);
      return false;
    }
  }

  /**
   * 获取频道状态
   * @param {string} roomId 直播间ID
   * @returns {Promise<object>} 频道状态
   */
  async getChannelStatus(roomId) {
    try {
      const response = await this.request('GET', '/app/channel/status', {
        cid: roomId
      });
      
      if (response.code === 200) {
        return {
          status: response.ret.status, // 0: 空闲, 1: 直播中
          userCount: response.ret.userCount,
          duration: response.ret.duration
        };
      }
      
      return {
        status: 0,
        userCount: 0,
        duration: 0
      };
    } catch (error) {
      console.error('获取频道状态失败:', error.message);
      return {
        status: 0,
        userCount: 0,
        duration: 0
      };
    }
  }

  /**
   * 设置频道录制
   * @param {string} roomId 直播间ID
   * @param {boolean} record 是否录制
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setChannelRecord(roomId, record) {
    try {
      const response = await this.request('POST', '/app/channel/setRecord', {
        cid: roomId,
        record: record ? 1 : 0
      });
      
      return response.code === 200;
    } catch (error) {
      console.error('设置频道录制失败:', error.message);
      return false;
    }
  }

  /**
   * 获取录制文件列表
   * @param {string} roomId 直播间ID
   * @param {number} startTime 开始时间戳
   * @param {number} endTime 结束时间戳
   * @returns {Promise<Array>} 录制文件列表
   */
  async getRecordFiles(roomId, startTime, endTime) {
    try {
      const response = await this.request('GET', '/app/vod/list', {
        cid: roomId,
        startTime,
        endTime
      });
      
      if (response.code === 200) {
        return response.ret || [];
      }
      
      return [];
    } catch (error) {
      console.error('获取录制文件失败:', error.message);
      return [];
    }
  }

  /**
   * 生成推流地址（用于测试）
   * @param {string} roomId 直播间ID
   * @returns {object} 推流和拉流地址
   */
  generateTestUrls(roomId) {
    const baseUrl = 'rtmp://your-rtmp-server.com/live';
    const httpUrl = 'https://your-http-server.com/live';
    
    return {
      pushUrl: `${baseUrl}/${roomId}`,
      streamUrl: `${httpUrl}/${roomId}.flv`,
      hlsUrl: `${httpUrl}/${roomId}.m3u8`,
      rtmpUrl: `${baseUrl}/${roomId}`
    };
  }

  /**
   * 验证推流地址
   * @param {string} pushUrl 推流地址
   * @returns {boolean} 地址是否有效
   */
  validatePushUrl(pushUrl) {
    const rtmpRegex = /^rtmp:\/\/.+/;
    return rtmpRegex.test(pushUrl);
  }

  /**
   * 获取推流统计信息
   * @param {string} roomId 直播间ID
   * @returns {Promise<object>} 统计信息
   */
  async getStreamStats(roomId) {
    try {
      const response = await this.request('GET', '/app/channel/stats', {
        cid: roomId
      });
      
      if (response.code === 200) {
        return {
          bitrate: response.ret.bitrate || 0,
          fps: response.ret.fps || 0,
          resolution: response.ret.resolution || '0x0',
          duration: response.ret.duration || 0,
          userCount: response.ret.userCount || 0
        };
      }
      
      return {
        bitrate: 0,
        fps: 0,
        resolution: '0x0',
        duration: 0,
        userCount: 0
      };
    } catch (error) {
      console.error('获取推流统计失败:', error.message);
      return {
        bitrate: 0,
        fps: 0,
        resolution: '0x0',
        duration: 0,
        userCount: 0
      };
    }
  }
}

module.exports = NeteaseService;