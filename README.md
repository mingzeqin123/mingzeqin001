# Mac安装器Java应用程序

这是一个Java GUI应用程序，可以打包成Mac安装包并在Mac系统上安装运行。

## 功能特性

- 简单的GUI界面，使用Java Swing
- 点击计数器功能
- 系统信息显示
- 操作日志记录
- 支持Mac原生外观
- 可打包成DMG安装包

## 系统要求

- Java 11或更高版本
- Mac OS X 10.14或更高版本（用于DMG安装包）
- Maven 3.6或更高版本（用于构建）

## 快速开始

### 1. 构建应用程序

```bash
# 构建JAR文件
./build-mac-installer.sh
```

### 2. 在Mac上安装

```bash
# 安装到Applications文件夹
./install.sh
```

### 3. 手动运行

```bash
# 直接运行JAR文件
java -jar target/mac-installer-app.jar
```

## 项目结构

```
├── pom.xml                          # Maven配置文件
├── build-mac-installer.sh           # 构建脚本
├── install.sh                       # Mac安装脚本
├── README.md                        # 说明文档
└── src/
    └── main/
        └── java/
            └── com/
                └── example/
                    └── MainApp.java # 主应用程序
```

## 构建说明

### 构建JAR文件

```bash
mvn clean package
```

这将创建一个可执行的JAR文件：`target/mac-installer-app.jar`

### 创建Mac安装包

在Mac系统上运行：

```bash
./build-mac-installer.sh
```

这将创建：
- 应用程序包：`dist/MacInstallerApp.app`
- DMG安装包：`dist/MacInstallerApp-1.0.0.dmg`

## 安装说明

### 方法1：使用安装脚本

```bash
./install.sh
```

此脚本将：
1. 检查Java环境
2. 创建应用程序包结构
3. 安装到`/Applications`文件夹
4. 设置正确的权限

### 方法2：手动安装

1. 构建应用程序：`./build-mac-installer.sh`
2. 将`dist/MacInstallerApp.app`拖拽到`/Applications`文件夹
3. 在Launchpad或Applications文件夹中找到并运行

### 方法3：使用DMG安装包

1. 构建DMG：`./build-mac-installer.sh`
2. 双击`dist/MacInstallerApp-1.0.0.dmg`
3. 将应用程序拖拽到Applications文件夹

## 应用程序功能

- **点击计数**：点击按钮进行计数
- **系统信息**：显示详细的系统信息
- **操作日志**：记录所有操作和系统信息
- **清空日志**：重置计数器和清空日志

## 故障排除

### Java未找到

如果遇到"Java未找到"错误：

1. 安装Java 11或更高版本
2. 设置JAVA_HOME环境变量
3. 确保java命令在PATH中

### 权限问题

如果遇到权限问题：

```bash
# 给脚本执行权限
chmod +x build-mac-installer.sh
chmod +x install.sh

# 安装时使用sudo
sudo ./install.sh
```

### 应用程序无法启动

1. 检查Java版本：`java -version`
2. 检查JAR文件：`ls -la target/mac-installer-app.jar`
3. 手动运行：`java -jar target/mac-installer-app.jar`

## 开发说明

### 修改应用程序

1. 编辑`src/main/java/com/example/MainApp.java`
2. 重新构建：`mvn clean package`
3. 重新安装：`./install.sh`

### 自定义配置

- 修改`pom.xml`中的应用程序信息
- 更新`build-mac-installer.sh`中的DMG设置
- 修改`install.sh`中的安装路径

## 许可证

此项目仅用于演示目的。