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
 * MyBatis Plus 代码生成器
 * 支持生成 Entity、Mapper、Service、Controller 等代码
 */
public class MyBatisPlusCodeGenerator {
    
    private static final String PROJECT_PATH = System.getProperty("user.dir");
    private static final String JAVA_PATH = "/src/main/java";
    private static final String RESOURCES_PATH = "/src/main/resources";
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("=== MyBatis Plus 代码生成器 ===");
        System.out.println("1. MySQL 数据库");
        System.out.println("2. H2 数据库");
        System.out.print("请选择数据库类型 (1-2): ");
        
        int dbChoice = scanner.nextInt();
        DatabaseConfig.DatabaseType dbType = dbChoice == 1 ? 
            DatabaseConfig.DatabaseType.MYSQL : DatabaseConfig.DatabaseType.H2;
        
        System.out.print("请输入作者名称: ");
        scanner.nextLine(); // 消费换行符
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
        
        // 创建代码生成器
        AutoGenerator generator = createGenerator(dbType, author, packageName, moduleName, tableNames, outputDir);
        
        // 执行生成
        try {
            generator.execute();
            System.out.println("代码生成完成！输出目录: " + outputDir);
        } catch (Exception e) {
            System.err.println("代码生成失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        scanner.close();
    }
    
    /**
     * 创建代码生成器
     */
    private static AutoGenerator createGenerator(DatabaseConfig.DatabaseType dbType, 
                                               String author, 
                                               String packageName, 
                                               String moduleName, 
                                               String tableNames, 
                                               String outputDir) {
        
        AutoGenerator generator = new AutoGenerator();
        
        // 全局配置
        GlobalConfig globalConfig = createGlobalConfig(author, outputDir);
        generator.setGlobalConfig(globalConfig);
        
        // 数据源配置
        DataSourceConfig dataSourceConfig = createDataSourceConfig(dbType);
        generator.setDataSource(dataSourceConfig);
        
        // 包配置
        PackageConfig packageConfig = createPackageConfig(packageName, moduleName);
        generator.setPackageInfo(packageConfig);
        
        // 策略配置
        StrategyConfig strategyConfig = createStrategyConfig(tableNames);
        generator.setStrategy(strategyConfig);
        
        // 模板配置
        TemplateConfig templateConfig = createTemplateConfig();
        generator.setTemplate(templateConfig);
        
        // 模板引擎
        generator.setTemplateEngine(new FreemarkerTemplateEngine());
        
        return generator;
    }
    
    /**
     * 创建全局配置
     */
    private static GlobalConfig createGlobalConfig(String author, String outputDir) {
        GlobalConfig globalConfig = new GlobalConfig();
        globalConfig.setAuthor(author);
        globalConfig.setOutputDir(outputDir + JAVA_PATH);
        globalConfig.setFileOverride(true);
        globalConfig.setOpen(false);
        globalConfig.setSwagger2(true);
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
     * 创建策略配置
     */
    private static StrategyConfig createStrategyConfig(String tableNames) {
        StrategyConfig strategyConfig = new StrategyConfig();
        strategyConfig.setNaming(NamingStrategy.underline_to_camel);
        strategyConfig.setColumnNaming(NamingStrategy.underline_to_camel);
        strategyConfig.setEntityLombokModel(true);
        strategyConfig.setRestControllerStyle(true);
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
     * 创建模板配置
     */
    private static TemplateConfig createTemplateConfig() {
        TemplateConfig templateConfig = new TemplateConfig();
        // 不生成 XML 文件，使用注解方式
        templateConfig.setXml(null);
        return templateConfig;
    }
}