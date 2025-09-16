# 微信公众号分享小卡片 Ticket 获取服务

本项目提供了一个完整的解决方案来获取微信公众号分享小卡片所需的 `jsapi_ticket`，并实现自定义分享功能。

## 功能特性

- 🎯 自动获取和缓存 `access_token`
- 🎫 自动获取和缓存 `jsapi_ticket`
- ✍️ 自动生成 JS-SDK 签名
- 🔄 智能缓存机制，避免频繁请求
- 🌐 RESTful API 接口
- 📱 完整的前端示例

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置微信公众号信息

编辑 `wechat-ticket-server.js` 文件，替换以下配置：

```javascript
const config = {
    appId: 'YOUR_APPID',        // 替换为您的公众号AppID
    appSecret: 'YOUR_APPSECRET', // 替换为您的公众号AppSecret
};
```

### 3. 启动服务器

```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 4. 配置微信公众号

1. 登录微信公众号平台
2. 进入 "公众号设置" -> "功能设置"
3. 配置 "JS接口安全域名"，填入您网站的域名（不包含协议和端口）

## API 接口

### 获取 Access Token

```
GET /api/wechat/access_token
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "access_token": "ACCESS_TOKEN",
    "expires_at": 1640995200000
  }
}
```

### 获取 JSApi Ticket

```
GET /api/wechat/jsapi_ticket
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "jsapi_ticket": "JSAPI_TICKET",
    "expires_at": 1640995200000
  }
}
```

### 获取 JS-SDK 配置

```
POST /api/wechat/js_config
Content-Type: application/json

{
  "url": "https://your-domain.com/page"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "appId": "YOUR_APPID",
    "timestamp": "1640995200",
    "nonceStr": "randomstring",
    "signature": "signature_hash",
    "jsApiList": [
      "updateAppMessageShareData",
      "updateTimelineShareData"
    ]
  }
}
```

## 前端使用示例

### 1. 引入微信 JS-SDK

```html
<script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
```

### 2. 获取配置并初始化

```javascript
// 获取JS-SDK配置
const response = await fetch('/api/wechat/js_config', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        url: window.location.href.split('#')[0]
    })
});

const result = await response.json();
const config = result.data;

// 配置微信JS-SDK
wx.config({
    debug: false,
    appId: config.appId,
    timestamp: config.timestamp,
    nonceStr: config.nonceStr,
    signature: config.signature,
    jsApiList: config.jsApiList
});
```

### 3. 配置分享内容

```javascript
wx.ready(function () {
    // 分享给朋友
    wx.updateAppMessageShareData({
        title: '分享标题',
        desc: '分享描述',
        link: '分享链接',
        imgUrl: '缩略图链接',
        success: function () {
            console.log('分享配置成功');
        }
    });
    
    // 分享到朋友圈
    wx.updateTimelineShareData({
        title: '分享标题',
        link: '分享链接',
        imgUrl: '缩略图链接',
        success: function () {
            console.log('朋友圈分享配置成功');
        }
    });
});
```

## 测试页面

打开 `wechat-share-example.html` 文件可以测试分享功能：

1. 在浏览器中打开 `wechat-share-example.html`
2. 确保服务器已启动
3. 点击 "测试获取Ticket" 验证服务是否正常
4. 填写分享信息
5. 点击 "初始化微信分享"
6. 在微信中访问页面测试分享效果

## 注意事项

### 安全域名配置

- 必须在微信公众号平台配置 JS 接口安全域名
- 域名不需要包含协议（http/https）
- 域名不需要包含端口号
- 支持配置多个域名

### Token 缓存机制

- `access_token` 有效期 7200 秒（2小时）
- `jsapi_ticket` 有效期 7200 秒（2小时）
- 系统自动缓存，避免频繁请求
- 缓存提前 5 分钟过期，确保可用性

### 签名算法

签名字符串格式：
```
jsapi_ticket=TICKET&noncestr=NONCESTR&timestamp=TIMESTAMP&url=URL
```

使用 SHA1 算法生成签名。

### 常见问题

1. **invalid signature 错误**
   - 检查 JS 接口安全域名配置
   - 确认 URL 参数正确（不包含 hash 部分）
   - 验证时间戳和签名生成逻辑

2. **access_token 获取失败**
   - 检查 AppID 和 AppSecret 配置
   - 确认公众号类型支持相关接口
   - 检查网络连接和防火墙设置

3. **分享不生效**
   - 确保在微信内置浏览器中测试
   - 检查分享链接是否可访问
   - 验证图片链接是否有效

## 技术支持

如果您在使用过程中遇到问题，请检查：

1. 服务器日志输出
2. 浏览器控制台错误信息
3. 微信开发者工具调试信息

## 许可证

MIT License