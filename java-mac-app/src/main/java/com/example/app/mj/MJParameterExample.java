package com.example.app.mj;

import java.util.HashMap;
import java.util.Map;

/**
 * Example class demonstrating how to use the MJ Parameter Builder
 */
public class MJParameterExample {
    
    public static void main(String[] args) {
        System.out.println("=== Midjourney 参数构建器示例 ===\n");
        
        // Create service instance
        MJParameterService service = new MJParameterService();
        
        // Example 1: Basic prompt with common parameters
        System.out.println("示例 1: 基础提示词");
        Map<String, String> basicParams = new HashMap<>();
        basicParams.put("prompt", "a beautiful sunset over mountains");
        basicParams.put("aspectRatio", "16:9");
        basicParams.put("style", "raw");
        basicParams.put("quality", "2");
        basicParams.put("chaos", "20");
        basicParams.put("stylize", "150");
        
        String basicPrompt = service.buildPrompt(basicParams);
        System.out.println("生成的提示词: " + basicPrompt);
        System.out.println();
        
        // Example 2: Advanced prompt with more parameters
        System.out.println("示例 2: 高级提示词");
        Map<String, String> advancedParams = new HashMap<>();
        advancedParams.put("prompt", "futuristic city skyline at night");
        advancedParams.put("aspectRatio", "4:3");
        advancedParams.put("style", "expressive");
        advancedParams.put("quality", "1");
        advancedParams.put("version", "6");
        advancedParams.put("seed", "12345");
        advancedParams.put("stop", "80");
        advancedParams.put("negativePrompt", "blurry, low quality");
        advancedParams.put("weird", "500");
        
        String advancedPrompt = service.buildPrompt(advancedParams);
        System.out.println("生成的提示词: " + advancedPrompt);
        System.out.println();
        
        // Example 3: Using the builder pattern
        System.out.println("示例 3: 使用构建器模式");
        MJParameterBuilder builder = service.createBuilder();
        String builderPrompt = builder
            .setPrompt("a cute robot playing with a cat")
            .setAspectRatio("1:1")
            .setStyle("cute")
            .setQuality("1")
            .setChaos("10")
            .setStylize("200")
            .setVersion("niji")
            .setSeed("67890")
            .setNegativePrompt("scary, dark")
            .build();
        
        System.out.println("生成的提示词: " + builderPrompt);
        System.out.println();
        
        // Example 4: Parameter validation
        System.out.println("示例 4: 参数验证");
        Map<String, String> invalidParams = new HashMap<>();
        invalidParams.put("prompt", ""); // Empty prompt
        invalidParams.put("aspectRatio", "invalid"); // Invalid aspect ratio
        invalidParams.put("quality", "5"); // Invalid quality
        invalidParams.put("chaos", "150"); // Invalid chaos (over 100)
        
        var validationErrors = service.validateParameters(invalidParams);
        System.out.println("验证错误:");
        for (String error : validationErrors) {
            System.out.println("- " + error);
        }
        System.out.println();
        
        // Example 5: Parse existing prompt
        System.out.println("示例 5: 解析现有提示词");
        String existingPrompt = "a magical forest --ar 16:9 --style raw --q 2 --chaos 30 --stylize 200 --v 6 --seed 11111 --no blurry";
        Map<String, String> parsedParams = service.parsePrompt(existingPrompt);
        System.out.println("解析的参数:");
        for (Map.Entry<String, String> entry : parsedParams.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
        System.out.println();
        
        // Example 6: Get available options
        System.out.println("示例 6: 可用选项");
        Map<String, String> descriptions = service.getAllParameterDescriptions();
        System.out.println("参数描述:");
        for (Map.Entry<String, String> entry : descriptions.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
}