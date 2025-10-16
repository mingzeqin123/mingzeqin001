package com.example.app.controller;

import com.example.app.model.MidJourneyParameters;
import com.example.app.service.MidJourneyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MidJourney参数构建REST API控制器
 * 提供参数构建、预设管理和命令生成的API接口
 */
@RestController
@RequestMapping("/api/midjourney")
@CrossOrigin(origins = "*") // 允许跨域访问
public class MidJourneyController {
    
    @Autowired
    private MidJourneyService midJourneyService;
    
    /**
     * 构建MidJourney命令
     */
    @PostMapping("/build-command")
    public ResponseEntity<Map<String, Object>> buildCommand(@RequestBody MidJourneyParameters parameters) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 验证参数
            List<String> validationErrors = parameters.validate();
            if (!validationErrors.isEmpty()) {
                response.put("success", false);
                response.put("errors", validationErrors);
                return ResponseEntity.badRequest().body(response);
            }
            
            // 构建命令
            String command = midJourneyService.buildMidJourneyCommand(parameters);
            String parameterString = parameters.buildCommand();
            
            response.put("success", true);
            response.put("command", command);
            response.put("parameters", parameterString);
            response.put("data", parameters);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "构建命令时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取预设参数
     */
    @GetMapping("/preset/{presetType}")
    public ResponseEntity<Map<String, Object>> getPreset(@PathVariable String presetType) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            MidJourneyParameters parameters = midJourneyService.createPresetParameters(presetType);
            String command = midJourneyService.buildMidJourneyCommand(parameters);
            
            response.put("success", true);
            response.put("parameters", parameters);
            response.put("command", command);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "获取预设参数时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取所有预设选项
     */
    @GetMapping("/options")
    public ResponseEntity<Map<String, Object>> getOptions() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> options = midJourneyService.getPresetOptions();
            response.put("success", true);
            response.put("options", options);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "获取选项时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取智能建议
     */
    @PostMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSuggestions(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String prompt = request.get("prompt");
            Map<String, Object> suggestions = midJourneyService.getSuggestions(prompt);
            
            response.put("success", true);
            response.put("suggestions", suggestions);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "获取建议时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 生成随机种子
     */
    @GetMapping("/random-seed")
    public ResponseEntity<Map<String, Object>> getRandomSeed() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Integer seed = midJourneyService.generateRandomSeed();
            response.put("success", true);
            response.put("seed", seed);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "生成随机种子时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 验证参数
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateParameters(@RequestBody MidJourneyParameters parameters) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<String> validationErrors = parameters.validate();
            
            response.put("success", true);
            response.put("valid", validationErrors.isEmpty());
            response.put("errors", validationErrors);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "验证参数时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取默认参数
     */
    @GetMapping("/default")
    public ResponseEntity<Map<String, Object>> getDefaultParameters() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            MidJourneyParameters parameters = midJourneyService.createDefaultParameters();
            String command = midJourneyService.buildMidJourneyCommand(parameters);
            
            response.put("success", true);
            response.put("parameters", parameters);
            response.put("command", command);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "获取默认参数时发生错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}