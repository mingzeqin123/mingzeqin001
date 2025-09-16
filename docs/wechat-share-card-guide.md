# 微信公众号分享卡片Ticket获取指南

## 功能概述

本功能允许您获取微信公众号分享小卡片的ticket，用于创建可分享的二维码卡片。当用户分享游戏成绩时，可以生成一个包含游戏信息的分享卡片。

## 配置步骤

### 1. 微信公众号配置

在 `config/wechatConfig.js` 文件中配置您的微信公众号信息：

```javascript
const wechatConfig = {
  appId: 'your_app_id_here', // 替换为您的微信公众号AppID
  appSecret: 'your_app_secret_here', // 替换为您的微信公众号AppSecret
  // ... 其他配置
}
```

### 2. 获取微信公众号AppID和AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" -> "基本配置"
3. 获取AppID和AppSecret

## 使用方法

### 在游戏页面中使用

```javascript
// 获取分享卡片ticket
async getShareCardTicket() {
  try {
    await this.createShareCardTicket()
    return this.data.shareCardTicket
  } catch (error) {
    console.error('获取分享卡片ticket失败:', error)
    return null
  }
}
```

### 直接调用工具类

```javascript
const { wechatShareCard } = require('../../utils/wechatShare.js')

// 创建游戏分享卡片
const shareData = {
  score: 100,
  playerName: '玩家',
  bestScore: 150
}

const result = await wechatShareCard.createGameShareCard(shareData)
if (result.success) {
  console.log('Ticket:', result.ticket)
  console.log('二维码URL:', result.qrCodeUrl)
}
```

## API说明

### WechatShareCard类方法

#### `createGameShareCard(gameData)`
创建游戏分享卡片

**参数：**
- `gameData.score` (number): 游戏分数
- `gameData.playerName` (string): 玩家名称
- `gameData.bestScore` (number): 最高分

**返回值：**
```javascript
{
  ticket: 'ticket字符串',
  qrCodeUrl: '二维码图片URL',
  cardData: '卡片数据对象',
  success: true/false,
  error: '错误信息（如果失败）'
}
```

#### `getShareCardTicket(cardData)`
创建分享卡片ticket

**参数：**
- `cardData.title` (string): 卡片标题
- `cardData.description` (string): 卡片描述
- `cardData.imageUrl` (string): 卡片图片URL
- `cardData.url` (string): 卡片跳转链接

#### `getShareCardQRCodeUrl(ticket)`
获取分享卡片二维码URL

**参数：**
- `ticket` (string): 分享卡片ticket

## 界面功能

在游戏结束界面，用户可以看到三个按钮：

1. **再来一局** - 重新开始游戏
2. **分享成绩** - 使用微信原生分享功能
3. **获取分享卡片** - 创建分享卡片ticket

点击"获取分享卡片"按钮后：
- 系统会调用微信API创建分享卡片ticket
- 显示ticket和二维码URL信息
- 提供复制ticket到剪贴板的功能

## 错误处理

系统会处理以下错误情况：

1. **配置错误** - AppID或AppSecret无效
2. **网络错误** - 网络请求失败
3. **API错误** - 微信API调用失败
4. **创建失败** - 分享卡片创建失败

所有错误都会在控制台输出详细信息，并在界面上显示用户友好的错误提示。

## 注意事项

1. **安全性**：请勿将AppSecret提交到版本控制系统
2. **配额限制**：微信API有调用频率限制
3. **有效期**：access_token有效期为7200秒，系统会自动刷新
4. **二维码有效期**：生成的二维码有效期为30天

## 扩展功能

您可以通过修改 `config/wechatConfig.js` 来自定义：

- 分享卡片标题和描述模板
- 默认分享图片
- 跳转链接格式
- 错误消息文本

## 测试建议

1. 在开发环境中使用测试AppID和AppSecret
2. 确保网络连接正常
3. 测试各种分数情况下的分享卡片生成
4. 验证ticket和二维码URL的有效性