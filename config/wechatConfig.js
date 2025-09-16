/**
 * 微信公众平台配置
 * 请替换为您的实际配置信息
 */

const wechatConfig = {
  // 微信公众号配置
  appId: 'your_app_id_here', // 替换为您的微信公众号AppID
  appSecret: 'your_app_secret_here', // 替换为您的微信公众号AppSecret
  
  // 分享卡片配置
  shareCard: {
    // 默认分享卡片标题模板
    titleTemplate: '跳一跳挑战 - {playerName}获得了{score}分！',
    
    // 默认分享卡片描述模板
    descriptionTemplate: '快来挑战跳一跳，看看你能得多少分！当前最高分：{score}分',
    
    // 默认分享卡片图片
    defaultImageUrl: '/images/share.png',
    
    // 分享卡片跳转链接模板
    urlTemplate: '/pages/game/game?score={score}&from=share&player={playerName}',
    
    // 二维码有效期（秒）
    qrCodeExpireTime: 2592000, // 30天
  },
  
  // API配置
  api: {
    // 获取access_token的API
    getAccessTokenUrl: 'https://api.weixin.qq.com/cgi-bin/token',
    
    // 创建二维码的API
    createQRCodeUrl: 'https://api.weixin.qq.com/cgi-bin/qrcode/create',
    
    // 获取二维码图片的API
    getQRCodeImageUrl: 'https://mp.weixin.qq.com/cgi-bin/showqrcode',
  },
  
  // 错误消息配置
  errorMessages: {
    invalidConfig: '微信公众号配置无效，请检查AppID和AppSecret',
    networkError: '网络请求失败，请检查网络连接',
    apiError: '微信API调用失败',
    createCardFailed: '创建分享卡片失败',
    getTokenFailed: '获取access_token失败',
  }
}

module.exports = wechatConfig