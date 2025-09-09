# Makefile for Mac Java Application
# 简化构建过程的 Make 配置文件

.PHONY: all clean compile package pkg dmg install run help

# 默认目标
all: package

# 帮助信息
help:
	@echo "Mac Java Application 构建工具"
	@echo ""
	@echo "可用目标:"
	@echo "  compile    - 编译 Java 源代码"
	@echo "  package    - 打包 JAR 文件"
	@echo "  pkg        - 创建 PKG 安装包"
	@echo "  dmg        - 创建 DMG 磁盘镜像"
	@echo "  install    - 创建所有安装包 (PKG + DMG)"
	@echo "  run        - 运行应用程序"
	@echo "  clean      - 清理构建文件"
	@echo "  help       - 显示此帮助信息"

# 编译项目
compile:
	@echo "🔨 编译 Java 项目..."
	mvn clean compile

# 打包 JAR
package: compile
	@echo "📦 打包 JAR 文件..."
	mvn package

# 创建 PKG 安装包
pkg: package
	@echo "📦 创建 PKG 安装包..."
	./build-mac-installer.sh

# 创建 DMG 磁盘镜像
dmg: pkg
	@echo "💿 创建 DMG 磁盘镜像..."
	./build-dmg.sh

# 创建所有安装包
install: dmg
	@echo "✅ 所有安装包创建完成!"
	@ls -la *.pkg *.dmg 2>/dev/null || true

# 运行应用程序
run: package
	@echo "🚀 启动应用程序..."
	java -jar target/mac-java-app-1.0.0.jar

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	mvn clean
	rm -rf *.pkg *.dmg
	@echo "清理完成!"