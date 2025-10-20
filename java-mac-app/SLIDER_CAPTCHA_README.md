# Java 滑块验证码集成

## 概述

本项目成功集成了一个开源的Java滑块验证码解决方案，提供了完整的验证码功能，包括图片生成、用户交互、验证逻辑等。

## 功能特性

### 核心功能
- ✅ **随机拼图生成**: 每次生成随机的拼图位置
- ✅ **拖拽验证**: 支持鼠标拖拽滑块进行验证
- ✅ **容差验证**: 允许5像素的验证误差
- ✅ **防重复验证**: 验证成功后不能重复验证
- ✅ **过期控制**: 验证码5分钟后自动过期
- ✅ **会话管理**: 每个验证码都有唯一的会话ID

### 技术特性
- ✅ **JavaFX集成**: 完整的GUI界面支持
- ✅ **模块化设计**: 核心逻辑与UI分离
- ✅ **高性能**: 创建100个验证码仅需0ms
- ✅ **随机性良好**: 位置生成具有良好的随机性
- ✅ **易于扩展**: 支持自定义验证规则和UI样式

## 项目结构

```
java-mac-app/
├── src/main/java/com/example/app/
│   ├── MacJavaApp.java              # 主应用程序
│   ├── TestCaptchaSimple.java       # 测试程序
│   └── captcha/
│       ├── SliderCaptcha.java       # 完整版滑块验证码（含JavaFX）
│       ├── SliderCaptchaUI.java     # 滑块验证码UI组件
│       ├── CaptchaImageGenerator.java # 图片生成工具
│       └── SimpleSliderCaptcha.java # 简化版（无JavaFX依赖）
```

## 使用方法

### 1. 基本使用

```java
// 创建验证码
SliderCaptcha captcha = new SliderCaptcha();

// 获取正确位置
int correctX = captcha.getCorrectX();
int correctY = captcha.getCorrectY();

// 验证用户输入
boolean isValid = captcha.verify(userX, userY);

// 检查验证状态
if (captcha.isVerified()) {
    System.out.println("验证成功！");
}
```

### 2. UI组件使用

```java
// 创建滑块验证码UI
SliderCaptchaUI captchaUI = new SliderCaptchaUI(new SliderCaptchaUI.CaptchaCallback() {
    @Override
    public void onSuccess() {
        System.out.println("验证成功！");
    }
    
    @Override
    public void onFailure() {
        System.out.println("验证失败，请重试");
    }
    
    @Override
    public void onRefresh() {
        System.out.println("验证码已刷新");
    }
});

// 添加到场景中
scene.setRoot(captchaUI);
```

### 3. 图片生成

```java
// 生成验证码示例图片
CaptchaImageGenerator.createCaptchaExample();

// 保存验证码到文件
SliderCaptcha captcha = new SliderCaptcha();
CaptchaImageGenerator.saveCaptchaToFile(captcha, "captcha.png");
```

## 运行测试

### 运行核心功能测试
```bash
cd java-mac-app
mvn compile
java -cp target/classes com.example.app.TestCaptchaSimple
```

### 运行完整应用程序（需要图形界面）
```bash
cd java-mac-app
mvn javafx:run
```

## 测试结果

```
=== 滑块验证码核心功能测试 ===

测试1: 创建滑块验证码
✓ 验证码创建成功
  会话ID: captcha_1760937523724_290
  正确位置: (75, 100)
  是否已验证: false
  是否过期: false

测试2: 验证正确位置
✓ 验证结果: 成功
  验证后状态: true

测试3: 验证错误位置
✓ 验证结果: 失败
  验证后状态: false

测试4: 重复验证（应该失败）
✓ 重复验证结果: 失败

测试5: 边界测试
  容差内验证: 成功
  容差外验证: 失败

测试6: 性能测试（创建100个验证码）
✓ 创建100个验证码耗时: 0ms

测试7: 验证码过期测试
  新验证码是否过期: false
✓ 过期测试完成

测试8: 随机性测试（创建10个验证码，检查位置是否不同）
  位置随机性: 良好

=== 所有测试完成 ===
✓ 滑块验证码核心功能正常工作！
```

## 配置参数

### 验证码参数
- `IMAGE_WIDTH`: 300px - 背景图片宽度
- `IMAGE_HEIGHT`: 200px - 背景图片高度
- `PUZZLE_SIZE`: 50px - 拼图块大小
- `PUZZLE_RADIUS`: 8px - 拼图形状半径
- `TOLERANCE`: 5px - 验证容差
- `EXPIRE_TIME`: 5分钟 - 过期时间

### 自定义配置
可以通过修改`SliderCaptcha`类中的常量来调整验证码参数：

```java
private static final int IMAGE_WIDTH = 300;      // 调整图片宽度
private static final int IMAGE_HEIGHT = 200;     // 调整图片高度
private static final int PUZZLE_SIZE = 50;       // 调整拼图大小
private static final int PUZZLE_RADIUS = 8;      // 调整拼图形状
```

## 依赖项

### Maven依赖
```xml
<dependencies>
    <!-- JavaFX -->
    <dependency>
        <groupId>org.openjfx</groupId>
        <artifactId>javafx-controls</artifactId>
        <version>21.0.1</version>
    </dependency>
    <dependency>
        <groupId>org.openjfx</groupId>
        <artifactId>javafx-fxml</artifactId>
        <version>21.0.1</version>
    </dependency>
    
    <!-- 工具库 -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
        <version>3.12.0</version>
    </dependency>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
    <dependency>
        <groupId>org.imgscalr</groupId>
        <artifactId>imgscalr-lib</artifactId>
        <version>4.2</version>
    </dependency>
</dependencies>
```

## 安全特性

1. **防机器人**: 通过拖拽操作验证人类用户
2. **防重复**: 每个验证码只能验证一次
3. **时间限制**: 验证码有5分钟的有效期
4. **随机性**: 每次生成的拼图位置都是随机的
5. **容差控制**: 允许合理的操作误差

## 扩展功能

### 1. 自定义验证规则
```java
public class CustomSliderCaptcha extends SliderCaptcha {
    @Override
    public boolean verify(int userX, int userY) {
        // 自定义验证逻辑
        return super.verify(userX, userY);
    }
}
```

### 2. 自定义UI样式
```java
// 在SliderCaptchaUI中修改样式
String customStyle = "-fx-background-color: #your-color;";
captchaUI.setStyle(customStyle);
```

### 3. 添加音效
```java
// 在验证成功/失败时播放音效
if (isValid) {
    playSuccessSound();
} else {
    playFailureSound();
}
```

## 故障排除

### 常见问题

1. **JavaFX运行时错误**
   - 确保安装了JavaFX运行时
   - 使用正确的模块路径参数

2. **验证码不显示**
   - 检查图片生成逻辑
   - 确保JavaFX图像组件正确初始化

3. **验证失败**
   - 检查容差设置
   - 确认坐标系统正确

## 许可证

本项目使用开源许可证，可以自由使用和修改。

## 贡献

欢迎提交Issue和Pull Request来改进这个滑块验证码实现。

---

**集成完成！** 🎉

滑块验证码已成功集成到Java应用程序中，提供了完整的验证码功能，包括图片生成、用户交互、验证逻辑等。所有测试都通过，功能正常工作。