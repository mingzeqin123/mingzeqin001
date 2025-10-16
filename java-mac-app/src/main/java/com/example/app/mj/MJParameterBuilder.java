package com.example.app.mj;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Builder class for constructing Midjourney parameters
 */
public class MJParameterBuilder {
    private MJPrompt prompt;
    private List<MJParameter> customParameters;
    private Map<String, String> parameterTemplates;

    public MJParameterBuilder() {
        this.prompt = new MJPrompt();
        this.customParameters = new ArrayList<>();
        this.parameterTemplates = new HashMap<>();
        initializeTemplates();
    }

    /**
     * Initialize common parameter templates
     */
    private void initializeTemplates() {
        // Aspect ratios
        parameterTemplates.put("aspect_1_1", "1:1");
        parameterTemplates.put("aspect_16_9", "16:9");
        parameterTemplates.put("aspect_9_16", "9:16");
        parameterTemplates.put("aspect_4_3", "4:3");
        parameterTemplates.put("aspect_3_4", "3:4");
        parameterTemplates.put("aspect_2_3", "2:3");
        parameterTemplates.put("aspect_3_2", "3:2");
        parameterTemplates.put("aspect_1_2", "1:2");
        parameterTemplates.put("aspect_2_1", "2:1");

        // Styles
        parameterTemplates.put("style_raw", "raw");
        parameterTemplates.put("style_cute", "cute");
        parameterTemplates.put("style_expressive", "expressive");
        parameterTemplates.put("style_original", "original");
        parameterTemplates.put("style_scenic", "scenic");

        // Quality levels
        parameterTemplates.put("quality_025", "0.25");
        parameterTemplates.put("quality_05", "0.5");
        parameterTemplates.put("quality_1", "1");
        parameterTemplates.put("quality_2", "2");

        // Versions
        parameterTemplates.put("version_1", "1");
        parameterTemplates.put("version_2", "2");
        parameterTemplates.put("version_3", "3");
        parameterTemplates.put("version_4", "4");
        parameterTemplates.put("version_5", "5");
        parameterTemplates.put("version_6", "6");
        parameterTemplates.put("version_niji", "niji");
        parameterTemplates.put("version_hd", "hd");
    }

    /**
     * Set the main prompt text
     */
    public MJParameterBuilder setPrompt(String prompt) {
        this.prompt.setPrompt(prompt);
        return this;
    }

    /**
     * Set aspect ratio
     */
    public MJParameterBuilder setAspectRatio(String aspectRatio) {
        this.prompt.setAspectRatio(aspectRatio);
        return this;
    }

    /**
     * Set style
     */
    public MJParameterBuilder setStyle(String style) {
        this.prompt.setStyle(style);
        return this;
    }

    /**
     * Set quality
     */
    public MJParameterBuilder setQuality(String quality) {
        this.prompt.setQuality(quality);
        return this;
    }

    /**
     * Set chaos level
     */
    public MJParameterBuilder setChaos(String chaos) {
        this.prompt.setChaos(chaos);
        return this;
    }

    /**
     * Set stylize level
     */
    public MJParameterBuilder setStylize(String stylize) {
        this.prompt.setStylize(stylize);
        return this;
    }

    /**
     * Set version
     */
    public MJParameterBuilder setVersion(String version) {
        this.prompt.setVersion(version);
        return this;
    }

    /**
     * Set seed
     */
    public MJParameterBuilder setSeed(String seed) {
        this.prompt.setSeed(seed);
        this.prompt.setSeedValue(seed);
        return this;
    }

    /**
     * Set stop value
     */
    public MJParameterBuilder setStop(String stop) {
        this.prompt.setStop(stop);
        this.prompt.setStopValue(stop);
        return this;
    }

    /**
     * Set tile mode
     */
    public MJParameterBuilder setTile(String tile) {
        this.prompt.setTile(tile);
        this.prompt.setTileValue(tile);
        return this;
    }

    /**
     * Set image weight
     */
    public MJParameterBuilder setImageWeight(String iw) {
        this.prompt.setIw(iw);
        this.prompt.setIwValue(iw);
        return this;
    }

    /**
     * Set negative prompt
     */
    public MJParameterBuilder setNegativePrompt(String no) {
        this.prompt.setNo(no);
        this.prompt.setNoValue(no);
        return this;
    }

    /**
     * Set weird parameter
     */
    public MJParameterBuilder setWeird(String weird) {
        this.prompt.setWeird(weird);
        this.prompt.setWeirdValue(weird);
        return this;
    }

    /**
     * Set repeat parameter
     */
    public MJParameterBuilder setRepeat(String repeat) {
        this.prompt.setRepeat(repeat);
        this.prompt.setRepeatValue(repeat);
        return this;
    }

    /**
     * Set video parameter
     */
    public MJParameterBuilder setVideo(String video) {
        this.prompt.setVideo(video);
        this.prompt.setVideoValue(video);
        return this;
    }

    /**
     * Add a custom parameter
     */
    public MJParameterBuilder addCustomParameter(String name, String value, String description, boolean required, String category) {
        MJParameter param = new MJParameter(name, value, description, required, category);
        customParameters.add(param);
        return this;
    }

    /**
     * Add a custom parameter with valid values
     */
    public MJParameterBuilder addCustomParameter(String name, String value, String description, boolean required, String category, List<String> validValues) {
        MJParameter param = new MJParameter(name, value, description, required, category);
        param.setValidValues(validValues);
        customParameters.add(param);
        return this;
    }

    /**
     * Build the final prompt string
     */
    public String build() {
        StringBuilder sb = new StringBuilder();
        
        // Add main prompt
        if (prompt.getPrompt() != null && !prompt.getPrompt().trim().isEmpty()) {
            sb.append(prompt.getPrompt().trim());
        }
        
        // Add aspect ratio
        if (prompt.getAspectRatio() != null && !prompt.getAspectRatio().trim().isEmpty()) {
            sb.append(" --ar ").append(prompt.getAspectRatio());
        }
        
        // Add style
        if (prompt.getStyle() != null && !prompt.getStyle().trim().isEmpty()) {
            sb.append(" --style ").append(prompt.getStyle());
        }
        
        // Add quality
        if (prompt.getQuality() != null && !prompt.getQuality().trim().isEmpty()) {
            sb.append(" --q ").append(prompt.getQuality());
        }
        
        // Add chaos
        if (prompt.getChaos() != null && !prompt.getChaos().trim().isEmpty() && !prompt.getChaos().equals("0")) {
            sb.append(" --chaos ").append(prompt.getChaos());
        }
        
        // Add stylize
        if (prompt.getStylize() != null && !prompt.getStylize().trim().isEmpty() && !prompt.getStylize().equals("100")) {
            sb.append(" --stylize ").append(prompt.getStylize());
        }
        
        // Add version
        if (prompt.getVersion() != null && !prompt.getVersion().trim().isEmpty() && !prompt.getVersion().equals("6")) {
            sb.append(" --v ").append(prompt.getVersion());
        }
        
        // Add seed
        if (prompt.getSeed() != null && !prompt.getSeed().trim().isEmpty()) {
            sb.append(" --seed ").append(prompt.getSeed());
        }
        
        // Add stop
        if (prompt.getStop() != null && !prompt.getStop().trim().isEmpty()) {
            sb.append(" --stop ").append(prompt.getStop());
        }
        
        // Add tile
        if (prompt.getTile() != null && !prompt.getTile().trim().isEmpty()) {
            sb.append(" --tile");
        }
        
        // Add image weight
        if (prompt.getIw() != null && !prompt.getIw().trim().isEmpty()) {
            sb.append(" --iw ").append(prompt.getIw());
        }
        
        // Add negative prompt
        if (prompt.getNo() != null && !prompt.getNo().trim().isEmpty()) {
            sb.append(" --no ").append(prompt.getNo());
        }
        
        // Add weird
        if (prompt.getWeird() != null && !prompt.getWeird().trim().isEmpty()) {
            sb.append(" --weird ").append(prompt.getWeird());
        }
        
        // Add repeat
        if (prompt.getRepeat() != null && !prompt.getRepeat().trim().isEmpty()) {
            sb.append(" --repeat ").append(prompt.getRepeat());
        }
        
        // Add video
        if (prompt.getVideo() != null && !prompt.getVideo().trim().isEmpty()) {
            sb.append(" --video");
        }
        
        // Add custom parameters
        for (MJParameter param : customParameters) {
            if (param.getValue() != null && !param.getValue().trim().isEmpty()) {
                sb.append(" --").append(param.getName()).append(" ").append(param.getValue());
            }
        }
        
        return sb.toString().trim();
    }

    /**
     * Build a detailed parameter map
     */
    public Map<String, Object> buildParameterMap() {
        Map<String, Object> params = new HashMap<>();
        
        params.put("prompt", prompt.getPrompt());
        params.put("aspectRatio", prompt.getAspectRatio());
        params.put("style", prompt.getStyle());
        params.put("quality", prompt.getQuality());
        params.put("chaos", prompt.getChaos());
        params.put("stylize", prompt.getStylize());
        params.put("version", prompt.getVersion());
        params.put("seed", prompt.getSeed());
        params.put("stop", prompt.getStop());
        params.put("tile", prompt.getTile());
        params.put("imageWeight", prompt.getIw());
        params.put("negativePrompt", prompt.getNo());
        params.put("weird", prompt.getWeird());
        params.put("repeat", prompt.getRepeat());
        params.put("video", prompt.getVideo());
        
        // Add custom parameters
        Map<String, String> customParams = new HashMap<>();
        for (MJParameter param : customParameters) {
            customParams.put(param.getName(), param.getValue());
        }
        params.put("customParameters", customParams);
        
        return params;
    }

    /**
     * Validate all parameters
     */
    public List<String> validate() {
        List<String> errors = new ArrayList<>();
        
        // Validate main prompt
        errors.addAll(prompt.validate());
        
        // Validate custom parameters
        for (MJParameter param : customParameters) {
            if (!param.isValid()) {
                errors.add("Invalid parameter: " + param.getName() + " - " + param.getDescription());
            }
        }
        
        return errors;
    }

    /**
     * Get available parameter templates
     */
    public Map<String, String> getParameterTemplates() {
        return new HashMap<>(parameterTemplates);
    }

    /**
     * Get the current prompt object
     */
    public MJPrompt getPrompt() {
        return prompt;
    }

    /**
     * Get custom parameters
     */
    public List<MJParameter> getCustomParameters() {
        return new ArrayList<>(customParameters);
    }

    /**
     * Reset all parameters to default values
     */
    public MJParameterBuilder reset() {
        this.prompt = new MJPrompt();
        this.customParameters.clear();
        return this;
    }
}