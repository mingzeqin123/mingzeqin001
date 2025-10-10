# Spring Boot i18n 解决方案指南

## 概述

本项目演示了如何在 Spring Boot 应用程序中正确处理国际化（i18n）问题。该解决方案包含了完整的多语言支持，包括中文和英文。

## 主要特性

- ✅ 完整的 Spring Boot i18n 配置
- ✅ 支持中文（简体）和英文
- ✅ REST API 端点用于获取本地化消息
- ✅ Web 界面支持动态语言切换
- ✅ 消息参数化支持
- ✅ 自动语言检测和回退机制
- ✅ 完整的测试覆盖

## 项目结构

```
src/
├── main/
│   ├── java/
│   │   └── com/example/app/
│   │       ├── SpringBootI18nApplication.java    # 主应用类
│   │       ├── config/
│   │       │   └── I18nConfig.java              # i18n 配置
│   │       └── controller/
│   │           ├── I18nController.java          # i18n REST API
│   │           └── WebController.java           # Web 控制器
│   └── resources/
│       ├── messages/
│       │   ├── messages.properties              # 英文消息
│       │   └── messages_zh_CN.properties        # 中文消息
│       ├── templates/
│       │   └── index.html                       # 主页面模板
│       └── application.properties               # 应用配置
└── test/
    └── java/
        └── com/example/app/
            └── controller/
                └── I18nControllerTest.java      # 测试类
```

## 核心组件

### 1. 主应用类 (SpringBootI18nApplication.java)

```java
@SpringBootApplication
public class SpringBootI18nApplication implements WebMvcConfigurer {
    
    @Bean
    public LocaleResolver localeResolver() {
        SessionLocaleResolver localeResolver = new SessionLocaleResolver();
        localeResolver.setDefaultLocale(Locale.SIMPLIFIED_CHINESE);
        return localeResolver;
    }
    
    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");
        return interceptor;
    }
}
```

### 2. i18n 配置 (I18nConfig.java)

```java
@Configuration
public class I18nConfig {
    
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages/messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setUseCodeAsDefaultMessage(true);
        messageSource.setCacheSeconds(3600);
        return messageSource;
    }
}
```

### 3. 消息属性文件

**messages.properties (英文)**
```properties
app.title=Mac Java Application v1.0
app.welcome.title=Welcome to Mac Java Application
message.greeting=Hello! Welcome to this Java application!
```

**messages_zh_CN.properties (中文)**
```properties
app.title=Mac Java 应用程序 v1.0
app.welcome.title=欢迎使用 Mac Java 应用程序
message.greeting=你好！欢迎使用这个Java应用程序！
```

## API 端点

### 1. 获取所有消息
```
GET /api/i18n/messages?lang=en
GET /api/i18n/messages?lang=zh_CN
```

### 2. 获取特定消息
```
GET /api/i18n/message/{key}?lang=en&args=param1,param2
```

### 3. 获取系统信息
```
GET /api/i18n/system-info?lang=en
```

### 4. 获取问候消息
```
GET /api/i18n/greeting?lang=en
```

### 5. 获取启动消息
```
GET /api/i18n/startup?lang=en
```

## 使用方法

### 1. 启动应用

```bash
cd java-mac-app
mvn spring-boot:run
```

### 2. 访问 Web 界面

打开浏览器访问: http://localhost:8080

### 3. 测试 API

```bash
# 获取英文消息
curl "http://localhost:8080/api/i18n/messages?lang=en"

# 获取中文消息
curl "http://localhost:8080/api/i18n/messages?lang=zh_CN"

# 获取特定消息
curl "http://localhost:8080/api/i18n/message/app.title?lang=en"
```

## 关键配置

### application.properties

```properties
# i18n 配置
spring.messages.basename=messages/messages
spring.messages.encoding=UTF-8
spring.messages.cache-duration=3600
spring.messages.use-code-as-default-message=true

# Thymeleaf 配置
spring.thymeleaf.cache=false
spring.thymeleaf.encoding=UTF-8
```

## 最佳实践

### 1. 消息键命名规范
- 使用点号分隔的层次结构：`app.section.key`
- 使用有意义的描述性名称
- 保持一致性

### 2. 参数化消息
```properties
# 支持参数的消息
message.current.time=Current time: {0}
file.selected=Selected file: {0}
```

### 3. 默认语言处理
- 总是提供默认的 messages.properties
- 使用 `use-code-as-default-message=true` 作为后备

### 4. 编码处理
- 所有属性文件使用 UTF-8 编码
- 在 Maven 中设置 `project.build.sourceEncoding=UTF-8`

## 测试

运行测试：
```bash
mvn test
```

测试覆盖：
- 消息源配置测试
- 不同语言的消息获取测试
- REST API 端点测试
- 参数化消息测试

## 扩展支持

### 添加新语言

1. 创建新的属性文件：`messages_ja.properties` (日文)
2. 添加相应的消息翻译
3. 在 Web 界面中添加语言选择选项

### 添加新消息

1. 在 `messages.properties` 中添加英文消息
2. 在所有语言文件中添加翻译
3. 在控制器中使用 `MessageSource` 获取消息

## 常见问题解决

### 1. 中文乱码问题
- 确保所有文件使用 UTF-8 编码
- 在 Maven 配置中设置正确的编码
- 在 application.properties 中设置 `spring.messages.encoding=UTF-8`

### 2. 消息不显示
- 检查消息键是否正确
- 确认属性文件路径正确
- 验证 MessageSource 配置

### 3. 语言切换不生效
- 检查 LocaleResolver 配置
- 确认 LocaleChangeInterceptor 正确注册
- 验证 URL 参数名称是否正确

## 总结

这个 i18n 解决方案提供了完整的国际化支持，包括：

- 完整的 Spring Boot 配置
- 多语言消息支持
- REST API 接口
- Web 界面集成
- 全面的测试覆盖
- 详细的文档说明

通过这个解决方案，你可以轻松地在 Spring Boot 应用中实现国际化功能，支持多种语言，并提供良好的用户体验。