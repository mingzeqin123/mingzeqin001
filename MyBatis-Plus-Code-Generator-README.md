# MyBatis Plus 代码生成器

这是一个功能完整的 MyBatis Plus 代码生成器，支持快速生成 Entity、Mapper、Service、Controller 等代码，以及相关的配置文件。

## 🚀 功能特性

- ✅ **多种生成模式**：基础生成、高级自定义生成、批量生成
- ✅ **自定义模板**：支持自定义 Entity、Mapper、Service、Controller 模板
- ✅ **配置文件生成**：自动生成 application.yml 和 MyBatis Plus 配置类
- ✅ **示例数据生成**：提供完整的示例数据库表结构
- ✅ **多数据库支持**：支持 MySQL、H2 等数据库
- ✅ **Swagger 集成**：自动生成 Swagger 注解
- ✅ **Lombok 支持**：自动生成 Lombok 注解
- ✅ **逻辑删除**：支持逻辑删除字段配置
- ✅ **字段填充**：支持自动填充创建时间、更新时间等字段

## 📁 项目结构

```
java-mac-app/
├── src/main/java/com/example/app/
│   ├── config/
│   │   ├── DatabaseConfig.java          # 数据库配置
│   │   └── MyBatisPlusConfig.java       # MyBatis Plus 配置类
│   └── generator/
│       ├── MyBatisPlusCodeGenerator.java    # 基础代码生成器
│       ├── AdvancedCodeGenerator.java       # 高级代码生成器
│       ├── ConfigGenerator.java             # 配置文件生成器
│       ├── SampleDataGenerator.java         # 示例数据生成器
│       └── CodeGeneratorLauncher.java       # 启动器
├── src/main/resources/
│   └── templates/                        # 自定义模板文件
│       ├── entity.java.ftl
│       ├── mapper.java.ftl
│       ├── service.java.ftl
│       ├── serviceImpl.java.ftl
│       └── controller.java.ftl
└── sql/                                 # 生成的 SQL 文件
    ├── user_tables.sql
    ├── product_tables.sql
    └── order_tables.sql
```

## 🛠️ 快速开始

### 1. 运行代码生成器

```bash
# 进入项目目录
cd java-mac-app

# 编译项目
mvn clean compile

# 运行启动器
mvn exec:java -Dexec.mainClass="com.example.app.generator.CodeGeneratorLauncher"
```

### 2. 选择生成模式

启动后会看到主菜单：

```
==================================================
           MyBatis Plus 代码生成器
==================================================
1. 基础代码生成器 - 简单快速的代码生成
2. 高级代码生成器 - 自定义配置的代码生成
3. 配置文件生成器 - 生成 MyBatis Plus 配置文件
4. 示例数据生成器 - 生成示例数据库表结构
5. 快速开始 - 一键生成完整项目结构
6. 退出
==================================================
```

### 3. 快速开始（推荐）

选择 `5. 快速开始`，系统将自动：
- 生成示例数据库表结构
- 生成 MyBatis Plus 配置文件
- 生成用户管理模块代码
- 生成商品管理模块代码
- 生成订单管理模块代码

## 📖 详细使用说明

### 基础代码生成器

适用于快速生成代码的场景：

```java
// 运行基础代码生成器
mvn exec:java -Dexec.mainClass="com.example.app.generator.MyBatisPlusCodeGenerator"
```

**配置项：**
- 数据库类型（MySQL/H2）
- 作者名称
- 包名
- 模块名
- 表名（多个表用逗号分隔）
- 输出目录

### 高级代码生成器

提供更多自定义选项：

```java
// 运行高级代码生成器
mvn exec:java -Dexec.mainClass="com.example.app.generator.AdvancedCodeGenerator"
```

**功能特性：**
- 快速生成模式（使用默认配置）
- 自定义配置生成模式
- 批量生成多个模块
- 可选择性生成 Swagger、Lombok、Controller、Service 等

### 配置文件生成器

生成 MyBatis Plus 相关配置文件：

```java
// 运行配置文件生成器
mvn exec:java -Dexec.mainClass="com.example.app.generator.ConfigGenerator"
```

**生成文件：**
- `application.yml` - Spring Boot 配置文件
- `MyBatisPlusConfig.java` - MyBatis Plus 配置类

### 示例数据生成器

生成示例数据库表结构：

```java
// 运行示例数据生成器
mvn exec:java -Dexec.mainClass="com.example.app.generator.SampleDataGenerator"
```

**包含表结构：**
- 用户相关表（用户、角色、权限、关联表）
- 商品相关表（商品分类、商品）
- 订单相关表（订单、订单详情）

## 🔧 配置说明

### 数据库配置

在 `DatabaseConfig.java` 中配置数据库连接信息：

```java
// MySQL 配置
public static final String MYSQL_URL = "jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8";
public static final String MYSQL_USERNAME = "root";
public static final String MYSQL_PASSWORD = "123456";

// H2 配置（用于测试）
public static final String H2_URL = "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
public static final String H2_USERNAME = "sa";
public static final String H2_PASSWORD = "";
```

### 自定义模板

模板文件位于 `src/main/resources/templates/` 目录：

- `entity.java.ftl` - 实体类模板
- `mapper.java.ftl` - Mapper 接口模板
- `service.java.ftl` - Service 接口模板
- `serviceImpl.java.ftl` - Service 实现类模板
- `controller.java.ftl` - Controller 模板

## 📝 生成代码示例

### 实体类示例

```java
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@ApiModel(value = "User对象", description = "用户表")
public class User implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @ApiModelProperty(value = "用户ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    @ApiModelProperty(value = "用户名")
    @TableField("username")
    private String username;
    
    @ApiModelProperty(value = "密码")
    @TableField("password")
    private String password;
    
    @ApiModelProperty(value = "创建时间")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @ApiModelProperty(value = "更新时间")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    
    @ApiModelProperty(value = "逻辑删除")
    @TableLogic
    private Integer deleted;
}
```

### Controller 示例

```java
@Api(tags = "用户管理")
@RestController
@RequestMapping("/user")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @ApiOperation(value = "分页查询用户")
    @GetMapping("/page")
    public IPage<User> page(
            @ApiParam(value = "页码", defaultValue = "1") @RequestParam(defaultValue = "1") Integer current,
            @ApiParam(value = "每页数量", defaultValue = "10") @RequestParam(defaultValue = "10") Integer size,
            @ApiParam(value = "查询条件") User user) {
        Page<User> page = new Page<>(current, size);
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        return userService.page(page, queryWrapper);
    }
    
    @ApiOperation(value = "根据ID查询用户")
    @GetMapping("/{id}")
    public User getById(@ApiParam(value = "ID") @PathVariable("id") Long id) {
        return userService.getById(id);
    }
    
    @ApiOperation(value = "新增用户")
    @PostMapping
    public boolean save(@ApiParam(value = "用户对象") @RequestBody User user) {
        return userService.save(user);
    }
    
    // ... 其他方法
}
```

## 🎯 最佳实践

### 1. 项目结构建议

```
src/main/java/com/example/demo/
├── entity/          # 实体类
├── mapper/          # Mapper 接口
├── service/         # Service 接口
├── service/impl/    # Service 实现类
├── controller/      # Controller
└── config/          # 配置类
```

### 2. 命名规范

- 实体类：使用 PascalCase，如 `User`、`UserRole`
- 表名：使用下划线命名，如 `t_user`、`t_user_role`
- 字段名：使用下划线命名，如 `user_name`、`create_time`
- 包名：使用小写字母和点分隔，如 `com.example.demo`

### 3. 字段配置

- 主键：使用 `@TableId(type = IdType.AUTO)`
- 逻辑删除：使用 `@TableLogic`
- 字段填充：使用 `@TableField(fill = FieldFill.INSERT)`
- 忽略字段：使用 `@TableField(exist = false)`

## 🔍 常见问题

### Q: 如何修改生成的代码模板？

A: 编辑 `src/main/resources/templates/` 目录下的 `.ftl` 文件，然后重新运行生成器。

### Q: 如何添加自定义字段填充策略？

A: 在 `StrategyConfig` 中添加 `TableFill` 配置：

```java
List<TableFill> tableFills = new ArrayList<>();
tableFills.add(new TableFill("create_time", FieldFill.INSERT));
tableFills.add(new TableFill("update_time", FieldFill.INSERT_UPDATE));
strategyConfig.setTableFillList(tableFills);
```

### Q: 如何生成 XML 映射文件？

A: 在 `TemplateConfig` 中不设置 `setXml(null)`，或者创建自定义的 XML 模板。

### Q: 如何支持多数据源？

A: 修改 `DataSourceConfig` 配置，或者创建多个数据源配置类。

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 微信交流群

---

**Happy Coding! 🎉**