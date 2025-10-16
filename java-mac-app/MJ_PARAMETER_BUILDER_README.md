# Midjourney 参数构建器

这是一个用于构建和自定义 Midjourney 参数的 Java 应用程序，提供了完整的图形用户界面和编程接口。

## 功能特性

### 🎨 参数定制
- **基础参数**: 提示词、宽高比、风格、质量等
- **高级参数**: 随机种子、停止百分比、负面提示等
- **特殊参数**: 平铺模式、视频生成、重复次数等
- **自定义参数**: 支持添加用户自定义参数

### 🔧 参数验证
- 实时参数验证
- 错误提示和修复建议
- 参数格式检查
- 值范围验证

### 🖥️ 用户界面
- 现代化的 JavaFX 界面
- 分类参数组织
- 实时预览
- 参数模板和预设

### 📝 编程接口
- 构建器模式 API
- 服务层封装
- 参数解析和构建
- 完整的类型安全

## 项目结构

```
src/main/java/com/example/app/mj/
├── MJParameter.java              # 参数模型类
├── MJPrompt.java                 # 提示词模型类
├── MJParameterBuilder.java       # 参数构建器
├── MJParameterService.java       # 服务层
├── MJParameterController.java    # 界面控制器
└── MJParameterExample.java       # 使用示例
```

## 快速开始

### 1. 运行应用程序

```bash
cd java-mac-app
mvn clean compile
mvn javafx:run
```

### 2. 使用图形界面

1. 启动应用程序
2. 切换到 "Midjourney 参数构建器" 标签页
3. 填写您想要的参数
4. 点击 "生成提示词" 按钮
5. 复制生成的提示词到 Midjourney

### 3. 编程使用

```java
// 创建服务实例
MJParameterService service = new MJParameterService();

// 使用构建器模式
MJParameterBuilder builder = service.createBuilder();
String prompt = builder
    .setPrompt("a beautiful sunset")
    .setAspectRatio("16:9")
    .setStyle("raw")
    .setQuality("2")
    .setChaos("20")
    .setStylize("150")
    .build();

System.out.println(prompt);
// 输出: a beautiful sunset --ar 16:9 --style raw --q 2 --chaos 20 --stylize 150
```

## 支持的参数

### 基础参数
- **prompt**: 主要提示词文本
- **aspectRatio**: 宽高比 (1:1, 16:9, 9:16, 4:3, 3:4, 2:3, 3:2, 1:2, 2:1)
- **style**: 艺术风格 (raw, cute, expressive, original, scenic)
- **quality**: 质量级别 (0.25, 0.5, 1, 2)

### 风格参数
- **stylize**: 风格化程度 (0-1000)
- **chaos**: 随机性程度 (0-100)
- **weird**: 怪异度 (0-3000)

### 高级参数
- **version**: 模型版本 (1, 2, 3, 4, 5, 6, niji, hd)
- **seed**: 随机种子 (用于可重现结果)
- **stop**: 停止百分比 (10-100)
- **imageWeight**: 图像权重 (0.5-2.0)

### 特殊参数
- **tile**: 平铺模式 (布尔值)
- **video**: 生成视频 (布尔值)
- **repeat**: 重复次数
- **negativePrompt**: 负面提示

## 参数验证

系统会自动验证以下内容：

- **必需参数**: 确保提示词不为空
- **格式验证**: 检查宽高比、质量等参数的格式
- **范围验证**: 确保数值参数在有效范围内
- **选项验证**: 确保选择参数在预定义选项中

## 自定义参数

您可以添加自定义参数：

```java
MJParameterBuilder builder = service.createBuilder();
builder.addCustomParameter(
    "customParam", 
    "value", 
    "自定义参数描述", 
    false, 
    "Custom"
);
```

## 示例用法

### 基础用法
```java
Map<String, String> params = new HashMap<>();
params.put("prompt", "a cat sitting on a windowsill");
params.put("aspectRatio", "1:1");
params.put("style", "cute");
params.put("quality", "1");

String prompt = service.buildPrompt(params);
```

### 高级用法
```java
MJParameterBuilder builder = service.createBuilder();
String prompt = builder
    .setPrompt("futuristic city")
    .setAspectRatio("16:9")
    .setStyle("raw")
    .setQuality("2")
    .setChaos("30")
    .setStylize("200")
    .setVersion("6")
    .setSeed("12345")
    .setStop("80")
    .setNegativePrompt("blurry, low quality")
    .setWeird("500")
    .build();
```

### 参数解析
```java
String existingPrompt = "a forest --ar 16:9 --style raw --q 2";
Map<String, String> parsed = service.parsePrompt(existingPrompt);
```

## 技术栈

- **Java 21**: 现代 Java 特性
- **JavaFX 21**: 现代化 GUI 框架
- **Maven**: 依赖管理和构建工具
- **Jackson**: JSON 处理 (如需要)

## 构建和运行

### 使用 Maven
```bash
# 编译
mvn clean compile

# 运行
mvn javafx:run

# 打包
mvn clean package
```

### 使用 IDE
1. 导入 Maven 项目
2. 运行 `MacJavaApp.main()` 方法
3. 确保 JavaFX 运行时可用

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

本项目使用 MIT 许可证。详见 LICENSE 文件。

## 更新日志

### v2.0.0
- 集成 Midjourney 参数构建器
- 添加图形用户界面
- 支持参数验证和自定义
- 提供完整的编程接口

### v1.0.0
- 基础 JavaFX 应用程序
- 文件操作和系统信息显示