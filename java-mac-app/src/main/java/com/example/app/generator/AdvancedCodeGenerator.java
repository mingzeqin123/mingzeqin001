package com.example.app.generator;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.po.TableFill;
import com.baomidou.mybatisplus.generator.config.po.TableInfo;
import com.baomidou.mybatisplus.generator.config.rules.DateType;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;
import com.example.app.config.DatabaseConfig;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * 高级 MyBatis Plus 代码生成器
 * 支持自定义模板、批量生成、配置保存等功能
 */
public class AdvancedCodeGenerator {
    
    private static final String PROJECT_PATH = System.getProperty("user.dir");
    private static final String JAVA_PATH = "/src/main/java";
    private static final String RESOURCES_PATH = "/src/main/resources";
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("=== 高级 MyBatis Plus 代码生成器 ===");
        System.out.println("1. 快速生成（使用默认配置）");
        System.out.println("2. 自定义配置生成");
        System.out.println("3. 批量生成多个模块");
        System.out.print("请选择生成模式 (1-3): ");
        
        int mode = scanner.nextInt();
        
        switch (mode) {
            case 1:
                quickGenerate(scanner);
                break;
            case 2:
                customGenerate(scanner);
                break;
            case 3:
                batchGenerate(scanner);
                break;
            default:
                System.out.println("无效选择，使用快速生成模式");
                quickGenerate(scanner);
        }
        
        scanner.close();
    }
    
    /**
     * 快速生成模式
     */
    private static void quickGenerate(Scanner scanner) {
        System.out.println("\n=== 快速生成模式 ===");
        
        // 使用默认配置
        String author = "CodeGenerator";
        String packageName = "com.example.demo";
        String moduleName = "user";
        String tableNames = "user,role,permission";
        String outputDir = PROJECT_PATH + "/generated";
        
        System.out.println("使用默认配置:");
        System.out.println("作者: " + author);
        System.out.println("包名: " + packageName);
        System.out.println("模块名: " + moduleName);
        System.out.println("表名: " + tableNames);
        System.out.println("输出目录: " + outputDir);
        
        System.out.print("确认生成？(y/n): ");
        String confirm = scanner.next();
        if ("y".equalsIgnoreCase(confirm) || "yes".equalsIgnoreCase(confirm)) {
            generateCode(DatabaseConfig.DatabaseType.H2, author, packageName, moduleName, tableNames, outputDir);
        }
    }
    
    /**
     * 自定义配置生成模式
     */
    private static void customGenerate(Scanner scanner) {
        System.out.println("\n=== 自定义配置生成模式 ===");
        
        // 数据库选择
        System.out.println("1. MySQL 数据库");
        System.out.println("2. H2 数据库");
        System.out.print("请选择数据库类型 (1-2): ");
        int dbChoice = scanner.nextInt();
        DatabaseConfig.DatabaseType dbType = dbChoice == 1 ? 
            DatabaseConfig.DatabaseType.MYSQL : DatabaseConfig.DatabaseType.H2;
        
        scanner.nextLine(); // 消费换行符
        
        // 获取用户输入
        System.out.print("请输入作者名称: ");
        String author = scanner.nextLine();
        
        System.out.print("请输入包名 (如: com.example.demo): ");
        String packageName = scanner.nextLine();
        
        System.out.print("请输入模块名 (如: user): ");
        String moduleName = scanner.nextLine();
        
        System.out.print("请输入表名 (多个表用逗号分隔): ");
        String tableNames = scanner.nextLine();
        
        System.out.print("请输入输出目录 (默认: " + PROJECT_PATH + "/generated): ");
        String outputDir = scanner.nextLine();
        if (outputDir.trim().isEmpty()) {
            outputDir = PROJECT_PATH + "/generated";
        }
        
        // 生成选项
        System.out.println("\n=== 生成选项 ===");
        System.out.print("是否生成 Swagger 注解？(y/n): ");
        boolean enableSwagger = "y".equalsIgnoreCase(scanner.next());
        
        System.out.print("是否生成 Lombok 注解？(y/n): ");
        boolean enableLombok = "y".equalsIgnoreCase(scanner.next());
        
        System.out.print("是否生成 Controller？(y/n): ");
        boolean enableController = "y".equalsIgnoreCase(scanner.next());
        
        System.out.print("是否生成 Service？(y/n): ");
        boolean enableService = "y".equalsIgnoreCase(scanner.next());
        
        // 执行生成
        generateCodeWithOptions(dbType, author, packageName, moduleName, tableNames, 
                              outputDir, enableSwagger, enableLombok, enableController, enableService);
    }
    
    /**
     * 批量生成模式
     */
    private static void batchGenerate(Scanner scanner) {
        System.out.println("\n=== 批量生成模式 ===");
        
        System.out.print("请输入包名前缀 (如: com.example): ");
        scanner.nextLine(); // 消费换行符
        String packagePrefix = scanner.nextLine();
        
        System.out.print("请输入模块列表 (用逗号分隔，如: user,order,product): ");
        String modules = scanner.nextLine();
        
        System.out.print("请输入每个模块对应的表名 (用分号分隔，如: user,role;order,order_item;product,category): ");
        String tableMapping = scanner.nextLine();
        
        String[] moduleArray = modules.split(",");
        String[] tableArray = tableMapping.split(";");
        
        if (moduleArray.length != tableArray.length) {
            System.err.println("模块数量与表映射数量不匹配！");
            return;
        }
        
        for (int i = 0; i < moduleArray.length; i++) {
            String moduleName = moduleArray[i].trim();
            String tableNames = tableArray[i].trim();
            String packageName = packagePrefix + "." + moduleName;
            String outputDir = PROJECT_PATH + "/generated/" + moduleName;
            
            System.out.println("\n正在生成模块: " + moduleName);
            generateCode(DatabaseConfig.DatabaseType.H2, "CodeGenerator", packageName, 
                        moduleName, tableNames, outputDir);
        }
        
        System.out.println("\n批量生成完成！");
    }
    
    /**
     * 生成代码（基础版本）
     */
    private static void generateCode(DatabaseConfig.DatabaseType dbType, 
                                   String author, 
                                   String packageName, 
                                   String moduleName, 
                                   String tableNames, 
                                   String outputDir) {
        generateCodeWithOptions(dbType, author, packageName, moduleName, tableNames, 
                              outputDir, true, true, true, true);
    }
    
    /**
     * 生成代码（带选项版本）
     */
    private static void generateCodeWithOptions(DatabaseConfig.DatabaseType dbType, 
                                              String author, 
                                              String packageName, 
                                              String moduleName, 
                                              String tableNames, 
                                              String outputDir,
                                              boolean enableSwagger,
                                              boolean enableLombok,
                                              boolean enableController,
                                              boolean enableService) {
        
        try {
            AutoGenerator generator = createAdvancedGenerator(dbType, author, packageName, 
                                                            moduleName, tableNames, outputDir,
                                                            enableSwagger, enableLombok, 
                                                            enableController, enableService);
            
            generator.execute();
            System.out.println("✅ 代码生成完成！输出目录: " + outputDir);
            
        } catch (Exception e) {
            System.err.println("❌ 代码生成失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 创建高级代码生成器
     */
    private static AutoGenerator createAdvancedGenerator(DatabaseConfig.DatabaseType dbType, 
                                                       String author, 
                                                       String packageName, 
                                                       String moduleName, 
                                                       String tableNames, 
                                                       String outputDir,
                                                       boolean enableSwagger,
                                                       boolean enableLombok,
                                                       boolean enableController,
                                                       boolean enableService) {
        
        AutoGenerator generator = new AutoGenerator();
        
        // 全局配置
        GlobalConfig globalConfig = createAdvancedGlobalConfig(author, outputDir, enableSwagger);
        generator.setGlobalConfig(globalConfig);
        
        // 数据源配置
        DataSourceConfig dataSourceConfig = createDataSourceConfig(dbType);
        generator.setDataSource(dataSourceConfig);
        
        // 包配置
        PackageConfig packageConfig = createPackageConfig(packageName, moduleName);
        generator.setPackageInfo(packageConfig);
        
        // 策略配置
        StrategyConfig strategyConfig = createAdvancedStrategyConfig(tableNames, enableLombok, enableController, enableService);
        generator.setStrategy(strategyConfig);
        
        // 模板配置
        TemplateConfig templateConfig = createAdvancedTemplateConfig(enableController, enableService);
        generator.setTemplate(templateConfig);
        
        // 模板引擎
        generator.setTemplateEngine(new FreemarkerTemplateEngine());
        
        return generator;
    }
    
    /**
     * 创建高级全局配置
     */
    private static GlobalConfig createAdvancedGlobalConfig(String author, String outputDir, boolean enableSwagger) {
        GlobalConfig globalConfig = new GlobalConfig();
        globalConfig.setAuthor(author);
        globalConfig.setOutputDir(outputDir + JAVA_PATH);
        globalConfig.setFileOverride(true);
        globalConfig.setOpen(false);
        globalConfig.setSwagger2(enableSwagger);
        globalConfig.setDateType(DateType.ONLY_DATE);
        globalConfig.setIdType(IdType.AUTO);
        globalConfig.setServiceName("%sService");
        globalConfig.setMapperName("%sMapper");
        globalConfig.setXmlName("%sMapper");
        globalConfig.setControllerName("%sController");
        globalConfig.setEntityName("%s");
        return globalConfig;
    }
    
    /**
     * 创建数据源配置
     */
    private static DataSourceConfig createDataSourceConfig(DatabaseConfig.DatabaseType dbType) {
        DataSourceConfig dataSourceConfig = new DataSourceConfig();
        dataSourceConfig.setDbType(DbType.getDbType(dbType.getName()));
        dataSourceConfig.setDriverName(dbType.getDriver());
        dataSourceConfig.setUrl(dbType.getUrl());
        dataSourceConfig.setUsername(dbType.getUsername());
        dataSourceConfig.setPassword(dbType.getPassword());
        return dataSourceConfig;
    }
    
    /**
     * 创建包配置
     */
    private static PackageConfig createPackageConfig(String packageName, String moduleName) {
        PackageConfig packageConfig = new PackageConfig();
        packageConfig.setParent(packageName);
        packageConfig.setModuleName(moduleName);
        packageConfig.setEntity("entity");
        packageConfig.setMapper("mapper");
        packageConfig.setService("service");
        packageConfig.setServiceImpl("service.impl");
        packageConfig.setController("controller");
        packageConfig.setXml("mapper");
        return packageConfig;
    }
    
    /**
     * 创建高级策略配置
     */
    private static StrategyConfig createAdvancedStrategyConfig(String tableNames, 
                                                             boolean enableLombok, 
                                                             boolean enableController, 
                                                             boolean enableService) {
        StrategyConfig strategyConfig = new StrategyConfig();
        strategyConfig.setNaming(NamingStrategy.underline_to_camel);
        strategyConfig.setColumnNaming(NamingStrategy.underline_to_camel);
        strategyConfig.setEntityLombokModel(enableLombok);
        strategyConfig.setRestControllerStyle(enableController);
        strategyConfig.setControllerMappingHyphenStyle(true);
        strategyConfig.setTablePrefix("t_", "sys_", "tb_");
        
        // 设置需要生成的表
        if (tableNames != null && !tableNames.trim().isEmpty()) {
            strategyConfig.setInclude(tableNames.split(","));
        }
        
        // 字段填充策略
        List<TableFill> tableFills = new ArrayList<>();
        tableFills.add(new TableFill("create_time", FieldFill.INSERT));
        tableFills.add(new TableFill("update_time", FieldFill.INSERT_UPDATE));
        strategyConfig.setTableFillList(tableFills);
        
        // 逻辑删除字段
        strategyConfig.setLogicDeleteFieldName("deleted");
        
        return strategyConfig;
    }
    
    /**
     * 创建高级模板配置
     */
    private static TemplateConfig createAdvancedTemplateConfig(boolean enableController, boolean enableService) {
        TemplateConfig templateConfig = new TemplateConfig();
        
        // 根据选项决定是否生成某些文件
        if (!enableController) {
            templateConfig.setController(null);
        }
        if (!enableService) {
            templateConfig.setService(null);
            templateConfig.setServiceImpl(null);
        }
        
        // 不生成 XML 文件，使用注解方式
        templateConfig.setXml(null);
        
        return templateConfig;
    }
}