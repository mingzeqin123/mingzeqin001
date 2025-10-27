package com.example.app.controller;

import com.example.app.generator.CodeGeneratorService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 代码生成器控制器
 * 
 * @author MyBatis Plus Generator
 * @since 2024-01-15
 */
@Slf4j
@Api(tags = "代码生成器")
@RestController
@RequestMapping("/api/generator")
@CrossOrigin(origins = "*")
public class GeneratorController {

    @Autowired
    private CodeGeneratorService codeGeneratorService;

    /**
     * 生成代码
     */
    @ApiOperation("生成代码")
    @PostMapping("/generate")
    public Map<String, Object> generateCode(
            @ApiParam("模块名") @RequestParam String moduleName,
            @ApiParam("表名列表，多个用逗号分隔") @RequestParam String tableNames) {
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("接收到代码生成请求，模块名：{}，表名：{}", moduleName, tableNames);
            
            codeGeneratorService.generateCode(moduleName, tableNames);
            
            result.put("success", true);
            result.put("message", "代码生成成功！");
            result.put("data", null);
            
            log.info("代码生成成功完成");
            
        } catch (Exception e) {
            log.error("代码生成失败", e);
            
            result.put("success", false);
            result.put("message", "代码生成失败：" + e.getMessage());
            result.put("data", null);
        }
        
        return result;
    }

    /**
     * 获取所有表名
     */
    @ApiOperation("获取所有表名")
    @GetMapping("/tables")
    public Map<String, Object> getAllTableNames() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<String> tableNames = codeGeneratorService.getAllTableNames();
            
            result.put("success", true);
            result.put("message", "获取表名成功");
            result.put("data", tableNames);
            
        } catch (Exception e) {
            log.error("获取表名失败", e);
            
            result.put("success", false);
            result.put("message", "获取表名失败：" + e.getMessage());
            result.put("data", null);
        }
        
        return result;
    }

    /**
     * 健康检查
     */
    @ApiOperation("健康检查")
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "代码生成器服务正常运行");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}