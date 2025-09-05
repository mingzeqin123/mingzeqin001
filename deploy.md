# 部署指南

本文档说明如何将跳一跳游戏部署到微信小程序平台。

## 📋 部署前准备

### 1. 微信小程序账号
- 注册微信小程序账号：https://mp.weixin.qq.com/
- 获取AppID（小程序ID）
- 配置服务器域名（如果需要）

### 2. 开发工具
- 下载微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 安装并登录开发者工具

### 3. 必需资源文件

#### Three.js库文件
1. 访问 https://threejs.org/
2. 下载最新版本的Three.js
3. 将 `three.min.js` 文件复制到 `/pages/game/libs/` 目录
4. 替换现有的模拟文件

#### 音效文件（可选）
在 `/sounds/` 目录添加以下音效文件：
- `jump.mp3` - 跳跃音效
- `land.mp3` - 落地音效
- `perfect.mp3` - 完美落地音效
- `gameover.mp3` - 游戏结束音效
- `score.mp3` - 得分音效

#### 图片资源（可选）
在 `/images/` 目录添加以下图片文件：
- `share.png` - 分享图片 (500x400px)
- `icon.png` - 游戏图标 (144x144px)

## 🚀 部署步骤

### 步骤1：项目配置
1. 打开 `project.config.json`
2. 修改 `appid` 字段为你的小程序AppID：
   ```json
   {
     "appid": "你的小程序AppID",
     "projectname": "jump-jump-game"
   }
   ```

### 步骤2：导入项目
1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择项目根目录
4. 输入项目名称和AppID
5. 点击"导入"

### 步骤3：本地调试
1. 在开发者工具中点击"编译"
2. 在模拟器中测试游戏功能
3. 检查控制台是否有错误信息
4. 调试游戏逻辑和性能

### 步骤4：真机预览
1. 点击"预览"按钮
2. 使用微信扫描二维码
3. 在真机上测试游戏性能
4. 检查兼容性问题

### 步骤5：上传代码
1. 确保所有功能正常
2. 点击"上传"按钮
3. 填写版本号和项目备注
4. 点击"上传"

### 步骤6：提交审核
1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入"开发管理" -> "开发版本"
3. 找到刚上传的版本，点击"提交审核"
4. 填写审核信息：
   - 功能页面：pages/game/game
   - 功能描述：跳一跳小游戏
   - 测试帐号：提供测试账号（如需要）

### 步骤7：发布上线
1. 等待审核通过（通常1-7个工作日）
2. 审核通过后，在"线上版本"中点击"发布"
3. 游戏正式上线

## ⚙️ 配置说明

### 小程序配置 (app.json)
```json
{
  "pages": [
    "pages/game/game"
  ],
  "window": {
    "navigationBarTitleText": "跳一跳",
    "backgroundColor": "#87CEEB"
  }
}
```

### 页面配置 (game.json)
```json
{
  "navigationBarTitleText": "跳一跳",
  "navigationStyle": "custom",
  "disableScroll": true
}
```

### 项目配置 (project.config.json)
```json
{
  "appid": "你的AppID",
  "projectname": "jump-jump-game",
  "libVersion": "2.19.4",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "minified": true
  }
}
```

## 🔍 常见问题

### Q1: Three.js库文件过大
**解决方案：**
- 使用压缩版本的Three.js
- 只导入需要的模块
- 考虑使用CDN加载

### Q2: 游戏性能不佳
**解决方案：**
- 降低模型复杂度
- 减少粒子数量
- 优化渲染循环
- 使用对象池

### Q3: 音效无法播放
**解决方案：**
- 检查音效文件格式（推荐MP3）
- 确保文件大小合理（<500KB）
- 使用wx.createInnerAudioContext()

### Q4: 真机上白屏
**解决方案：**
- 检查WebGL兼容性
- 查看控制台错误信息
- 降低渲染质量
- 添加错误处理

### Q5: 分享功能异常
**解决方案：**
- 检查分享图片路径
- 确保图片尺寸正确
- 测试分享回调函数

## 📊 性能监控

### 性能指标
- **FPS**：目标60fps，最低30fps
- **内存使用**：<100MB
- **包大小**：<2MB
- **启动时间**：<3秒

### 监控代码
```javascript
// 在game.js中添加性能监控
const performanceMonitor = new PerformanceMonitor()

// 在渲染循环中更新
performanceMonitor.update()

// 定期输出性能数据
setInterval(() => {
  console.log('FPS:', performanceMonitor.getFPS())
  console.log('Memory:', wx.getMemoryInfo?.())
}, 5000)
```

## 🔒 安全注意事项

1. **代码混淆**：上线前对关键代码进行混淆
2. **资源保护**：重要资源文件进行加密
3. **数据验证**：对用户输入进行验证
4. **防作弊**：添加基础的防作弊机制

## 📈 运营建议

1. **数据统计**：接入小程序数据助手
2. **用户反馈**：添加反馈入口
3. **版本迭代**：定期更新游戏内容
4. **社交传播**：优化分享功能

## 🆘 技术支持

如遇到部署问题，可以通过以下方式获取帮助：

1. **官方文档**：https://developers.weixin.qq.com/miniprogram/dev/
2. **开发者社区**：https://developers.weixin.qq.com/community/
3. **GitHub Issues**：在项目仓库提交问题
4. **技术群组**：加入相关技术交流群

---

按照这个指南，你应该能够成功将跳一跳游戏部署到微信小程序平台。祝你部署顺利！🎉