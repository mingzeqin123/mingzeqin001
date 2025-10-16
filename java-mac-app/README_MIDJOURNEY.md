# MidJourney 参数构建器

一个功能强大的 Java Web 应用程序，用于构建和自定义 MidJourney 图像生成参数。

## 🎯 功能特色

### 🚀 核心功能
- **智能参数构建**: 自动生成完整的 MidJourney 命令
- **预设模板**: 提供人像、风景、动漫等多种预设
- **实时预览**: 即时显示生成的命令
- **参数验证**: 自动验证参数有效性
- **智能建议**: 根据提示词自动推荐参数

### 🎨 支持的参数
- **基础参数**:
  - 主要提示词和负面提示词
  - 宽高比 (1:1, 4:5, 2:3, 9:16, 16:9 等)
  - 图像质量 (低/标准/高)
  - 风格化程度 (0-1000)
  - 混乱度 (0-100)

- **高级参数**:
  - 随机种子
  - 模型版本 (V6, V5.2, V5.1, Niji)
  - 艺术风格
  - 光照风格
  - 色彩调色板
  - 相机角度
  - 特殊模式 (平铺、奇异)

### 🌐 用户界面
- **响应式设计**: 支持桌面和移动设备
- **现代化UI**: 美观的渐变色彩和动画效果
- **直观操作**: 滑块、下拉菜单等易用控件
- **实时反馈**: 即时显示参数变化效果

## 🛠️ 技术架构

### 后端技术栈
- **Java 21**: 现代Java特性
- **Spring Boot 3.2**: Web框架和依赖注入
- **Maven**: 项目管理和构建工具
- **RESTful API**: 标准的API设计

### 前端技术栈
- **HTML5**: 语义化标记
- **CSS3**: 现代样式和动画
- **JavaScript ES6+**: 异步处理和DOM操作
- **Bootstrap 5**: 响应式UI框架
- **Font Awesome**: 图标库

### 项目结构
```
java-mac-app/
├── src/main/java/com/example/app/
│   ├── MidJourneyApplication.java     # 主应用程序类
│   ├── controller/
│   │   └── MidJourneyController.java  # REST API控制器
│   ├── model/
│   │   └── MidJourneyParameters.java  # 参数模型
│   ├── service/
│   │   └── MidJourneyService.java     # 业务逻辑服务
│   └── config/
│       └── WebConfig.java             # Web配置
├── src/main/resources/
│   ├── static/
│   │   ├── index.html                 # 前端页面
│   │   └── app.js                     # 前端JavaScript
│   └── application.properties         # 应用配置
└── pom.xml                           # Maven配置
```

## 🚀 快速开始

### 环境要求
- Java 21 或更高版本
- Maven 3.6 或更高版本
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd java-mac-app
   ```

2. **编译项目**
   ```bash
   mvn clean compile
   ```

3. **运行应用**
   ```bash
   mvn spring-boot:run
   ```
   或者
   ```bash
   java -jar target/mac-java-app-1.0.0.jar
   ```

4. **访问应用**
   - 打开浏览器访问: http://localhost:8080
   - 应用会自动打开浏览器页面

### Docker 部署 (可选)

1. **构建Docker镜像**
   ```bash
   mvn clean package
   docker build -t midjourney-builder .
   ```

2. **运行容器**
   ```bash
   docker run -p 8080:8080 midjourney-builder
   ```

## 📖 使用指南

### 基础使用流程

1. **选择预设模板**
   - 点击顶部的预设按钮 (人像、风景、动漫等)
   - 系统会自动填充相应的参数

2. **自定义参数**
   - 修改主要提示词
   - 调整宽高比、质量等基础参数
   - 使用滑块调整风格化程度和混乱度

3. **高级设置** (可选)
   - 点击"高级参数"展开更多选项
   - 设置艺术风格、光照、色彩等
   - 启用特殊模式 (平铺、奇异)

4. **生成命令**
   - 点击"构建命令"按钮
   - 复制生成的命令到剪贴板
   - 在Discord的MidJourney频道中粘贴使用

### API 使用说明

#### 获取预设参数
```http
GET /api/midjourney/preset/{presetType}
```

#### 构建命令
```http
POST /api/midjourney/build-command
Content-Type: application/json

{
  "prompt": "a beautiful landscape",
  "aspectRatio": "LANDSCAPE_16_9",
  "stylize": 200,
  "quality": "HIGH"
}
```

#### 获取智能建议
```http
POST /api/midjourney/suggestions
Content-Type: application/json

{
  "prompt": "anime girl portrait"
}
```

## 🎨 预设模板说明

### 人像摄影 (Portrait)
- 宽高比: 2:3
- 风格化: 150
- 质量: 高
- 光照: 柔和摄影棚光
- 适用: 人物肖像、头像生成

### 风景摄影 (Landscape)
- 宽高比: 16:9
- 风格化: 200
- 质量: 高
- 光照: 黄金时刻
- 适用: 自然风景、城市景观

### 动漫风格 (Anime)
- 宽高比: 4:5
- 风格化: 500
- 色彩: 鲜艳色彩
- 适用: 动漫角色、插画

### 写实风格 (Realistic)
- 宽高比: 1:1
- 风格化: 50
- 质量: 高
- 适用: 真实感图像

### 抽象艺术 (Abstract)
- 宽高比: 1:1
- 风格化: 800
- 混乱度: 50
- 适用: 抽象创作、艺术实验

### 极简主义 (Minimalist)
- 宽高比: 1:1
- 风格化: 25
- 色彩: 单色调
- 适用: 简约设计、logo

## 🔧 参数详解

### 风格化程度 (Stylize)
- **范围**: 0-1000
- **默认**: 100
- **说明**: 控制AI的艺术解释程度
- **建议**: 
  - 0-50: 更接近真实
  - 100-300: 平衡的艺术化
  - 500-1000: 高度风格化

### 混乱度 (Chaos)
- **范围**: 0-100
- **默认**: 0
- **说明**: 控制结果的变化程度
- **建议**:
  - 0-25: 一致性高
  - 25-75: 适度变化
  - 75-100: 高度随机

### 图像质量 (Quality)
- **低质量 (0.25)**: 快速生成，较低细节
- **标准质量 (1)**: 平衡速度和质量
- **高质量 (2)**: 最佳质量，较慢速度

## 🐛 常见问题

### Q: 为什么生成的命令在MidJourney中不工作？
A: 请检查以下几点：
- 确保提示词不为空
- 检查参数值是否在有效范围内
- 确认使用的是最新版本的MidJourney

### Q: 如何保存和分享我的参数设置？
A: 可以通过以下方式：
- 复制生成的完整命令
- 截图保存参数界面
- 使用浏览器书签保存页面状态

### Q: 应用启动失败怎么办？
A: 请检查：
- Java版本是否为21或更高
- 端口8080是否被占用
- 防火墙是否阻止了应用

### Q: 如何添加新的预设模板？
A: 修改 `MidJourneyService.java` 中的 `createPresetParameters` 方法，添加新的预设类型。

## 🔄 更新日志

### v1.0.0 (2024-10-16)
- ✨ 初始版本发布
- 🎨 完整的Web界面
- 🔧 RESTful API
- 📱 响应式设计
- 🎯 6种预设模板
- 🧠 智能参数建议
- 📋 一键复制功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

### 代码规范
- 遵循Java编码规范
- 添加必要的注释
- 编写单元测试
- 更新文档

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [MidJourney](https://midjourney.com/) - 提供强大的AI图像生成服务
- [Spring Boot](https://spring.io/projects/spring-boot) - 优秀的Java Web框架
- [Bootstrap](https://getbootstrap.com/) - 响应式UI框架

---

⭐ 如果这个项目对你有帮助，请给个星星支持一下！

📧 联系方式: [your-email@example.com]