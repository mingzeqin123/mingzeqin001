# Sonos 集成使用指南

## 概述

本项目已成功集成 Sonos 公开接口，为跳一跳游戏提供增强的音频体验。通过 Sonos 设备，玩家可以享受高质量的游戏音效和语音反馈。

## 功能特性

### 🎵 音频功能
- **游戏音效**：跳跃、落地、完美落地等音效
- **语音反馈**：TTS 语音提示游戏状态
- **背景音乐**：可选的背景音乐播放
- **音量控制**：动态调整音频音量

### 🔧 技术特性
- **多设备支持**：支持多个 Sonos 设备
- **自动降级**：Sonos 不可用时自动使用本地音效
- **配置管理**：简单的配置界面
- **状态监控**：实时连接状态监控

## 快速开始

### 1. 获取 Sonos API 密钥

1. 访问 [Sonos 开发者网站](https://developer.sonos.com)
2. 注册开发者账号
3. 创建新的 Control Integration
4. 获取 API Key 和 API Secret

### 2. 配置 Sonos 设备

1. 在游戏中点击 🔊 按钮
2. 输入 API Key 和 API Secret
3. 点击"连接 Sonos"
4. 选择家庭和播放器
5. 点击"测试连接"验证配置

### 3. 开始游戏

配置完成后，游戏将自动使用 Sonos 设备播放音效：
- 游戏开始时播放"游戏开始！"
- 跳跃时播放"跳跃！"
- 落地时播放"落地成功！"
- 完美落地时播放"完美落地！"
- 游戏结束时播放"游戏结束！"
- 新纪录时播放"新纪录！X分！"

## 技术实现

### 核心组件

#### 1. Sonos API 客户端 (`utils/sonos-api.js`)
```javascript
// 初始化 Sonos API
await sonosAPI.initialize(apiKey, apiSecret)

// 播放游戏音效
await sonosAPI.playGameSound(householdId, playerId, 'jump')

// 播放 TTS 语音
await sonosAPI.playTTS(householdId, playerId, '游戏开始！')
```

#### 2. 增强音频管理器 (`utils/enhanced-audio-manager.js`)
```javascript
// 播放游戏音效（自动选择最佳音频源）
await enhancedAudioManager.playGameSound('jump')

// 设置音频开关
enhancedAudioManager.setAudioEnabled(true)
enhancedAudioManager.setMusicEnabled(true)
enhancedAudioManager.setSoundEnabled(true)
```

#### 3. 游戏引擎集成 (`pages/game/gameEngine.js`)
```javascript
// 在游戏事件中播放音效
this.playGameSound('start')      // 游戏开始
this.playGameSound('jump')       // 跳跃
this.playGameSound('perfect')    // 完美落地
this.playGameSound('gameOver')   // 游戏结束
```

### API 接口

#### Sonos Control API
- **认证**：OAuth 2.0 客户端凭证模式
- **音频播放**：audioClip 命名空间
- **设备控制**：播放、暂停、音量控制
- **状态查询**：播放状态、设备信息

#### 支持的音效类型
- `start` - 游戏开始
- `jump` - 跳跃
- `landing` - 普通落地
- `perfect` - 完美落地
- `gameOver` - 游戏结束
- `newRecord` - 新纪录

## 配置选项

### 音频设置
```javascript
{
  "audioEnabled": true,    // 总音频开关
  "musicEnabled": true,    // 背景音乐开关
  "soundEnabled": true,    // 音效开关
  "volume": 20             // 音量 (0-100)
}
```

### Sonos 配置
```javascript
{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "householdId": "household-id",
  "playerId": "player-id"
}
```

## 故障排除

### 常见问题

#### 1. 连接失败
- 检查 API 密钥是否正确
- 确保手机和 Sonos 设备在同一网络
- 验证 Sonos 设备是否在线

#### 2. 音效不播放
- 检查音频开关是否开启
- 确认 Sonos 设备音量设置
- 查看控制台错误信息

#### 3. TTS 语音问题
- 需要配置 Google TTS API 密钥
- 检查网络连接
- 验证语音内容格式

### 调试模式

启用调试模式查看详细日志：
```javascript
// 在控制台查看音频状态
console.log(enhancedAudioManager.getAudioStatus())

// 检查 Sonos 连接状态
console.log(await enhancedAudioManager.checkSonosConnection())
```

## 性能优化

### 音频预加载
- 音效按需加载，减少内存占用
- 使用对象池管理音频资源
- 实现音频缓存机制

### 网络优化
- 实现音频重试机制
- 使用 CDN 加速音频文件
- 压缩音频文件大小

## 扩展功能

### 自定义音效
```javascript
// 添加自定义音效
const customSound = {
  name: 'Custom Sound',
  appId: 'com.wechat.jumpgame',
  streamUrl: 'https://your-server.com/sound.mp3',
  volume: 20,
  clipType: 'CUSTOM'
}

await sonosAPI.playAudioClip(householdId, playerId, customSound)
```

### 多房间音频
```javascript
// 在多个房间播放音效
const rooms = ['living-room', 'bedroom', 'kitchen']
for (const room of rooms) {
  await sonosAPI.playGameSound(householdId, room, 'jump')
}
```

## 安全考虑

- API 密钥安全存储
- 使用 HTTPS 传输音频数据
- 实现访问权限控制
- 定期更新 API 密钥

## 更新日志

### v1.0.0 (2024-01-15)
- 初始 Sonos 集成
- 基础音频功能
- 配置界面
- TTS 语音支持

## 支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱：support@example.com

---

**注意**：使用 Sonos API 需要有效的开发者账号和 API 密钥。请确保遵守 Sonos 的使用条款和条件。