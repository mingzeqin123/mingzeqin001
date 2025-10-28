# Sono公开接口文档

Sono公开接口提供了统一的API入口，让开发者能够轻松集成和使用应用的核心功能，包括水印处理、游戏引擎、工具函数等。

## 🚀 快速开始

### 安装和初始化

```javascript
const sonoInterface = require('./api/sono-interface.js');

// 初始化接口
await sonoInterface.initialize({
  enableWatermark: true,
  enableGameEngine: true,
  enableUtilities: true,
  enableStorage: true
});

// 获取接口信息
console.log(sonoInterface.getInfo());
```

## 📋 API功能概览

### 1. 水印处理API (`sonoInterface.watermark`)

提供强大的图片水印处理能力，支持文字水印和图片水印。

#### 添加文字水印

```javascript
// 基础文字水印
const result = await sonoInterface.watermark.addText('/path/to/image.jpg', {
  text: '版权所有',
  position: 'bottom-right',
  color: '#FFFFFF',
  fontSize: 20,
  opacity: 0.8
});

// 自定义位置水印
const result2 = await sonoInterface.watermark.addText('/path/to/image.jpg', {
  text: '自定义水印',
  x: 0.1,  // 相对位置 (0-1)
  y: 0.9,
  color: '#FF0000',
  fontSize: 24,
  opacity: 0.7
});
```

#### 添加图片水印

```javascript
const result = await sonoInterface.watermark.addImage(
  '/path/to/original.jpg',
  '/path/to/watermark.png',
  {
    position: 'top-right',
    width: 100,
    height: 50,
    opacity: 0.6
  }
);
```

#### 批量处理

```javascript
const imagePaths = ['/path/1.jpg', '/path/2.jpg', '/path/3.jpg'];
const config = {
  type: 'text',
  text: '批量水印',
  position: 'bottom-right'
};

const results = await sonoInterface.watermark.batchProcess(
  imagePaths,
  config,
  (progress) => {
    console.log(`处理进度: ${progress.completed}/${progress.total}`);
  }
);
```

#### 获取预设配置

```javascript
const presets = sonoInterface.watermark.getPresets();
console.log(presets.positions);  // ['top-left', 'top-right', ...]
console.log(presets.textStyles); // { small: {...}, medium: {...}, large: {...} }
console.log(presets.colors);     // ['#FFFFFF', '#000000', ...]
```

### 2. 游戏引擎API (`sonoInterface.gameEngine`)

提供3D游戏开发的核心组件和工具。

#### 创建游戏实例

```javascript
const game = sonoInterface.gameEngine.createGame({
  width: 800,
  height: 600,
  enablePhysics: true,
  enableShadows: true
});

// 启动游戏
game.start();
```

#### 创建游戏对象

```javascript
// 创建玩家
const player = sonoInterface.gameEngine.createPlayer({
  position: { x: 0, y: 0, z: 0 },
  color: '#FF0000'
});

// 创建方块
const block = sonoInterface.gameEngine.createBlock({
  type: 'normal',
  position: { x: 2, y: 0, z: 0 },
  size: { width: 1, height: 0.2, depth: 1 }
});
```

#### 获取游戏工具

```javascript
const gameUtils = sonoInterface.gameEngine.getUtils();

// 使用工具函数
const interpolated = gameUtils.lerp(0, 100, 0.5); // 50
const eased = gameUtils.easeOutQuart(0.5);
const distance = gameUtils.distance3D(0, 0, 0, 1, 1, 1);
```

### 3. 工具函数API (`sonoInterface.utils`)

提供丰富的数学、动画、颜色等工具函数。

#### 数学工具

```javascript
const { math } = sonoInterface.utils;

// 线性插值
const value = math.lerp(0, 100, 0.3); // 30

// 限制范围
const clamped = math.clamp(150, 0, 100); // 100

// 随机数
const randomFloat = math.random(0, 1);
const randomInt = math.randomInt(1, 6);

// 距离计算
const dist2D = math.distance(0, 0, 3, 4); // 5
const dist3D = math.distance3D(0, 0, 0, 1, 1, 1); // √3

// 角度转换
const radians = math.degToRad(90); // π/2
const degrees = math.radToDeg(Math.PI); // 180
```

#### 缓动函数

```javascript
const { easing } = sonoInterface.utils;

// 不同的缓动效果
const easeOut = easing.easeOutQuart(0.5);
const easeIn = easing.easeInQuart(0.5);
const easeInOut = easing.easeInOutCubic(0.5);
const elastic = easing.easeOutElastic(0.8);
const bounce = easing.easeOutBounce(0.9);
```

#### 颜色工具

```javascript
const { color } = sonoInterface.utils;

// 颜色转换
const rgb = color.hexToRgb('#FF5733'); // {r: 255, g: 87, b: 51}
const hex = color.rgbToHex(255, 87, 51); // '#FF5733'

// 随机颜色
const randomColor = color.randomColor(); // '#A1B2C3'
```

#### 性能监控

```javascript
const monitor = sonoInterface.utils.performance.createMonitor();

monitor.start('render');
// ... 渲染代码 ...
monitor.end('render');

const stats = monitor.getStats();
console.log(`平均渲染时间: ${stats.render.average}ms`);
```

### 4. 存储API (`sonoInterface.storage`)

提供跨平台的数据存储功能。

```javascript
// 存储数据
await sonoInterface.storage.set('userScore', 1500);
await sonoInterface.storage.set('gameSettings', {
  volume: 0.8,
  difficulty: 'normal'
});

// 读取数据
const score = await sonoInterface.storage.get('userScore', 0);
const settings = await sonoInterface.storage.get('gameSettings', {});

// 删除数据
await sonoInterface.storage.remove('oldData');

// 清空所有数据
await sonoInterface.storage.clear();
```

### 5. 事件系统API (`sonoInterface.events`)

提供事件发布订阅机制。

```javascript
// 监听事件
sonoInterface.events.on('gameStart', (data) => {
  console.log('游戏开始:', data);
});

// 发布事件
sonoInterface.events.emit('gameStart', { level: 1, player: 'Alice' });

// 一次性监听
sonoInterface.events.once('gameEnd', (score) => {
  console.log('游戏结束，得分:', score);
});

// 移除监听
const handler = (data) => console.log(data);
sonoInterface.events.on('test', handler);
sonoInterface.events.off('test', handler);
```

## 🔧 高级用法

### 错误处理

所有API调用都会返回标准化的错误信息：

```javascript
try {
  const result = await sonoInterface.watermark.addText('invalid-path', {});
} catch (error) {
  console.error('错误代码:', error.code);
  console.error('错误信息:', error.message);
  console.error('发生时间:', error.timestamp);
}
```

### 配置选项

初始化时可以传入详细配置：

```javascript
await sonoInterface.initialize({
  enableWatermark: true,
  enableGameEngine: false,  // 如果不需要游戏功能
  enableUtilities: true,
  enableStorage: true,
  apiKeys: {
    // 如果需要外部服务的API密钥
  }
});
```

### 链式调用

部分API支持链式调用：

```javascript
sonoInterface.events
  .on('start', handler1)
  .on('update', handler2)
  .on('end', handler3);
```

## 📱 平台兼容性

- **微信小程序**: 完整支持所有功能
- **浏览器**: 支持大部分功能（游戏引擎需要WebGL支持）
- **Node.js**: 支持工具函数和存储API（不支持图形相关功能）

## ⚠️ 注意事项

1. **初始化**: 使用任何API前必须先调用 `initialize()`
2. **异步操作**: 大部分API都是异步的，需要使用 `await` 或 `.then()`
3. **错误处理**: 建议使用 try-catch 包装API调用
4. **资源管理**: 游戏引擎相关对象使用完后记得销毁以释放内存
5. **路径格式**: 图片路径支持相对路径、绝对路径和临时文件路径

## 🔍 调试技巧

```javascript
// 启用调试模式
await sonoInterface.initialize({
  debug: true,
  logLevel: 'verbose'
});

// 查看接口状态
console.log(sonoInterface.getInfo());

// 监听内部事件
sonoInterface.events.on('debug', (info) => {
  console.log('调试信息:', info);
});
```

## 📞 支持与反馈

如果在使用过程中遇到问题或有功能建议，请：

1. 查看错误代码和消息
2. 检查初始化配置
3. 确认平台兼容性
4. 提交Issue或联系开发团队

---

**Sono Interface v1.0.0** - 让应用能力触手可及