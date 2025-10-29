const mongoose = require('mongoose');
const redis = require('redis');

/**
 * 直播服务
 * 处理直播相关的业务逻辑
 */
class LiveService {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });
    
    this.redisClient.on('error', (err) => {
      console.error('Redis连接错误:', err);
    });
    
    this.redisClient.connect();
  }

  /**
   * 创建直播间
   * @param {object} roomData 直播间数据
   * @returns {Promise<object>} 创建的直播间信息
   */
  async createRoom(roomData) {
    const roomId = this.generateRoomId();
    const room = {
      roomId,
      title: roomData.title || '未命名直播间',
      cover: roomData.cover || '',
      hostId: roomData.hostId,
      hostInfo: roomData.hostInfo,
      status: 'idle', // idle, live, ended
      viewerCount: 0,
      maxViewers: 0,
      startTime: null,
      endTime: null,
      duration: 0,
      pushUrl: '',
      streamUrl: '',
      hlsUrl: '',
      rtmpUrl: '',
      earnings: 0,
      danmakuCount: 0,
      giftCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 保存到Redis
    await this.redisClient.hSet(`room:${roomId}`, room);
    
    // 设置过期时间（24小时）
    await this.redisClient.expire(`room:${roomId}`, 86400);
    
    return room;
  }

  /**
   * 获取直播间信息
   * @param {string} roomId 直播间ID
   * @returns {Promise<object|null>} 直播间信息
   */
  async getRoomInfo(roomId) {
    try {
      const roomData = await this.redisClient.hGetAll(`room:${roomId}`);
      
      if (!roomData || Object.keys(roomData).length === 0) {
        return null;
      }
      
      // 转换数据类型
      const room = {
        ...roomData,
        viewerCount: parseInt(roomData.viewerCount) || 0,
        maxViewers: parseInt(roomData.maxViewers) || 0,
        earnings: parseFloat(roomData.earnings) || 0,
        danmakuCount: parseInt(roomData.danmakuCount) || 0,
        giftCount: parseInt(roomData.giftCount) || 0,
        duration: parseInt(roomData.duration) || 0,
        createdAt: new Date(roomData.createdAt),
        updatedAt: new Date(roomData.updatedAt)
      };
      
      return room;
    } catch (error) {
      console.error('获取直播间信息失败:', error);
      return null;
    }
  }

  /**
   * 更新直播间信息
   * @param {string} roomId 直播间ID
   * @param {object} updateData 更新数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateRoom(roomId, updateData) {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }
      
      const updatedRoom = {
        ...room,
        ...updateData,
        updatedAt: new Date()
      };
      
      await this.redisClient.hSet(`room:${roomId}`, updatedRoom);
      return true;
    } catch (error) {
      console.error('更新直播间信息失败:', error);
      return false;
    }
  }

  /**
   * 开始直播
   * @param {string} roomId 直播间ID
   * @param {object} liveData 直播数据
   * @returns {Promise<boolean>} 是否开始成功
   */
  async startLive(roomId, liveData) {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }
      
      const updateData = {
        status: 'live',
        title: liveData.title || room.title,
        cover: liveData.cover || room.cover,
        pushUrl: liveData.pushUrl,
        streamUrl: liveData.streamUrl,
        hlsUrl: liveData.hlsUrl,
        rtmpUrl: liveData.rtmpUrl,
        startTime: new Date(),
        hostId: liveData.hostId || room.hostId,
        hostInfo: liveData.hostInfo || room.hostInfo
      };
      
      await this.updateRoom(roomId, updateData);
      
      // 添加到正在直播的列表
      await this.redisClient.sAdd('live_rooms', roomId);
      
      return true;
    } catch (error) {
      console.error('开始直播失败:', error);
      return false;
    }
  }

  /**
   * 停止直播
   * @param {string} roomId 直播间ID
   * @returns {Promise<boolean>} 是否停止成功
   */
  async stopLive(roomId) {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }
      
      const endTime = new Date();
      const duration = room.startTime ? 
        Math.floor((endTime - new Date(room.startTime)) / 1000) : 0;
      
      const updateData = {
        status: 'ended',
        endTime: endTime,
        duration: duration
      };
      
      await this.updateRoom(roomId, updateData);
      
      // 从正在直播的列表中移除
      await this.redisClient.sRem('live_rooms', roomId);
      
      return true;
    } catch (error) {
      console.error('停止直播失败:', error);
      return false;
    }
  }

  /**
   * 更新观看人数
   * @param {string} roomId 直播间ID
   * @param {number} count 观看人数
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateViewerCount(roomId, count) {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }
      
      const maxViewers = Math.max(room.maxViewers, count);
      
      await this.updateRoom(roomId, {
        viewerCount: count,
        maxViewers: maxViewers
      });
      
      return true;
    } catch (error) {
      console.error('更新观看人数失败:', error);
      return false;
    }
  }

  /**
   * 保存弹幕
   * @param {string} roomId 直播间ID
   * @param {object} danmaku 弹幕数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveDanmaku(roomId, danmaku) {
    try {
      // 保存弹幕到Redis列表
      await this.redisClient.lPush(`danmaku:${roomId}`, JSON.stringify(danmaku));
      
      // 限制弹幕数量，只保留最近1000条
      await this.redisClient.lTrim(`danmaku:${roomId}`, 0, 999);
      
      // 更新弹幕计数
      const room = await this.getRoomInfo(roomId);
      if (room) {
        await this.updateRoom(roomId, {
          danmakuCount: room.danmakuCount + 1
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存弹幕失败:', error);
      return false;
    }
  }

  /**
   * 获取弹幕列表
   * @param {string} roomId 直播间ID
   * @param {number} limit 限制数量
   * @returns {Promise<Array>} 弹幕列表
   */
  async getDanmakuList(roomId, limit = 50) {
    try {
      const danmakuList = await this.redisClient.lRange(`danmaku:${roomId}`, 0, limit - 1);
      return danmakuList.map(item => JSON.parse(item)).reverse();
    } catch (error) {
      console.error('获取弹幕列表失败:', error);
      return [];
    }
  }

  /**
   * 保存礼物
   * @param {string} roomId 直播间ID
   * @param {object} gift 礼物数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveGift(roomId, gift) {
    try {
      // 保存礼物到Redis列表
      await this.redisClient.lPush(`gifts:${roomId}`, JSON.stringify(gift));
      
      // 限制礼物数量，只保留最近500条
      await this.redisClient.lTrim(`gifts:${roomId}`, 0, 499);
      
      // 更新礼物计数和收益
      const room = await this.getRoomInfo(roomId);
      if (room) {
        await this.updateRoom(roomId, {
          giftCount: room.giftCount + 1,
          earnings: room.earnings + (gift.giftValue || 0)
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存礼物失败:', error);
      return false;
    }
  }

  /**
   * 获取礼物列表
   * @param {string} roomId 直播间ID
   * @param {number} limit 限制数量
   * @returns {Promise<Array>} 礼物列表
   */
  async getGiftList(roomId, limit = 50) {
    try {
      const giftList = await this.redisClient.lRange(`gifts:${roomId}`, 0, limit - 1);
      return giftList.map(item => JSON.parse(item)).reverse();
    } catch (error) {
      console.error('获取礼物列表失败:', error);
      return [];
    }
  }

  /**
   * 更新主播收益
   * @param {string} roomId 直播间ID
   * @param {number} amount 收益金额
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateHostEarnings(roomId, amount) {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }
      
      await this.updateRoom(roomId, {
        earnings: room.earnings + amount
      });
      
      return true;
    } catch (error) {
      console.error('更新主播收益失败:', error);
      return false;
    }
  }

  /**
   * 获取正在直播的房间列表
   * @param {number} page 页码
   * @param {number} limit 每页数量
   * @returns {Promise<Array>} 房间列表
   */
  async getLiveRooms(page = 1, limit = 20) {
    try {
      const roomIds = await this.redisClient.sMembers('live_rooms');
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      const paginatedRoomIds = roomIds.slice(start, end + 1);
      const rooms = [];
      
      for (const roomId of paginatedRoomIds) {
        const room = await this.getRoomInfo(roomId);
        if (room) {
          rooms.push(room);
        }
      }
      
      // 按观看人数排序
      rooms.sort((a, b) => b.viewerCount - a.viewerCount);
      
      return {
        rooms,
        total: roomIds.length,
        page,
        limit,
        totalPages: Math.ceil(roomIds.length / limit)
      };
    } catch (error) {
      console.error('获取直播房间列表失败:', error);
      return {
        rooms: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * 搜索直播间
   * @param {string} keyword 搜索关键词
   * @param {number} page 页码
   * @param {number} limit 每页数量
   * @returns {Promise<Array>} 搜索结果
   */
  async searchRooms(keyword, page = 1, limit = 20) {
    try {
      const roomIds = await this.redisClient.sMembers('live_rooms');
      const results = [];
      
      for (const roomId of roomIds) {
        const room = await this.getRoomInfo(roomId);
        if (room && room.title.toLowerCase().includes(keyword.toLowerCase())) {
          results.push(room);
        }
      }
      
      // 按观看人数排序
      results.sort((a, b) => b.viewerCount - a.viewerCount);
      
      const start = (page - 1) * limit;
      const end = start + limit;
      
      return {
        rooms: results.slice(start, end),
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit)
      };
    } catch (error) {
      console.error('搜索直播间失败:', error);
      return {
        rooms: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * 删除直播间
   * @param {string} roomId 直播间ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteRoom(roomId) {
    try {
      // 删除房间信息
      await this.redisClient.del(`room:${roomId}`);
      
      // 删除弹幕
      await this.redisClient.del(`danmaku:${roomId}`);
      
      // 删除礼物
      await this.redisClient.del(`gifts:${roomId}`);
      
      // 从直播列表中移除
      await this.redisClient.sRem('live_rooms', roomId);
      
      return true;
    } catch (error) {
      console.error('删除直播间失败:', error);
      return false;
    }
  }

  /**
   * 生成房间ID
   * @returns {string} 房间ID
   */
  generateRoomId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`.toUpperCase();
  }

  /**
   * 获取直播统计信息
   * @param {string} roomId 直播间ID
   * @returns {Promise<object>} 统计信息
   */
  async getLiveStats(roomId) {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return null;
      }
      
      const danmakuList = await this.getDanmakuList(roomId, 1000);
      const giftList = await this.getGiftList(roomId, 1000);
      
      // 计算弹幕热词
      const wordCount = {};
      danmakuList.forEach(danmaku => {
        const words = danmaku.content.split(/\s+/);
        words.forEach(word => {
          if (word.length > 1) {
            wordCount[word] = (wordCount[word] || 0) + 1;
          }
        });
      });
      
      const hotWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      
      // 计算礼物统计
      const giftStats = giftList.reduce((stats, gift) => {
        stats.totalValue += gift.giftValue || 0;
        stats.count += 1;
        if (!stats.byType[gift.giftId]) {
          stats.byType[gift.giftId] = { count: 0, value: 0 };
        }
        stats.byType[gift.giftId].count += 1;
        stats.byType[gift.giftId].value += gift.giftValue || 0;
        return stats;
      }, { totalValue: 0, count: 0, byType: {} });
      
      return {
        room,
        danmakuCount: danmakuList.length,
        giftCount: giftList.length,
        hotWords,
        giftStats,
        avgViewers: room.maxViewers > 0 ? Math.round(room.viewerCount / 2) : 0
      };
    } catch (error) {
      console.error('获取直播统计失败:', error);
      return null;
    }
  }
}

module.exports = LiveService;