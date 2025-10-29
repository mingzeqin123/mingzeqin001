# 网易云推流平台集成指南

## 概述

本直播系统集成了网易云推流平台，提供稳定的推流和拉流服务。

## 1. 网易云推流平台介绍

网易云推流平台是网易云信提供的专业直播推流服务，具有以下特点：

- **高可用性**：99.9%的服务可用性保证
- **低延迟**：端到端延迟控制在3秒以内
- **全球加速**：覆盖全球主要地区，提供CDN加速
- **多协议支持**：支持RTMP、HLS、HTTP-FLV等多种协议
- **录制功能**：支持直播录制和回放

## 2. 接入步骤

### 2.1 注册网易云信账号

1. 访问 [网易云信官网](https://yunxin.163.com/)
2. 注册并完成实名认证
3. 开通直播推流服务

### 2.2 创建应用

1. 登录网易云信控制台
2. 创建新应用，选择"直播推流"服务
3. 获取AppKey和AppSecret

### 2.3 配置环境变量

在服务器环境变量中配置以下信息：

```bash
# 网易云推流配置
NETEASE_APP_KEY=your-app-key
NETEASE_APP_SECRET=your-app-secret
NETEASE_BASE_URL=https://vcloud.163.com
```

### 2.4 安装SDK

```bash
npm install @netease-im/nim-sdk
```

## 3. API接口说明

### 3.1 创建推流频道

```javascript
// 创建推流频道
const channelInfo = await neteaseService.createChannel(roomId, title, cover);
```

**参数说明：**
- `roomId`: 直播间ID
- `title`: 直播标题
- `cover`: 封面图片URL

**返回数据：**
```javascript
{
  cid: "频道ID",
  pushUrl: "推流地址",
  httpPullUrl: "HTTP拉流地址",
  hlsPullUrl: "HLS拉流地址",
  rtmpPullUrl: "RTMP拉流地址"
}
```

### 3.2 获取推流地址

```javascript
// 获取推流地址
const pushInfo = await neteaseService.getPushUrl(roomId, title, cover);
```

### 3.3 获取频道状态

```javascript
// 获取频道状态
const status = await neteaseService.getChannelStatus(roomId);
```

**返回数据：**
```javascript
{
  status: 0, // 0: 空闲, 1: 直播中
  userCount: 100, // 观看人数
  duration: 3600 // 直播时长(秒)
}
```

### 3.4 设置录制

```javascript
// 开启录制
await neteaseService.setChannelRecord(roomId, true);

// 关闭录制
await neteaseService.setChannelRecord(roomId, false);
```

## 4. 推流地址格式

### 4.1 RTMP推流地址

```
rtmp://push-rtmp-l1.pub.netease.im/live/{频道ID}?token={推流令牌}
```

### 4.2 HTTP拉流地址

```
http://pull-flv-l1.pub.netease.im/live/{频道ID}.flv
```

### 4.3 HLS拉流地址

```
http://pull-hls-l1.pub.netease.im/live/{频道ID}.m3u8
```

### 4.4 RTMP拉流地址

```
rtmp://pull-rtmp-l1.pub.netease.im/live/{频道ID}
```

## 5. 推流参数配置

### 5.1 视频参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 分辨率 | 720p (1280x720) | 平衡画质和带宽 |
| 码率 | 1000-2000 kbps | 根据网络情况调整 |
| 帧率 | 25-30 fps | 流畅度保证 |
| 编码格式 | H.264 | 兼容性最好 |

### 5.2 音频参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 采样率 | 44100 Hz | 标准采样率 |
| 码率 | 128 kbps | 音质保证 |
| 声道 | 立体声 | 更好的听觉体验 |
| 编码格式 | AAC | 压缩效率高 |

## 6. 错误处理

### 6.1 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1001 | 连接成功 | 正常状态 |
| 1002 | 连接服务器失败 | 检查网络连接 |
| 1003 | 推流开始 | 正常状态 |
| 1004 | 推流结束 | 正常状态 |
| 1007 | 推流中断 | 检查网络稳定性 |
| 2001 | 播放连接成功 | 正常状态 |
| 2002 | 播放连接失败 | 检查拉流地址 |
| 2003 | 播放开始 | 正常状态 |
| 2004 | 播放结束 | 正常状态 |
| 2007 | 播放中断 | 检查网络连接 |

### 6.2 错误处理示例

```javascript
// 推流状态监听
livePusher.on('statechange', (res) => {
  const { code, message } = res.detail;
  
  switch (code) {
    case 1001:
      console.log('推流连接成功');
      break;
    case 1002:
      console.error('推流连接失败:', message);
      // 重连逻辑
      break;
    case 1007:
      console.warn('推流中断:', message);
      // 检查网络状态
      break;
  }
});
```

## 7. 性能优化

### 7.1 推流优化

1. **码率自适应**：根据网络状况动态调整码率
2. **分辨率适配**：根据设备性能选择合适的分辨率
3. **帧率控制**：保持稳定的帧率输出
4. **编码优化**：使用硬件编码加速

### 7.2 拉流优化

1. **CDN加速**：使用就近的CDN节点
2. **协议选择**：根据场景选择合适的拉流协议
3. **缓存策略**：合理设置缓存参数
4. **预加载**：提前加载关键帧

## 8. 监控和统计

### 8.1 推流监控

```javascript
// 获取推流统计
const stats = await neteaseService.getStreamStats(roomId);
console.log('推流统计:', stats);
```

**统计信息包括：**
- 码率 (bitrate)
- 帧率 (fps)
- 分辨率 (resolution)
- 直播时长 (duration)
- 观看人数 (userCount)

### 8.2 质量监控

1. **网络质量**：监控网络延迟和丢包率
2. **推流质量**：监控推流稳定性和画质
3. **用户体验**：监控观看流畅度和卡顿率

## 9. 安全配置

### 9.1 推流鉴权

```javascript
// 生成推流令牌
const token = generatePushToken(roomId, timestamp, nonce);
```

### 9.2 拉流防盗链

```javascript
// 生成防盗链签名
const signature = generatePullSignature(url, timestamp, secret);
```

## 10. 测试和调试

### 10.1 推流测试

1. 使用OBS Studio等推流工具测试
2. 检查推流地址和参数配置
3. 监控推流状态和统计信息

### 10.2 拉流测试

1. 使用VLC等播放器测试拉流地址
2. 检查不同协议下的播放效果
3. 测试不同网络环境下的播放质量

## 11. 常见问题

### 11.1 推流失败

**可能原因：**
- 推流地址错误
- 网络连接问题
- 推流参数不匹配
- 服务器限制

**解决方案：**
- 检查推流地址格式
- 测试网络连接
- 调整推流参数
- 联系技术支持

### 11.2 播放卡顿

**可能原因：**
- 网络带宽不足
- 服务器负载过高
- 拉流地址问题
- 设备性能不足

**解决方案：**
- 降低推流码率
- 使用CDN加速
- 检查拉流地址
- 升级设备性能

## 12. 技术支持

- 官方文档：https://dev.yunxin.163.com/
- 技术支持：support@yunxin.163.com
- 开发者社区：https://bbs.yunxin.163.com/

## 13. 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持基础推流和拉流功能
- 集成网易云推流平台API
- 实现完整的直播流程