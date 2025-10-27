# MyBatis Plus 代码生成器

## 📖 项目简介

这是一个基于 MyBatis Plus 的代码生成器项目，可以快速生成实体类（Entity）、数据访问层（Mapper）、业务逻辑层（Service）、控制器（Controller）等代码，大大提高开发效率。

## ✨ 功能特性

- 🚀 **快速生成**：一键生成完整的 CRUD 代码
- 🎯 **高度可配置**：支持自定义模板和配置
- 📱 **Web界面**：提供友好的Web操作界面
- 🔧 **RESTful API**：支持API调用方式生成代码
- 📊 **数据库监控**：集成Druid数据库连接池监控
- 📚 **API文档**：集成Swagger API文档
- 🔄 **乐观锁支持**：自动配置乐观锁
- 🗑️ **逻辑删除**：支持逻辑删除功能
- ⏰ **自动填充**：自动填充创建时间和更新时间

## 🛠️ 技术栈

- **Spring Boot 3.2.0**：应用框架
- **MyBatis Plus 3.5.4.1**：持久层框架
- **MySQL 8.0**：数据库
- **Druid 1.2.20**：数据库连接池
- **Swagger 3.0.0**：API文档
- **Lombok**：简化Java代码
- **Velocity**：模板引擎

## 🚀 快速开始

### 1. 环境要求

- JDK 21+
- Maven 3.6+
- MySQL 8.0+

### 2. 数据库准备

```sql
-- 创建数据库
CREATE DATABASE mybatis_plus_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 导入示例数据
-- 执行 src/main/resources/sql/init.sql 中的SQL脚本
```

### 3. 配置修改

修改 `src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mybatis_plus_demo?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
    username: your_username
    password: your_password
```

### 4. 启动应用

```bash
# 进入项目目录
cd java-mac-app

# 编译项目
mvn clean compile

# 启动应用
mvn spring-boot:run
```

或者直接运行主类：
```bash
java -cp target/classes com.example.app.MybatisPlusGeneratorApplication
```

### 5. 访问应用

- **Web界面**：http://localhost:8080
- **API文档**：http://localhost:8080/swagger-ui.html
- **数据库监控**：http://localhost:8080/druid/index.html
- **健康检查**：http://localhost:8080/api/generator/health

## 📋 使用方式

### 方式一：Web界面操作

1. 打开浏览器访问 http://localhost:8080
2. 填写模块名称（如：user、order等）
3. 填写数据表名（多个表名用逗号分隔）
4. 点击"生成代码"按钮
5. 等待生成完成，检查项目目录中的生成文件

### 方式二：API调用

```bash
# 生成代码
curl -X POST "http://localhost:8080/api/generator/generate" \
  -d "moduleName=user&tableNames=user,role"

# 获取所有表名
curl -X GET "http://localhost:8080/api/generator/tables"

# 健康检查
curl -X GET "http://localhost:8080/api/generator/health"
```

### 方式三：直接运行代码生成器

运行 `com.example.app.generator.CodeGenerator` 类的 main 方法，按照提示输入模块名和表名。

## 📁 生成的代码结构

```
src/main/java/com/example/app/
├── entity/          # 实体类
│   └── User.java
├── mapper/          # Mapper接口
│   └── UserMapper.java
├── service/         # Service接口
│   └── UserService.java
├── service/impl/    # Service实现类
│   └── UserServiceImpl.java
└── controller/      # Controller控制器
    └── UserController.java

src/main/resources/mapper/
└── user/            # Mapper XML文件
    └── UserMapper.xml
```

## ⚙️ 配置说明

### 全局配置

在 `application.yml` 中可以配置：

```yaml
generator:
  global:
    author: "Your Name"                    # 作者名称
    output-dir: "/your/output/directory"   # 输出目录
    file-override: false                   # 是否覆盖已有文件
    open: true                            # 是否打开输出目录
```

### 包配置

```yaml
generator:
  package:
    parent: com.example.app               # 父包名
    entity: entity                        # 实体类包名
    mapper: mapper                        # Mapper包名
    service: service                      # Service包名
    controller: controller                # Controller包名
```

### 策略配置

```yaml
generator:
  strategy:
    naming: underline_to_camel           # 命名策略
    entity-lombok-model: true            # 使用Lombok
    rest-controller-style: true          # REST风格控制器
    logic-delete-field-name: deleted     # 逻辑删除字段名
    version-field-name: version          # 乐观锁字段名
```

## 🎨 自定义模板

如果需要自定义生成的代码模板，可以：

1. 在 `src/main/resources/templates/` 目录下创建自定义模板文件
2. 修改 `CodeGeneratorService` 中的模板配置
3. 使用Velocity模板语法编写模板

## 📊 数据库监控

访问 http://localhost:8080/druid/index.html 可以查看：

- 数据源配置信息
- SQL执行统计
- 连接池状态
- 慢SQL监控

默认登录信息：
- 用户名：admin
- 密码：123456

## 🔍 API文档

访问 http://localhost:8080/swagger-ui.html 可以查看完整的API文档，包括：

- 代码生成相关接口
- 请求参数说明
- 响应结果示例
- 在线测试功能

## 🐛 常见问题

### 1. 数据库连接失败

- 检查数据库服务是否启动
- 确认数据库连接信息是否正确
- 检查防火墙设置

### 2. 代码生成失败

- 确认数据表是否存在
- 检查表名拼写是否正确
- 查看控制台错误日志

### 3. 生成的文件被覆盖

- 设置 `file-override: false` 防止覆盖
- 备份重要的自定义代码

### 4. 中文乱码问题

- 确保数据库字符集为 utf8mb4
- 检查IDE编码设置
- 确认JVM启动参数包含 `-Dfile.encoding=UTF-8`

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✨ 初始版本发布
- 🚀 支持基础代码生成功能
- 📱 提供Web操作界面
- 📊 集成数据库监控
- 📚 集成API文档

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: mybatis-plus@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 文档: [项目文档](https://github.com/your-repo/wiki)

---

⭐ 如果这个项目对你有帮助，请给个星星支持一下！