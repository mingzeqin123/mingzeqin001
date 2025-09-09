#!/bin/bash

# Build script for macOS installer
# This script creates a native macOS installer (.pkg) for the Java application

set -e

echo "🚀 开始构建 macOS 安装程序..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="MacJavaApp"
APP_VERSION="1.0.0"
VENDOR="Example Company"
IDENTIFIER="com.example.macjavaapp"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}错误: 此脚本只能在 macOS 上运行${NC}"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${RED}错误: 未找到 Java。请安装 Java 11 或更高版本${NC}"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    echo -e "${RED}错误: 需要 Java 11 或更高版本，当前版本: $JAVA_VERSION${NC}"
    exit 1
fi

echo -e "${BLUE}✓ Java 版本检查通过: $JAVA_VERSION${NC}"

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到 Maven，尝试使用 Maven Wrapper...${NC}"
    if [ ! -f "./mvnw" ]; then
        echo -e "${RED}错误: 未找到 Maven 或 Maven Wrapper${NC}"
        exit 1
    fi
    MVN_CMD="./mvnw"
else
    MVN_CMD="mvn"
    echo -e "${BLUE}✓ Maven 检查通过${NC}"
fi

# Clean previous builds
echo -e "${YELLOW}🧹 清理之前的构建...${NC}"
rm -rf target/
rm -rf *.pkg
rm -rf *.dmg

# Build the application
echo -e "${YELLOW}🔨 构建 Java 应用程序...${NC}"
$MVN_CMD clean compile

# Package the application
echo -e "${YELLOW}📦 打包应用程序...${NC}"
$MVN_CMD package

# Check if the JAR was created
JAR_FILE="target/${APP_NAME,,}-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}错误: JAR 文件未找到: $JAR_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ JAR 文件创建成功: $JAR_FILE${NC}"

# Create a simple launcher script
echo -e "${YELLOW}📝 创建启动脚本...${NC}"
mkdir -p target/app
cat > target/app/launch.sh << EOF
#!/bin/bash
# Launcher script for $APP_NAME

# Get the directory where this script is located
SCRIPT_DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Set JAVA_HOME if not set
if [ -z "\$JAVA_HOME" ]; then
    # Try to find Java on macOS
    if [ -x /usr/libexec/java_home ]; then
        export JAVA_HOME=\$(/usr/libexec/java_home -v 11+ 2>/dev/null || /usr/libexec/java_home)
    fi
fi

# Check if Java is available
if ! command -v java &> /dev/null && [ -z "\$JAVA_HOME" ]; then
    osascript -e 'display dialog "Java 未找到。请安装 Java 11 或更高版本。" buttons {"确定"} default button "确定" with icon stop'
    exit 1
fi

# Launch the application
cd "\$SCRIPT_DIR"
if [ -n "\$JAVA_HOME" ]; then
    "\$JAVA_HOME/bin/java" -jar "$APP_NAME-1.0.0.jar"
else
    java -jar "$APP_NAME-1.0.0.jar"
fi
EOF

chmod +x target/app/launch.sh

# Copy the JAR file
cp "$JAR_FILE" "target/app/$APP_NAME-1.0.0.jar"

# Create application bundle structure
echo -e "${YELLOW}🍎 创建 macOS 应用程序包...${NC}"
APP_BUNDLE="target/$APP_NAME.app"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Create Info.plist
cat > "$APP_BUNDLE/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>$IDENTIFIER</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>$APP_VERSION</string>
    <key>CFBundleVersion</key>
    <string>$APP_VERSION</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
</dict>
</plist>
EOF

# Create the main executable
cat > "$APP_BUNDLE/Contents/MacOS/$APP_NAME" << EOF
#!/bin/bash
# Main executable for $APP_NAME

# Get the app bundle directory
APP_DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )/../Resources" &> /dev/null && pwd )"

# Set JAVA_HOME if not set
if [ -z "\$JAVA_HOME" ]; then
    if [ -x /usr/libexec/java_home ]; then
        export JAVA_HOME=\$(/usr/libexec/java_home -v 11+ 2>/dev/null || /usr/libexec/java_home)
    fi
fi

# Check if Java is available
if ! command -v java &> /dev/null && [ -z "\$JAVA_HOME" ]; then
    osascript -e 'display dialog "Java 未找到。请安装 Java 11 或更高版本。\\n\\n您可以从 https://adoptium.net 下载 Java。" buttons {"确定"} default button "确定" with icon stop'
    exit 1
fi

# Launch the application
cd "\$APP_DIR"
if [ -n "\$JAVA_HOME" ]; then
    "\$JAVA_HOME/bin/java" -Xdock:name="$APP_NAME" -Xdock:icon="\$APP_DIR/icon.icns" -jar "$APP_NAME-1.0.0.jar"
else
    java -Xdock:name="$APP_NAME" -Xdock:icon="\$APP_DIR/icon.icns" -jar "$APP_NAME-1.0.0.jar"
fi
EOF

chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

# Copy the JAR file to the app bundle
cp "$JAR_FILE" "$APP_BUNDLE/Contents/Resources/$APP_NAME-1.0.0.jar"

# Create a simple icon (you would normally use a proper .icns file)
echo -e "${YELLOW}🎨 创建应用程序图标...${NC}"
# For now, we'll create a placeholder - in a real scenario, you'd have a proper .icns file
touch "$APP_BUNDLE/Contents/Resources/icon.icns"

echo -e "${GREEN}✓ 应用程序包创建完成: $APP_BUNDLE${NC}"

# Create installer package
echo -e "${YELLOW}📦 创建安装程序包...${NC}"

# Create a temporary directory for the installer
TEMP_DIR=$(mktemp -d)
INSTALL_DIR="$TEMP_DIR/Applications"
mkdir -p "$INSTALL_DIR"

# Copy the app bundle to the install directory
cp -R "$APP_BUNDLE" "$INSTALL_DIR/"

# Create the installer package
PKG_NAME="${APP_NAME}-${APP_VERSION}.pkg"
pkgbuild --root "$TEMP_DIR" \
         --identifier "$IDENTIFIER" \
         --version "$APP_VERSION" \
         --install-location "/" \
         "$PKG_NAME"

# Clean up
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 安装程序创建完成!${NC}"
echo -e "${BLUE}📦 安装包: $PWD/$PKG_NAME${NC}"
echo -e "${BLUE}🍎 应用程序包: $PWD/$APP_BUNDLE${NC}"
echo ""
echo -e "${YELLOW}安装说明:${NC}"
echo "1. 双击 $PKG_NAME 运行安装程序"
echo "2. 按照提示完成安装"
echo "3. 在应用程序文件夹中找到 $APP_NAME"
echo "4. 确保系统已安装 Java 11 或更高版本"
echo ""
echo -e "${GREEN}构建完成! 🚀${NC}"