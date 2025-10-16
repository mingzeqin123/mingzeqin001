package com.example.app.model;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MidJourney参数模型类
 * 用于构建和管理MidJourney生成图像的参数
 */
public class MidJourneyParameters {
    
    // 基础参数
    private String prompt;              // 提示词
    private String negativePrompt;      // 负面提示词
    private AspectRatio aspectRatio;    // 宽高比
    private Double stylize;             // 风格化程度 (0-1000)
    private Double chaos;               // 混乱度 (0-100)
    private Integer seed;               // 随机种子
    private Quality quality;            // 图像质量
    private String model;               // 模型版本
    private Boolean tile;               // 平铺模式
    private Boolean weird;              // 奇异模式
    private Double weirdValue;          // 奇异值 (0-3000)
    
    // 高级参数
    private List<String> stopWords;     // 停止词
    private Double imageWeight;         // 图像权重
    private String lightingStyle;       // 光照风格
    private String colorPalette;        // 色彩调色板
    private String cameraAngle;         // 相机角度
    private String artStyle;            // 艺术风格
    
    public MidJourneyParameters() {
        this.stopWords = new ArrayList<>();
        this.aspectRatio = AspectRatio.SQUARE;
        this.quality = Quality.STANDARD;
        this.model = "6";
        this.stylize = 100.0;
        this.chaos = 0.0;
        this.tile = false;
        this.weird = false;
        this.weirdValue = 0.0;
        this.imageWeight = 1.0;
    }
    
    /**
     * 构建完整的MidJourney命令字符串
     * @return 格式化的MidJourney命令
     */
    public String buildCommand() {
        StringBuilder command = new StringBuilder();
        
        // 添加基础提示词
        if (prompt != null && !prompt.trim().isEmpty()) {
            command.append(prompt.trim());
        }
        
        // 添加负面提示词
        if (negativePrompt != null && !negativePrompt.trim().isEmpty()) {
            command.append(" --no ").append(negativePrompt.trim());
        }
        
        // 添加宽高比
        if (aspectRatio != null && aspectRatio != AspectRatio.SQUARE) {
            command.append(" --ar ").append(aspectRatio.getValue());
        }
        
        // 添加风格化程度
        if (stylize != null && stylize != 100.0) {
            command.append(" --stylize ").append(stylize.intValue());
        }
        
        // 添加混乱度
        if (chaos != null && chaos > 0) {
            command.append(" --chaos ").append(chaos.intValue());
        }
        
        // 添加随机种子
        if (seed != null) {
            command.append(" --seed ").append(seed);
        }
        
        // 添加图像质量
        if (quality != null && quality != Quality.STANDARD) {
            command.append(" --quality ").append(quality.getValue());
        }
        
        // 添加模型版本
        if (model != null && !model.equals("6")) {
            command.append(" --version ").append(model);
        }
        
        // 添加平铺模式
        if (tile != null && tile) {
            command.append(" --tile");
        }
        
        // 添加奇异模式
        if (weird != null && weird && weirdValue != null && weirdValue > 0) {
            command.append(" --weird ").append(weirdValue.intValue());
        }
        
        // 添加图像权重
        if (imageWeight != null && imageWeight != 1.0) {
            command.append(" --iw ").append(imageWeight);
        }
        
        // 添加停止词
        if (stopWords != null && !stopWords.isEmpty()) {
            String stopWordsStr = stopWords.stream()
                .filter(word -> word != null && !word.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.joining(", "));
            if (!stopWordsStr.isEmpty()) {
                command.append(" --stop ").append(stopWordsStr);
            }
        }
        
        return command.toString().trim();
    }
    
    /**
     * 验证参数的有效性
     * @return 验证结果列表
     */
    public List<String> validate() {
        List<String> errors = new ArrayList<>();
        
        if (prompt == null || prompt.trim().isEmpty()) {
            errors.add("提示词不能为空");
        }
        
        if (stylize != null && (stylize < 0 || stylize > 1000)) {
            errors.add("风格化程度必须在0-1000之间");
        }
        
        if (chaos != null && (chaos < 0 || chaos > 100)) {
            errors.add("混乱度必须在0-100之间");
        }
        
        if (weirdValue != null && (weirdValue < 0 || weirdValue > 3000)) {
            errors.add("奇异值必须在0-3000之间");
        }
        
        if (imageWeight != null && (imageWeight < 0 || imageWeight > 2)) {
            errors.add("图像权重必须在0-2之间");
        }
        
        return errors;
    }
    
    // Getters and Setters
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    
    public String getNegativePrompt() { return negativePrompt; }
    public void setNegativePrompt(String negativePrompt) { this.negativePrompt = negativePrompt; }
    
    public AspectRatio getAspectRatio() { return aspectRatio; }
    public void setAspectRatio(AspectRatio aspectRatio) { this.aspectRatio = aspectRatio; }
    
    public Double getStylize() { return stylize; }
    public void setStylize(Double stylize) { this.stylize = stylize; }
    
    public Double getChaos() { return chaos; }
    public void setChaos(Double chaos) { this.chaos = chaos; }
    
    public Integer getSeed() { return seed; }
    public void setSeed(Integer seed) { this.seed = seed; }
    
    public Quality getQuality() { return quality; }
    public void setQuality(Quality quality) { this.quality = quality; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public Boolean getTile() { return tile; }
    public void setTile(Boolean tile) { this.tile = tile; }
    
    public Boolean getWeird() { return weird; }
    public void setWeird(Boolean weird) { this.weird = weird; }
    
    public Double getWeirdValue() { return weirdValue; }
    public void setWeirdValue(Double weirdValue) { this.weirdValue = weirdValue; }
    
    public List<String> getStopWords() { return stopWords; }
    public void setStopWords(List<String> stopWords) { this.stopWords = stopWords; }
    
    public Double getImageWeight() { return imageWeight; }
    public void setImageWeight(Double imageWeight) { this.imageWeight = imageWeight; }
    
    public String getLightingStyle() { return lightingStyle; }
    public void setLightingStyle(String lightingStyle) { this.lightingStyle = lightingStyle; }
    
    public String getColorPalette() { return colorPalette; }
    public void setColorPalette(String colorPalette) { this.colorPalette = colorPalette; }
    
    public String getCameraAngle() { return cameraAngle; }
    public void setCameraAngle(String cameraAngle) { this.cameraAngle = cameraAngle; }
    
    public String getArtStyle() { return artStyle; }
    public void setArtStyle(String artStyle) { this.artStyle = artStyle; }
    
    /**
     * 宽高比枚举
     */
    public enum AspectRatio {
        SQUARE("1:1"),
        PORTRAIT_4_5("4:5"),
        PORTRAIT_2_3("2:3"),
        PORTRAIT_9_16("9:16"),
        LANDSCAPE_5_4("5:4"),
        LANDSCAPE_3_2("3:2"),
        LANDSCAPE_16_9("16:9"),
        ULTRAWIDE_21_9("21:9");
        
        private final String value;
        
        AspectRatio(String value) {
            this.value = value;
        }
        
        public String getValue() { return value; }
    }
    
    /**
     * 图像质量枚举
     */
    public enum Quality {
        LOW("0.25"),
        STANDARD("1"),
        HIGH("2");
        
        private final String value;
        
        Quality(String value) {
            this.value = value;
        }
        
        public String getValue() { return value; }
    }
}