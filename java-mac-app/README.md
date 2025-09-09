# Mac Java Application

一个为 macOS 设计的 Java 应用程序，具有现代化的 GUI 界面和系统集成功能。

## 功能特性

- 🖥️ 现代化的 JavaFX GUI 界面
- 📁 文件选择和操作功能
- 💻 系统信息显示
- 🍎 macOS 原生集成
- 📦 支持 PKG 和 DMG 安装包格式
- 🌍 中文界面支持

## 系统要求

- **操作系统**: macOS 10.14 (Mojave) 或更高版本
- **Java**: Java 11 或更高版本
- **内存**: 最少 256MB RAM
- **存储**: 约 50MB 可用空间

## 安装 Java

如果您的系统没有安装 Java，请按以下步骤安装：

1. 访问 [Eclipse Temurin](https://adoptium.net) 
2. 下载适合您系统的 Java 11 LTS 版本
3. 运行安装程序并按提示完成安装
4. 验证安装：在终端运行 `java -version`

## 构建和安装

### 方法一：使用预构建的安装包

1. 下载发布版本中的安装包
2. 选择以下安装方式之一：
   - **PKG 安装包**: 双击 `.pkg` 文件，按提示安装
   - **DMG 磁盘镜像**: 双击 `.dmg` 文件，将应用拖拽到 Applications 文件夹

### 方法二：从源码构建

#### 前置要求

- Java 11 或更高版本
- Maven 3.6 或更高版本（可选，项目包含 Maven Wrapper）
- Xcode Command Line Tools（用于创建 macOS 安装包）

#### 构建步骤

1. **克隆或下载项目**
   ```bash
   git clone <repository-url>
   cd java-mac-app
   ```

2. **构建 PKG 安装包**
   ```bash
   ./build-mac-installer.sh
   ```
   
   这将创建：
   - `MacJavaApp-1.0.0.pkg` - PKG 安装包
   - `target/MacJavaApp.app` - macOS 应用程序包

3. **构建 DMG 磁盘镜像**（可选）
   ```bash
   ./build-dmg.sh
   ```
   
   这将创建：
   - `MacJavaApp-1.0.0.dmg` - DMG 磁盘镜像

#### 手动构建

如果您想手动构建：

```bash
# 编译项目
mvn clean compile

# 打包 JAR
mvn package

# 运行应用程序（测试）
java -jar target/mac-java-app-1.0.0.jar
```

## 使用说明

### 启动应用程序

- **从启动台**: 在启动台中找到 "MacJavaApp" 并点击
- **从应用程序文件夹**: 在 Finder 中打开应用程序文件夹，双击 MacJavaApp
- **从命令行**: `java -jar MacJavaApp-1.0.0.jar`

### 主要功能

1. **问候消息**: 显示欢迎信息和应用程序功能介绍
2. **选择文件**: 打开文件选择对话框，显示文件信息
3. **系统信息**: 显示详细的系统和 Java 环境信息
4. **清空输出**: 清除输出区域的内容

### 界面说明

- **输出区域**: 显示操作结果和系统信息
- **状态栏**: 显示当前操作状态
- **按钮面板**: 包含所有主要功能按钮

## 项目结构

```
java-mac-app/
├── src/main/java/
│   ├── module-info.java                    # Java 模块描述符
│   └── com/example/app/
│       └── MacJavaApp.java                 # 主应用程序类
├── target/                                 # 构建输出目录
├── build-mac-installer.sh                 # PKG 安装包构建脚本
├── build-dmg.sh                          # DMG 磁盘镜像构建脚本
├── pom.xml                               # Maven 配置文件
└── README.md                             # 项目说明文档
```

## 开发说明

### 技术栈

- **Java 11+**: 核心开发语言
- **JavaFX 17**: GUI 框架
- **Maven**: 构建工具
- **macOS 原生工具**: pkgbuild, hdiutil

### 自定义配置

您可以通过修改以下文件来自定义应用程序：

1. **应用程序信息**: 编辑 `pom.xml` 中的项目信息
2. **界面样式**: 修改 `MacJavaApp.java` 中的样式定义
3. **安装包配置**: 编辑构建脚本中的配置变量

### 添加新功能

1. 在 `MacJavaApp.java` 中添加新的按钮和事件处理器
2. 如需要新的依赖，在 `pom.xml` 中添加
3. 更新 `module-info.java` 如果使用了新的模块

## 故障排除

### 常见问题

**Q: 应用程序无法启动，提示找不到 Java**
A: 请确保已安装 Java 11 或更高版本，并且 `JAVA_HOME` 环境变量设置正确。

**Q: 构建时出现权限错误**
A: 确保构建脚本有执行权限：`chmod +x build-mac-installer.sh`

**Q: macOS 提示应用程序来自未知开发者**
A: 在系统偏好设置 > 安全性与隐私中允许运行，或者对应用程序进行代码签名。

**Q: JavaFX 模块找不到**
A: 确保使用 Java 11 或更高版本，JavaFX 已包含在项目依赖中。

### 调试模式

要在调试模式下运行应用程序：

```bash
java -Djava.util.logging.level=ALL -jar target/mac-java-app-1.0.0.jar
```

### 日志文件

应用程序日志存储在系统日志中，可以通过控制台应用程序查看。

## 代码签名和公证（可选）

对于生产环境，建议对应用程序进行代码签名和公证：

1. **获取开发者证书**: 从 Apple Developer Program 获取
2. **签名应用程序**:
   ```bash
   codesign --force --deep --sign "Developer ID Application: Your Name" MacJavaApp.app
   ```
3. **创建签名的安装包**:
   ```bash
   productsign --sign "Developer ID Installer: Your Name" MacJavaApp-1.0.0.pkg MacJavaApp-1.0.0-signed.pkg
   ```

## 许可证

本项目采用 MIT 许可证。详情请参阅 LICENSE 文件。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 版本历史

- **v1.0.0** (2024-01-XX)
  - 初始版本
  - JavaFX GUI 界面
  - 文件选择功能
  - 系统信息显示
  - macOS 安装包支持

---

**享受使用 Mac Java Application！** 🚀