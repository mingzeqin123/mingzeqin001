/**
 * 微信分享卡片工具类
 * 用于获取微信公众号分享小卡片的ticket
 */

const wechatConfig = require('../config/wechatConfig.js')

class WechatShareCard {
  constructor() {
    this.appId = wechatConfig.appId // 微信公众号的AppID
    this.appSecret = wechatConfig.appSecret // 微信公众号的AppSecret
    this.accessToken = ''
    this.accessTokenExpireTime = 0
  }

  /**
   * 设置微信公众号配置
   * @param {string} appId - 微信公众号AppID
   * @param {string} appSecret - 微信公众号AppSecret
   */
  setConfig(appId, appSecret) {
    this.appId = appId
    this.appSecret = appSecret
  }

  /**
   * 获取access_token
   * @returns {Promise<string>} access_token
   */
  async getAccessToken() {
    // 检查access_token是否还有效
    if (this.accessToken && Date.now() < this.accessTokenExpireTime) {
      return this.accessToken
    }

    try {
      const response = await wx.request({
        url: wechatConfig.api.getAccessTokenUrl,
        method: 'GET',
        data: {
          grant_type: 'client_credential',
          appid: this.appId,
          secret: this.appSecret
        }
      })

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token
        // access_token有效期为7200秒，提前5分钟过期
        this.accessTokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000
        return this.accessToken
      } else {
        throw new Error('获取access_token失败: ' + JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('获取access_token失败:', error)
      throw error
    }
  }

  /**
   * 创建分享卡片ticket
   * @param {Object} cardData - 卡片数据
   * @param {string} cardData.title - 卡片标题
   * @param {string} cardData.description - 卡片描述
   * @param {string} cardData.imageUrl - 卡片图片URL
   * @param {string} cardData.url - 卡片跳转链接
   * @returns {Promise<string>} ticket
   */
  async createShareCardTicket(cardData) {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await wx.request({
        url: `${wechatConfig.api.createQRCodeUrl}?access_token=${accessToken}`,
        method: 'POST',
        data: {
          action_name: 'QR_LIMIT_STR_SCENE',
          action_info: {
            scene: {
              scene_str: JSON.stringify({
                type: 'share_card',
                title: cardData.title,
                description: cardData.description,
                imageUrl: cardData.imageUrl,
                url: cardData.url,
                timestamp: Date.now()
              })
            }
          }
        }
      })

      if (response.data && response.data.ticket) {
        return response.data.ticket
      } else {
        throw new Error('创建分享卡片ticket失败: ' + JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('创建分享卡片ticket失败:', error)
      throw error
    }
  }

  /**
   * 获取分享卡片二维码URL
   * @param {string} ticket - 分享卡片ticket
   * @returns {string} 二维码URL
   */
  getShareCardQRCodeUrl(ticket) {
    return `${wechatConfig.api.getQRCodeImageUrl}?ticket=${encodeURIComponent(ticket)}`
  }

  /**
   * 创建游戏分享卡片
   * @param {Object} gameData - 游戏数据
   * @param {number} gameData.score - 游戏分数
   * @param {string} gameData.playerName - 玩家名称
   * @returns {Promise<Object>} 分享卡片信息
   */
  async createGameShareCard(gameData) {
    const cardData = {
      title: wechatConfig.shareCard.titleTemplate
        .replace('{playerName}', gameData.playerName || '玩家')
        .replace('{score}', gameData.score),
      description: wechatConfig.shareCard.descriptionTemplate
        .replace('{score}', gameData.score),
      imageUrl: wechatConfig.shareCard.defaultImageUrl,
      url: wechatConfig.shareCard.urlTemplate
        .replace('{score}', gameData.score)
        .replace('{playerName}', encodeURIComponent(gameData.playerName || '玩家'))
    }

    try {
      const ticket = await this.createShareCardTicket(cardData)
      const qrCodeUrl = this.getShareCardQRCodeUrl(ticket)
      
      return {
        ticket,
        qrCodeUrl,
        cardData,
        success: true
      }
    } catch (error) {
      console.error('创建游戏分享卡片失败:', error)
      return {
        ticket: null,
        qrCodeUrl: null,
        cardData,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 分享到微信好友（带卡片）
   * @param {Object} shareData - 分享数据
   * @returns {Promise<Object>} 分享结果
   */
  async shareToFriend(shareData) {
    try {
      const cardResult = await this.createGameShareCard(shareData)
      
      if (cardResult.success) {
        // 使用微信小程序的分享API
        return {
          title: shareData.title || cardResult.cardData.title,
          path: shareData.path || cardResult.cardData.url,
          imageUrl: shareData.imageUrl || cardResult.cardData.imageUrl,
          success: true,
          ticket: cardResult.ticket,
          qrCodeUrl: cardResult.qrCodeUrl
        }
      } else {
        throw new Error('创建分享卡片失败: ' + cardResult.error)
      }
    } catch (error) {
      console.error('分享到微信好友失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 创建单例实例
const wechatShareCard = new WechatShareCard()

// 导出实例和类
module.exports = {
  WechatShareCard,
  wechatShareCard
}