package com.example.app.service;

import com.example.app.model.MidJourneyParameters;
import com.example.app.model.MidJourneyParameters.AspectRatio;
import com.example.app.model.MidJourneyParameters.Quality;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * MidJourney参数构建服务
 * 提供参数构建、预设模板和智能建议功能
 */
public class MidJourneyService {
    
    private final Random random = new Random();
    
    /**
     * 创建默认参数
     */
    public MidJourneyParameters createDefaultParameters() {
        MidJourneyParameters params = new MidJourneyParameters();
        params.setPrompt("a beautiful landscape");
        return params;
    }
    
    /**
     * 根据预设类型创建参数
     */
    public MidJourneyParameters createPresetParameters(String presetType) {
        MidJourneyParameters params = new MidJourneyParameters();
        
        switch (presetType.toLowerCase()) {
            case "portrait":
                params.setPrompt("professional portrait photography");
                params.setAspectRatio(AspectRatio.PORTRAIT_2_3);
                params.setStylize(150.0);
                params.setQuality(Quality.HIGH);
                params.setLightingStyle("soft studio lighting");
                params.setCameraAngle("eye level");
                break;
                
            case "landscape":
                params.setPrompt("stunning natural landscape");
                params.setAspectRatio(AspectRatio.LANDSCAPE_16_9);
                params.setStylize(200.0);
                params.setQuality(Quality.HIGH);
                params.setLightingStyle("golden hour");
                params.setCameraAngle("wide angle");
                break;
                
            case "anime":
                params.setPrompt("anime style illustration");
                params.setAspectRatio(AspectRatio.PORTRAIT_4_5);
                params.setStylize(500.0);
                params.setQuality(Quality.STANDARD);
                params.setArtStyle("anime, manga style");
                params.setColorPalette("vibrant colors");
                break;
                
            case "realistic":
                params.setPrompt("photorealistic");
                params.setAspectRatio(AspectRatio.SQUARE);
                params.setStylize(50.0);
                params.setQuality(Quality.HIGH);
                params.setArtStyle("hyperrealistic, detailed");
                break;
                
            case "abstract":
                params.setPrompt("abstract art");
                params.setAspectRatio(AspectRatio.SQUARE);
                params.setStylize(800.0);
                params.setChaos(50.0);
                params.setColorPalette("bold colors");
                params.setArtStyle("modern abstract");
                break;
                
            case "minimalist":
                params.setPrompt("minimalist design");
                params.setAspectRatio(AspectRatio.SQUARE);
                params.setStylize(25.0);
                params.setQuality(Quality.STANDARD);
                params.setColorPalette("monochrome");
                params.setArtStyle("clean, simple");
                break;
                
            default:
                return createDefaultParameters();
        }
        
        return params;
    }
    
    /**
     * 构建完整的MidJourney命令
     */
    public String buildMidJourneyCommand(MidJourneyParameters params) {
        StringBuilder command = new StringBuilder("/imagine prompt: ");
        
        // 构建主要提示词部分
        String mainPrompt = buildMainPrompt(params);
        command.append(mainPrompt);
        
        // 添加参数部分
        String parameterString = params.buildCommand();
        if (parameterString.contains("--")) {
            // 提取参数部分（--开头的部分）
            int paramIndex = parameterString.indexOf("--");
            if (paramIndex > 0) {
                String parameters = parameterString.substring(paramIndex);
                command.append(" ").append(parameters);
            }
        }
        
        return command.toString();
    }
    
    /**
     * 构建主要提示词
     */
    private String buildMainPrompt(MidJourneyParameters params) {
        StringBuilder prompt = new StringBuilder();
        
        // 基础提示词
        if (params.getPrompt() != null && !params.getPrompt().trim().isEmpty()) {
            prompt.append(params.getPrompt().trim());
        }
        
        // 添加艺术风格
        if (params.getArtStyle() != null && !params.getArtStyle().trim().isEmpty()) {
            prompt.append(", ").append(params.getArtStyle().trim());
        }
        
        // 添加光照风格
        if (params.getLightingStyle() != null && !params.getLightingStyle().trim().isEmpty()) {
            prompt.append(", ").append(params.getLightingStyle().trim());
        }
        
        // 添加色彩调色板
        if (params.getColorPalette() != null && !params.getColorPalette().trim().isEmpty()) {
            prompt.append(", ").append(params.getColorPalette().trim());
        }
        
        // 添加相机角度
        if (params.getCameraAngle() != null && !params.getCameraAngle().trim().isEmpty()) {
            prompt.append(", ").append(params.getCameraAngle().trim());
        }
        
        return prompt.toString();
    }
    
    /**
     * 生成随机种子
     */
    public Integer generateRandomSeed() {
        return random.nextInt(1000000);
    }
    
    /**
     * 获取预设选项
     */
    public Map<String, Object> getPresetOptions() {
        Map<String, Object> options = new HashMap<>();
        
        // 预设类型
        options.put("presetTypes", Arrays.asList(
            "portrait", "landscape", "anime", "realistic", "abstract", "minimalist"
        ));
        
        // 宽高比选项
        options.put("aspectRatios", Arrays.asList(
            new OptionItem("1:1", "正方形", AspectRatio.SQUARE.name()),
            new OptionItem("4:5", "竖屏 4:5", AspectRatio.PORTRAIT_4_5.name()),
            new OptionItem("2:3", "竖屏 2:3", AspectRatio.PORTRAIT_2_3.name()),
            new OptionItem("9:16", "竖屏 9:16", AspectRatio.PORTRAIT_9_16.name()),
            new OptionItem("5:4", "横屏 5:4", AspectRatio.LANDSCAPE_5_4.name()),
            new OptionItem("3:2", "横屏 3:2", AspectRatio.LANDSCAPE_3_2.name()),
            new OptionItem("16:9", "横屏 16:9", AspectRatio.LANDSCAPE_16_9.name()),
            new OptionItem("21:9", "超宽屏", AspectRatio.ULTRAWIDE_21_9.name())
        ));
        
        // 质量选项
        options.put("qualities", Arrays.asList(
            new OptionItem("0.25", "低质量 (快速)", Quality.LOW.name()),
            new OptionItem("1", "标准质量", Quality.STANDARD.name()),
            new OptionItem("2", "高质量 (慢速)", Quality.HIGH.name())
        ));
        
        // 模型版本
        options.put("models", Arrays.asList("6", "5.2", "5.1", "5", "4", "niji"));
        
        // 艺术风格选项
        options.put("artStyles", Arrays.asList(
            "photorealistic", "anime style", "oil painting", "watercolor", 
            "digital art", "pencil sketch", "abstract", "minimalist",
            "vintage", "modern", "cyberpunk", "fantasy"
        ));
        
        // 光照风格选项
        options.put("lightingStyles", Arrays.asList(
            "natural lighting", "studio lighting", "golden hour", "blue hour",
            "dramatic lighting", "soft lighting", "hard lighting", "neon lighting",
            "candlelight", "moonlight", "sunlight", "overcast"
        ));
        
        // 色彩调色板选项
        options.put("colorPalettes", Arrays.asList(
            "vibrant colors", "pastel colors", "monochrome", "warm tones",
            "cool tones", "earth tones", "neon colors", "muted colors",
            "high contrast", "low contrast", "sepia", "black and white"
        ));
        
        // 相机角度选项
        options.put("cameraAngles", Arrays.asList(
            "eye level", "low angle", "high angle", "bird's eye view",
            "worm's eye view", "close-up", "wide shot", "medium shot",
            "macro", "telephoto", "fisheye", "panoramic"
        ));
        
        return options;
    }
    
    /**
     * 智能建议参数
     */
    public Map<String, Object> getSuggestions(String prompt) {
        Map<String, Object> suggestions = new HashMap<>();
        
        if (prompt == null || prompt.trim().isEmpty()) {
            return suggestions;
        }
        
        String lowerPrompt = prompt.toLowerCase();
        
        // 根据提示词内容智能建议
        if (lowerPrompt.contains("portrait") || lowerPrompt.contains("face") || lowerPrompt.contains("person")) {
            suggestions.put("aspectRatio", AspectRatio.PORTRAIT_2_3.name());
            suggestions.put("stylize", 150);
            suggestions.put("lightingStyle", "soft studio lighting");
        } else if (lowerPrompt.contains("landscape") || lowerPrompt.contains("scenery") || lowerPrompt.contains("nature")) {
            suggestions.put("aspectRatio", AspectRatio.LANDSCAPE_16_9.name());
            suggestions.put("stylize", 200);
            suggestions.put("lightingStyle", "golden hour");
        } else if (lowerPrompt.contains("anime") || lowerPrompt.contains("manga")) {
            suggestions.put("aspectRatio", AspectRatio.PORTRAIT_4_5.name());
            suggestions.put("stylize", 500);
            suggestions.put("artStyle", "anime style");
        } else if (lowerPrompt.contains("abstract") || lowerPrompt.contains("modern art")) {
            suggestions.put("aspectRatio", AspectRatio.SQUARE.name());
            suggestions.put("stylize", 800);
            suggestions.put("chaos", 50);
        }
        
        return suggestions;
    }
    
    /**
     * 选项项目类
     */
    public static class OptionItem {
        private String value;
        private String label;
        private String key;
        
        public OptionItem(String value, String label, String key) {
            this.value = value;
            this.label = label;
            this.key = key;
        }
        
        // Getters
        public String getValue() { return value; }
        public String getLabel() { return label; }
        public String getKey() { return key; }
    }
}