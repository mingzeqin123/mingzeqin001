// 聊天管理器
const LIVE_CONFIG = require('../config/live-config.js');

class ChatManager {
  constructor(roomId) {
    this.roomId = roomId;
    this.messages = [];
    this.maxMessages = LIVE_CONFIG.chat.maxDisplayMessages;
    this.lastSendTime = 0;
    this.sendInterval = LIVE_CONFIG.chat.sendInterval;
    this.messageTypes = LIVE_CONFIG.chat.messageTypes;
    this.maxMessageLength = LIVE_CONFIG.chat.maxMessageLength;
    
    // 敏感词过滤
    this.sensitiveWords = [
      '广告', '加微信', 'QQ', '刷赞', '刷粉', '代刷', '外挂', '作弊'
    ];
    
    // 表情映射
    this.emojiMap = {
      '[微笑]': '😊',
      '[大笑]': '😂',
      '[爱心]': '❤️',
      '[点赞]': '👍',
      '[鼓掌]': '👏',
      '[玫瑰]': '🌹',
      '[礼物]': '🎁',
      '[火箭]': '🚀',
      '[皇冠]': '👑',
      '[钻石]': '💎'
    };
  }

  /**
   * 添加消息
   * @param {Object} message 消息对象
   */
  addMessage(message) {
    // 验证消息格式
    if (!this.validateMessage(message)) {
      return false;
    }

    // 处理消息内容
    const processedMessage = this.processMessage(message);
    
    // 添加到消息列表
    this.messages.push(processedMessage);
    
    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    
    return true;
  }

  /**
   * 验证消息
   * @param {Object} message 消息对象
   */
  validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return false;
    }

    // 检查必要字段
    if (!message.user || !message.user.id || !message.user.name) {
      return false;
    }

    // 检查消息类型
    if (!Object.values(this.messageTypes).includes(message.type)) {
      return false;
    }

    // 检查消息内容
    if (message.type === this.messageTypes.TEXT) {
      if (!message.content || typeof message.content !== 'string') {
        return false;
      }
      
      if (message.content.length > this.maxMessageLength) {
        return false;
      }
    }

    return true;
  }

  /**
   * 处理消息内容
   * @param {Object} message 原始消息
   */
  processMessage(message) {
    const processedMessage = {
      ...message,
      id: message.id || this.generateMessageId(),
      timestamp: message.timestamp || Date.now()
    };

    // 处理文本消息
    if (message.type === this.messageTypes.TEXT) {
      processedMessage.content = this.processTextContent(message.content);
    }

    return processedMessage;
  }

  /**
   * 处理文本内容
   * @param {string} content 原始文本
   */
  processTextContent(content) {
    let processedContent = content.trim();
    
    // 敏感词过滤
    processedContent = this.filterSensitiveWords(processedContent);
    
    // 表情转换
    processedContent = this.convertEmojis(processedContent);
    
    return processedContent;
  }

  /**
   * 敏感词过滤
   * @param {string} content 文本内容
   */
  filterSensitiveWords(content) {
    let filteredContent = content;
    
    this.sensitiveWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredContent;
  }

  /**
   * 表情转换
   * @param {string} content 文本内容
   */
  convertEmojis(content) {
    let convertedContent = content;
    
    Object.keys(this.emojiMap).forEach(key => {
      const regex = new RegExp(key.replace(/[\[\]]/g, '\\$&'), 'g');
      convertedContent = convertedContent.replace(regex, this.emojiMap[key]);
    });
    
    return convertedContent;
  }

  /**
   * 检查发送频率限制
   * @param {string} userId 用户ID
   */
  checkSendLimit(userId) {
    const now = Date.now();
    if (now - this.lastSendTime < this.sendInterval) {
      return false;
    }
    this.lastSendTime = now;
    return true;
  }

  /**
   * 生成消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取消息列表
   */
  getMessages() {
    return this.messages;
  }

  /**
   * 清空消息
   */
  clearMessages() {
    this.messages = [];
  }

  /**
   * 删除消息
   * @param {string} messageId 消息ID
   */
  deleteMessage(messageId) {
    this.messages = this.messages.filter(msg => msg.id !== messageId);
  }

  /**
   * 获取用户消息统计
   * @param {string} userId 用户ID
   */
  getUserMessageStats(userId) {
    const userMessages = this.messages.filter(msg => msg.user.id === userId);
    return {
      totalCount: userMessages.length,
      textCount: userMessages.filter(msg => msg.type === this.messageTypes.TEXT).length,
      giftCount: userMessages.filter(msg => msg.type === this.messageTypes.GIFT).length
    };
  }

  /**
   * 创建系统消息
   * @param {string} content 消息内容
   */
  createSystemMessage(content) {
    return {
      id: this.generateMessageId(),
      type: this.messageTypes.SYSTEM,
      content: content,
      timestamp: Date.now(),
      user: {
        id: 'system',
        name: '系统',
        avatar: '/images/system-avatar.jpg'
      }
    };
  }

  /**
   * 创建礼物消息
   * @param {Object} user 用户信息
   * @param {Object} gift 礼物信息
   */
  createGiftMessage(user, gift) {
    return {
      id: this.generateMessageId(),
      type: this.messageTypes.GIFT,
      gift: gift,
      user: user,
      timestamp: Date.now()
    };
  }

  /**
   * 获取热门消息（点赞数最多）
   * @param {number} limit 限制数量
   */
  getPopularMessages(limit = 10) {
    return this.messages
      .filter(msg => msg.likes && msg.likes > 0)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }

  /**
   * 搜索消息
   * @param {string} keyword 关键词
   */
  searchMessages(keyword) {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }
    
    const searchTerm = keyword.toLowerCase();
    return this.messages.filter(msg => {
      if (msg.type === this.messageTypes.TEXT) {
        return msg.content.toLowerCase().includes(searchTerm);
      }
      return msg.user.name.toLowerCase().includes(searchTerm);
    });
  }
}

module.exports = ChatManager;