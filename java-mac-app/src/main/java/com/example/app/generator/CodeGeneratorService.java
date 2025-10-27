package com.example.app.generator;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.core.toolkit.StringPool;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.InjectionConfig;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.po.TableFill;
import com.baomidou.mybatisplus.generator.config.po.TableInfo;
import com.baomidou.mybatisplus.generator.config.rules.DateType;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.VelocityTemplateEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 代码生成器服务类
 * 
 * @author MyBatis Plus Generator
 * @since 2024-01-15
 */
@Slf4j
@Service
public class CodeGeneratorService {

    @Autowired
    private GeneratorConfig generatorConfig;

    /**
     * 生成代码
     * 
     * @param moduleName 模块名
     * @param tableNames 表名列表，多个用逗号分隔
     */
    public void generateCode(String moduleName, String tableNames) {
        log.info("开始生成代码，模块名：{}，表名：{}", moduleName, tableNames);
        
        // 代码生成器
        AutoGenerator mpg = new AutoGenerator();

        // 全局配置
        GlobalConfig gc = buildGlobalConfig();
        mpg.setGlobalConfig(gc);

        // 数据源配置
        DataSourceConfig dsc = buildDataSourceConfig();
        mpg.setDataSource(dsc);

        // 包配置
        PackageConfig pc = buildPackageConfig(moduleName);
        mpg.setPackageInfo(pc);

        // 自定义配置
        InjectionConfig cfg = buildInjectionConfig(pc);
        mpg.setCfg(cfg);

        // 配置模板
        TemplateConfig templateConfig = buildTemplateConfig();
        mpg.setTemplate(templateConfig);

        // 策略配置
        StrategyConfig strategy = buildStrategyConfig(tableNames, pc);
        mpg.setStrategy(strategy);

        // 使用Velocity模板引擎
        mpg.setTemplateEngine(new VelocityTemplateEngine());
        
        // 执行生成
        mpg.execute();
        
        log.info("代码生成完成！");
    }

    /**
     * 构建全局配置
     */
    private GlobalConfig buildGlobalConfig() {
        GlobalConfig gc = new GlobalConfig();
        
        GeneratorConfig.GlobalConfig globalConfig = generatorConfig.getGlobal();
        
        gc.setOutputDir(globalConfig.getOutputDir());
        gc.setAuthor(globalConfig.getAuthor());
        gc.setOpen(globalConfig.getOpen());
        gc.setFileOverride(globalConfig.getFileOverride());
        gc.setServiceName("%sService"); // 去掉Service接口的首字母I
        gc.setIdType(IdType.ASSIGN_ID); // 主键策略
        
        // 设置日期类型
        if ("ONLY_DATE".equals(globalConfig.getDateType())) {
            gc.setDateType(DateType.ONLY_DATE);
        } else if ("SQL_PACK".equals(globalConfig.getDateType())) {
            gc.setDateType(DateType.SQL_PACK);
        } else {
            gc.setDateType(DateType.TIME_PACK);
        }
        
        gc.setSwagger2(true); // 开启Swagger2模式
        
        return gc;
    }

    /**
     * 构建数据源配置
     */
    private DataSourceConfig buildDataSourceConfig() {
        DataSourceConfig dsc = new DataSourceConfig();
        
        GeneratorConfig.DataSourceConfig datasourceConfig = generatorConfig.getDatasource();
        
        dsc.setUrl(datasourceConfig.getUrl());
        dsc.setDriverName(datasourceConfig.getDriverName());
        dsc.setUsername(datasourceConfig.getUsername());
        dsc.setPassword(datasourceConfig.getPassword());
        
        return dsc;
    }

    /**
     * 构建包配置
     */
    private PackageConfig buildPackageConfig(String moduleName) {
        PackageConfig pc = new PackageConfig();
        
        GeneratorConfig.PackageConfig packageConfig = generatorConfig.getPackageConfig();
        
        pc.setModuleName(moduleName);
        pc.setParent(packageConfig.getParent());
        pc.setEntity(packageConfig.getEntity());
        pc.setMapper(packageConfig.getMapper());
        pc.setService(packageConfig.getService());
        pc.setServiceImpl(packageConfig.getServiceImpl());
        pc.setController(packageConfig.getController());
        
        return pc;
    }

    /**
     * 构建自定义配置
     */
    private InjectionConfig buildInjectionConfig(PackageConfig pc) {
        InjectionConfig cfg = new InjectionConfig() {
            @Override
            public void initMap() {
                // to do nothing
            }
        };

        // 如果模板引擎是 velocity
        String templatePath = "/templates/mapper.xml.vm";
        
        // 自定义输出配置
        List<FileOutConfig> focList = new ArrayList<>();
        
        // 自定义配置会被优先输出
        focList.add(new FileOutConfig(templatePath) {
            @Override
            public String outputFile(TableInfo tableInfo) {
                // 自定义输出文件名
                return generatorConfig.getGlobal().getOutputDir().replace("/java", "/resources")
                        + "/mapper/" + pc.getModuleName()
                        + "/" + tableInfo.getEntityName() + "Mapper" + StringPool.DOT_XML;
            }
        });
        
        cfg.setFileOutConfigList(focList);
        
        return cfg;
    }

    /**
     * 构建模板配置
     */
    private TemplateConfig buildTemplateConfig() {
        TemplateConfig templateConfig = new TemplateConfig();
        
        // 配置自定义输出模板
        // 指定自定义模板路径，注意不要带上.ftl/.vm, 会根据使用的模板引擎自动识别
        templateConfig.setXml(null);
        
        return templateConfig;
    }

    /**
     * 构建策略配置
     */
    private StrategyConfig buildStrategyConfig(String tableNames, PackageConfig pc) {
        StrategyConfig strategy = new StrategyConfig();
        
        GeneratorConfig.StrategyConfig strategyConfig = generatorConfig.getStrategy();
        
        // 数据库表映射到实体的命名策略
        if ("underline_to_camel".equals(strategyConfig.getNaming())) {
            strategy.setNaming(NamingStrategy.underline_to_camel);
        } else if ("no_change".equals(strategyConfig.getNaming())) {
            strategy.setNaming(NamingStrategy.no_change);
        }
        
        // 数据库表字段映射到实体的命名策略
        if ("underline_to_camel".equals(strategyConfig.getColumnNaming())) {
            strategy.setColumnNaming(NamingStrategy.underline_to_camel);
        } else if ("no_change".equals(strategyConfig.getColumnNaming())) {
            strategy.setColumnNaming(NamingStrategy.no_change);
        }
        
        strategy.setEntityLombokModel(strategyConfig.getEntityLombokModel()); // lombok模型
        strategy.setRestControllerStyle(strategyConfig.getRestControllerStyle()); // restful api风格控制器
        
        // 需要包含的表名
        if (!StringUtils.isEmpty(tableNames)) {
            strategy.setInclude(tableNames.split(","));
        }
        
        strategy.setControllerMappingHyphenStyle(strategyConfig.getControllerMappingHyphenStyle()); // 驼峰转连字符
        strategy.setTablePrefix(pc.getModuleName() + "_"); // 表前缀

        // 公共字段填充
        List<TableFill> tableFillList = new ArrayList<>();
        if (strategyConfig.getTableFillList() != null) {
            for (GeneratorConfig.TableFillConfig fillConfig : strategyConfig.getTableFillList()) {
                FieldFill fieldFill = FieldFill.DEFAULT;
                if ("INSERT".equals(fillConfig.getFieldFill())) {
                    fieldFill = FieldFill.INSERT;
                } else if ("UPDATE".equals(fillConfig.getFieldFill())) {
                    fieldFill = FieldFill.UPDATE;
                } else if ("INSERT_UPDATE".equals(fillConfig.getFieldFill())) {
                    fieldFill = FieldFill.INSERT_UPDATE;
                }
                tableFillList.add(new TableFill(fillConfig.getFieldName(), fieldFill));
            }
        }
        strategy.setTableFillList(tableFillList);

        // 乐观锁配置
        if (!StringUtils.isEmpty(strategyConfig.getVersionFieldName())) {
            strategy.setVersionFieldName(strategyConfig.getVersionFieldName());
        }
        
        // 逻辑删除配置
        if (!StringUtils.isEmpty(strategyConfig.getLogicDeleteFieldName())) {
            strategy.setLogicDeleteFieldName(strategyConfig.getLogicDeleteFieldName());
        }

        return strategy;
    }

    /**
     * 获取所有表名
     */
    public List<String> getAllTableNames() {
        // 这里可以实现获取数据库中所有表名的逻辑
        // 为了简化，这里返回一个示例列表
        return Arrays.asList("user", "role", "permission", "user_role", "role_permission");
    }
}