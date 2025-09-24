#!/bin/bash

# Mac应用程序安装脚本
# 此脚本将Java应用程序安装到Mac系统

set -e

APP_NAME="MacInstallerApp"
INSTALL_DIR="/Applications"
APP_DIR="$INSTALL_DIR/$APP_NAME.app"
JAR_FILE="mac-installer-app.jar"

echo "开始安装 $APP_NAME..."

# 检查是否为Mac系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "错误: 此安装脚本仅适用于Mac系统"
    exit 1
fi

# 检查Java是否安装
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java运行时环境"
    echo "请先安装Java 11或更高版本"
    echo "可以从 https://adoptium.net/ 下载"
    exit 1
fi

# 检查Java版本
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    echo "警告: 当前Java版本为 $JAVA_VERSION，建议使用Java 11或更高版本"
fi

# 创建应用程序包目录
echo "创建应用程序包..."
sudo mkdir -p "$APP_DIR/Contents/MacOS"
sudo mkdir -p "$APP_DIR/Contents/Resources"

# 创建Info.plist
sudo tee "$APP_DIR/Contents/Info.plist" > /dev/null << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.macinstallerapp</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
</dict>
</plist>
EOF

# 创建启动脚本
sudo tee "$APP_DIR/Contents/MacOS/$APP_NAME" > /dev/null << 'EOF'
#!/bin/bash

# 获取应用程序包目录
APP_DIR="$(dirname "$0")"
APP_DIR="$(dirname "$APP_DIR")"
APP_DIR="$(dirname "$APP_DIR")"

# 查找Java
JAVA_CMD=""
if [ -n "$JAVA_HOME" ]; then
    JAVA_CMD="$JAVA_HOME/bin/java"
elif command -v java &> /dev/null; then
    JAVA_CMD="java"
else
    # 尝试使用java_home
    JAVA_HOME=$(/usr/libexec/java_home -v 11 2>/dev/null || /usr/libexec/java_home -v 1.8 2>/dev/null || /usr/libexec/java_home 2>/dev/null)
    if [ -n "$JAVA_HOME" ]; then
        JAVA_CMD="$JAVA_HOME/bin/java"
    fi
fi

if [ -z "$JAVA_CMD" ]; then
    osascript -e 'display dialog "未找到Java运行时环境。请先安装Java 11或更高版本。" buttons {"确定"} default button "确定" with icon stop'
    exit 1
fi

# 运行Java应用程序
exec "$JAVA_CMD" -jar "$APP_DIR/Contents/Resources/mac-installer-app.jar"
EOF

sudo chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# 复制JAR文件
if [ -f "target/mac-installer-app.jar" ]; then
    echo "复制JAR文件..."
    sudo cp "target/mac-installer-app.jar" "$APP_DIR/Contents/Resources/$JAR_FILE"
else
    echo "错误: 未找到JAR文件 target/mac-installer-app.jar"
    echo "请先运行构建脚本: ./build-mac-installer.sh"
    exit 1
fi

# 设置权限
sudo chown -R root:wheel "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

echo "安装完成！"
echo "应用程序已安装到: $APP_DIR"
echo "您可以在Launchpad或Applications文件夹中找到 $APP_NAME"

# 询问是否立即启动
read -p "是否立即启动应用程序？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "$APP_DIR"
fi