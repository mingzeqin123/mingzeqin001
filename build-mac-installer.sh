#!/bin/bash

# Mac安装器构建脚本
# 此脚本用于创建Mac DMG安装包

set -e

echo "开始构建Mac安装器..."

# 检查是否在Mac系统上
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "警告: 此脚本设计用于Mac系统，当前系统: $OSTYPE"
    echo "在非Mac系统上，将创建通用的JAR文件"
fi

# 清理之前的构建
echo "清理之前的构建..."
rm -rf target/
rm -rf dist/

# 编译Java应用程序
echo "编译Java应用程序..."
mvn clean compile

# 创建可执行JAR
echo "创建可执行JAR..."
mvn package

# 检查JAR文件是否创建成功
if [ ! -f "target/mac-installer-app.jar" ]; then
    echo "错误: JAR文件创建失败"
    exit 1
fi

echo "JAR文件创建成功: target/mac-installer-app.jar"

# 如果在Mac系统上，创建DMG安装包
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "检测到Mac系统，创建DMG安装包..."
    
    # 创建应用程序包结构
    APP_NAME="MacInstallerApp"
    APP_DIR="dist/$APP_NAME.app"
    CONTENTS_DIR="$APP_DIR/Contents"
    MACOS_DIR="$CONTENTS_DIR/MacOS"
    RESOURCES_DIR="$CONTENTS_DIR/Resources"
    
    mkdir -p "$MACOS_DIR"
    mkdir -p "$RESOURCES_DIR"
    
    # 创建Info.plist文件
    cat > "$CONTENTS_DIR/Info.plist" << EOF
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
</dict>
</plist>
EOF
    
    # 创建启动脚本
    cat > "$MACOS_DIR/$APP_NAME" << 'EOF'
#!/bin/bash
# 获取应用程序包目录
APP_DIR="$(dirname "$0")"
APP_DIR="$(dirname "$APP_DIR")"
APP_DIR="$(dirname "$APP_DIR")"

# 设置Java路径
JAVA_HOME="${JAVA_HOME:-/usr/libexec/java_home -v 11 2>/dev/null || /usr/libexec/java_home -v 1.8 2>/dev/null || /usr/libexec/java_home}"

# 运行Java应用程序
exec "$JAVA_HOME/bin/java" -jar "$APP_DIR/Resources/mac-installer-app.jar"
EOF
    
    chmod +x "$MACOS_DIR/$APP_NAME"
    
    # 复制JAR文件到Resources目录
    cp "target/mac-installer-app.jar" "$RESOURCES_DIR/"
    
    # 创建应用程序图标（如果存在）
    if [ -f "resources/icon.icns" ]; then
        cp "resources/icon.icns" "$RESOURCES_DIR/"
    fi
    
    echo "应用程序包创建完成: $APP_DIR"
    
    # 创建DMG文件
    echo "创建DMG安装包..."
    DMG_NAME="MacInstallerApp-1.0.0.dmg"
    DMG_PATH="dist/$DMG_NAME"
    
    # 创建临时DMG
    TEMP_DMG="dist/temp.dmg"
    hdiutil create -srcfolder "$APP_DIR" -volname "$APP_NAME" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW -size 100m "$TEMP_DMG"
    
    # 挂载DMG
    MOUNT_DIR="/Volumes/$APP_NAME"
    hdiutil attach "$TEMP_DMG" -readwrite -noverify -noautoopen
    
    # 等待挂载完成
    sleep 2
    
    # 设置DMG属性
    if [ -d "$MOUNT_DIR" ]; then
        # 设置背景图片（如果存在）
        if [ -f "resources/background.png" ]; then
            cp "resources/background.png" "$MOUNT_DIR/.background/"
        fi
        
        # 设置应用程序位置
        osascript << EOF
tell application "Finder"
    tell disk "$APP_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 900, 450}
        set theViewOptions to the icon view options of container window
        set arrangement of theViewOptions to not arranged
        set icon size of theViewOptions to 128
        set position of item "$APP_NAME.app" of container window to {150, 200}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
EOF
    fi
    
    # 卸载DMG
    hdiutil detach "$MOUNT_DIR"
    
    # 转换为只读DMG
    hdiutil convert "$TEMP_DMG" -format UDZO -imagekey zlib-level=9 -o "$DMG_PATH"
    
    # 清理临时文件
    rm "$TEMP_DMG"
    
    echo "DMG安装包创建完成: $DMG_PATH"
    
    # 显示DMG信息
    echo "安装包信息:"
    ls -lh "$DMG_PATH"
    
else
    echo "非Mac系统，跳过DMG创建"
    echo "JAR文件位置: target/mac-installer-app.jar"
    echo "可以使用以下命令运行:"
    echo "java -jar target/mac-installer-app.jar"
fi

echo "构建完成！"