@echo off
chcp 65001 >nul

REM MyBatis Plus 代码生成器运行脚本 (Windows)

echo === MyBatis Plus 代码生成器 ===
echo.

REM 检查是否在正确的目录
if not exist "java-mac-app\pom.xml" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 进入 Java 项目目录
cd java-mac-app

REM 检查 Maven 是否安装
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：Maven 未安装，请先安装 Maven
    pause
    exit /b 1
)

REM 编译项目
echo 📦 编译项目...
mvn clean compile -q

if %errorlevel% neq 0 (
    echo ❌ 编译失败
    pause
    exit /b 1
)

echo ✅ 编译成功
echo.

REM 显示菜单
echo 请选择要运行的功能：
echo 1. 启动代码生成器主界面
echo 2. 基础代码生成器
echo 3. 高级代码生成器
echo 4. 配置文件生成器
echo 5. 示例数据生成器
echo 6. 使用示例
echo.

set /p choice="请输入选择 (1-6): "

if "%choice%"=="1" (
    echo 🚀 启动代码生成器主界面...
    mvn exec:java -Dexec.mainClass="com.example.app.generator.CodeGeneratorLauncher" -q
) else if "%choice%"=="2" (
    echo 🚀 启动基础代码生成器...
    mvn exec:java -Dexec.mainClass="com.example.app.generator.MyBatisPlusCodeGenerator" -q
) else if "%choice%"=="3" (
    echo 🚀 启动高级代码生成器...
    mvn exec:java -Dexec.mainClass="com.example.app.generator.AdvancedCodeGenerator" -q
) else if "%choice%"=="4" (
    echo 🚀 启动配置文件生成器...
    mvn exec:java -Dexec.mainClass="com.example.app.generator.ConfigGenerator" -q
) else if "%choice%"=="5" (
    echo 🚀 启动示例数据生成器...
    mvn exec:java -Dexec.mainClass="com.example.app.generator.SampleDataGenerator" -q
) else if "%choice%"=="6" (
    echo 🚀 运行使用示例...
    mvn exec:java -Dexec.mainClass="com.example.app.generator.ExampleUsage" -q
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo ✅ 执行完成！
pause