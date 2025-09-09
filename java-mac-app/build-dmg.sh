#!/bin/bash

# Script to create a DMG installer for macOS
# This creates a disk image with drag-and-drop installation

set -e

echo "💿 开始创建 DMG 安装程序..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="MacJavaApp"
APP_VERSION="1.0.0"
DMG_NAME="${APP_NAME}-${APP_VERSION}"
VOLUME_NAME="$APP_NAME Installer"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}错误: 此脚本只能在 macOS 上运行${NC}"
    exit 1
fi

# Check if the app bundle exists
APP_BUNDLE="target/$APP_NAME.app"
if [ ! -d "$APP_BUNDLE" ]; then
    echo -e "${RED}错误: 应用程序包未找到: $APP_BUNDLE${NC}"
    echo -e "${YELLOW}请先运行 build-mac-installer.sh${NC}"
    exit 1
fi

# Clean up any existing DMG
rm -f "${DMG_NAME}.dmg"
rm -f "${DMG_NAME}-temp.dmg"

# Create a temporary directory for the DMG contents
TEMP_DIR=$(mktemp -d)
DMG_DIR="$TEMP_DIR/dmg"
mkdir -p "$DMG_DIR"

echo -e "${YELLOW}📁 准备 DMG 内容...${NC}"

# Copy the app bundle
cp -R "$APP_BUNDLE" "$DMG_DIR/"

# Create Applications symlink for drag-and-drop installation
ln -s /Applications "$DMG_DIR/Applications"

# Create a README file
cat > "$DMG_DIR/安装说明.txt" << EOF
Mac Java Application v${APP_VERSION}
================================

安装步骤:
1. 将 ${APP_NAME}.app 拖拽到 Applications 文件夹
2. 在启动台或应用程序文件夹中找到应用程序
3. 确保系统已安装 Java 11 或更高版本

系统要求:
- macOS 10.14 或更高版本
- Java 11 或更高版本

如果没有安装 Java，请访问:
https://adoptium.net

问题反馈:
如有问题，请联系开发者。

享受使用 ${APP_NAME}！
EOF

# Create a background image directory (optional)
mkdir -p "$DMG_DIR/.background"

# Calculate the size needed for the DMG
SIZE=$(du -sm "$DMG_DIR" | awk '{print $1}')
SIZE=$((SIZE + 50)) # Add some padding

echo -e "${YELLOW}💿 创建 DMG 镜像 (大小: ${SIZE}MB)...${NC}"

# Create the DMG
hdiutil create -srcfolder "$DMG_DIR" \
               -volname "$VOLUME_NAME" \
               -fs HFS+ \
               -fsargs "-c c=64,a=16,e=16" \
               -format UDRW \
               -size ${SIZE}m \
               "${DMG_NAME}-temp.dmg"

# Mount the DMG
MOUNT_DIR=$(mktemp -d)
hdiutil attach "${DMG_NAME}-temp.dmg" -noautoopen -quiet -mountpoint "$MOUNT_DIR"

echo -e "${YELLOW}🎨 配置 DMG 外观...${NC}"

# Set the DMG window properties using AppleScript
osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 600, 400}
        set theViewOptions to the icon view options of container window
        set arrangement of theViewOptions to not arranged
        set icon size of theViewOptions to 128
        set background picture of theViewOptions to file ".background:background.png"
        
        -- Position the app icon and Applications link
        set position of item "${APP_NAME}.app" of container window to {150, 200}
        set position of item "Applications" of container window to {350, 200}
        
        -- Update the display
        update without registering applications
        delay 2
        close
    end tell
end tell
EOF

# Unmount the DMG
hdiutil detach "$MOUNT_DIR" -quiet

echo -e "${YELLOW}🗜️ 压缩 DMG...${NC}"

# Convert to compressed, read-only DMG
hdiutil convert "${DMG_NAME}-temp.dmg" \
                -format UDZO \
                -imagekey zlib-level=9 \
                -o "${DMG_NAME}.dmg"

# Clean up
rm -f "${DMG_NAME}-temp.dmg"
rm -rf "$TEMP_DIR"
rm -rf "$MOUNT_DIR"

echo -e "${GREEN}🎉 DMG 创建完成!${NC}"
echo -e "${BLUE}📦 DMG 文件: $PWD/${DMG_NAME}.dmg${NC}"
echo ""
echo -e "${YELLOW}使用说明:${NC}"
echo "1. 双击 ${DMG_NAME}.dmg 打开磁盘镜像"
echo "2. 将 ${APP_NAME}.app 拖拽到 Applications 文件夹"
echo "3. 弹出磁盘镜像"
echo "4. 在启动台或应用程序文件夹中找到应用程序"
echo ""
echo -e "${GREEN}DMG 构建完成! 💿${NC}"