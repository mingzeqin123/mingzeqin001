package com.example.app.mj;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class for managing MJ parameters and providing business logic
 */
public class MJParameterService {
    private MJParameterBuilder builder;
    private Map<String, List<String>> parameterOptions;
    private Map<String, String> parameterDescriptions;

    public MJParameterService() {
        this.builder = new MJParameterBuilder();
        this.parameterOptions = new HashMap<>();
        this.parameterDescriptions = new HashMap<>();
        initializeParameterOptions();
        initializeParameterDescriptions();
    }

    /**
     * Initialize available parameter options
     */
    private void initializeParameterOptions() {
        // Aspect ratios
        parameterOptions.put("aspectRatio", Arrays.asList(
            "1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "1:2", "2:1"
        ));

        // Styles
        parameterOptions.put("style", Arrays.asList(
            "raw", "cute", "expressive", "original", "scenic"
        ));

        // Quality levels
        parameterOptions.put("quality", Arrays.asList(
            "0.25", "0.5", "1", "2"
        ));

        // Versions
        parameterOptions.put("version", Arrays.asList(
            "1", "2", "3", "4", "5", "6", "niji", "hd"
        ));

        // Chaos levels (0-100)
        parameterOptions.put("chaos", generateRange(0, 100, 10));

        // Stylize levels (0-1000)
        parameterOptions.put("stylize", generateRange(0, 1000, 50));
    }

    /**
     * Initialize parameter descriptions
     */
    private void initializeParameterDescriptions() {
        parameterDescriptions.put("prompt", "Main prompt text describing what you want to generate");
        parameterDescriptions.put("aspectRatio", "Aspect ratio of the generated image (width:height)");
        parameterDescriptions.put("style", "Artistic style of the generated image");
        parameterDescriptions.put("quality", "Quality level of the generated image (higher = more detailed)");
        parameterDescriptions.put("chaos", "Randomness level (0-100, higher = more random)");
        parameterDescriptions.put("stylize", "Stylization level (0-1000, higher = more stylized)");
        parameterDescriptions.put("version", "Midjourney model version to use");
        parameterDescriptions.put("seed", "Random seed for reproducible results");
        parameterDescriptions.put("stop", "Stop generation at specified percentage (10-100)");
        parameterDescriptions.put("tile", "Generate tiling/seamless patterns");
        parameterDescriptions.put("imageWeight", "Weight for image references (0.5-2.0)");
        parameterDescriptions.put("negativePrompt", "What you don't want in the image");
        parameterDescriptions.put("weird", "Weirdness level (0-3000)");
        parameterDescriptions.put("repeat", "Repeat the prompt multiple times");
        parameterDescriptions.put("video", "Generate video instead of image");
    }

    /**
     * Generate a range of values
     */
    private List<String> generateRange(int start, int end, int step) {
        List<String> range = new ArrayList<>();
        for (int i = start; i <= end; i += step) {
            range.add(String.valueOf(i));
        }
        return range;
    }

    /**
     * Create a new parameter builder instance
     */
    public MJParameterBuilder createBuilder() {
        return new MJParameterBuilder();
    }

    /**
     * Get available options for a parameter
     */
    public List<String> getParameterOptions(String parameterName) {
        return parameterOptions.getOrDefault(parameterName, new ArrayList<>());
    }

    /**
     * Get description for a parameter
     */
    public String getParameterDescription(String parameterName) {
        return parameterDescriptions.getOrDefault(parameterName, "No description available");
    }

    /**
     * Get all available parameters with their options
     */
    public Map<String, List<String>> getAllParameterOptions() {
        return new HashMap<>(parameterOptions);
    }

    /**
     * Get all parameter descriptions
     */
    public Map<String, String> getAllParameterDescriptions() {
        return new HashMap<>(parameterDescriptions);
    }

    /**
     * Build a prompt with the given parameters
     */
    public String buildPrompt(Map<String, String> parameters) {
        MJParameterBuilder builder = createBuilder();
        
        // Set basic parameters
        if (parameters.containsKey("prompt")) {
            builder.setPrompt(parameters.get("prompt"));
        }
        if (parameters.containsKey("aspectRatio")) {
            builder.setAspectRatio(parameters.get("aspectRatio"));
        }
        if (parameters.containsKey("style")) {
            builder.setStyle(parameters.get("style"));
        }
        if (parameters.containsKey("quality")) {
            builder.setQuality(parameters.get("quality"));
        }
        if (parameters.containsKey("chaos")) {
            builder.setChaos(parameters.get("chaos"));
        }
        if (parameters.containsKey("stylize")) {
            builder.setStylize(parameters.get("stylize"));
        }
        if (parameters.containsKey("version")) {
            builder.setVersion(parameters.get("version"));
        }
        if (parameters.containsKey("seed")) {
            builder.setSeed(parameters.get("seed"));
        }
        if (parameters.containsKey("stop")) {
            builder.setStop(parameters.get("stop"));
        }
        if (parameters.containsKey("tile")) {
            builder.setTile(parameters.get("tile"));
        }
        if (parameters.containsKey("imageWeight")) {
            builder.setImageWeight(parameters.get("imageWeight"));
        }
        if (parameters.containsKey("negativePrompt")) {
            builder.setNegativePrompt(parameters.get("negativePrompt"));
        }
        if (parameters.containsKey("weird")) {
            builder.setWeird(parameters.get("weird"));
        }
        if (parameters.containsKey("repeat")) {
            builder.setRepeat(parameters.get("repeat"));
        }
        if (parameters.containsKey("video")) {
            builder.setVideo(parameters.get("video"));
        }
        
        return builder.build();
    }

    /**
     * Validate parameters
     */
    public List<String> validateParameters(Map<String, String> parameters) {
        List<String> errors = new ArrayList<>();
        
        // Check required parameters
        if (!parameters.containsKey("prompt") || parameters.get("prompt").trim().isEmpty()) {
            errors.add("Prompt is required");
        }
        
        // Validate aspect ratio
        if (parameters.containsKey("aspectRatio")) {
            String ar = parameters.get("aspectRatio");
            if (!isValidAspectRatio(ar)) {
                errors.add("Invalid aspect ratio format: " + ar);
            }
        }
        
        // Validate quality
        if (parameters.containsKey("quality")) {
            String q = parameters.get("quality");
            if (!isValidQuality(q)) {
                errors.add("Invalid quality value: " + q);
            }
        }
        
        // Validate chaos
        if (parameters.containsKey("chaos")) {
            String c = parameters.get("chaos");
            if (!isValidChaos(c)) {
                errors.add("Invalid chaos value: " + c);
            }
        }
        
        // Validate stylize
        if (parameters.containsKey("stylize")) {
            String s = parameters.get("stylize");
            if (!isValidStylize(s)) {
                errors.add("Invalid stylize value: " + s);
            }
        }
        
        return errors;
    }

    /**
     * Get parameter categories for UI organization
     */
    public Map<String, List<String>> getParameterCategories() {
        Map<String, List<String>> categories = new HashMap<>();
        
        categories.put("Basic", Arrays.asList("prompt", "aspectRatio", "style"));
        categories.put("Quality", Arrays.asList("quality", "version"));
        categories.put("Style", Arrays.asList("stylize", "chaos", "weird"));
        categories.put("Advanced", Arrays.asList("seed", "stop", "tile", "imageWeight", "negativePrompt"));
        categories.put("Special", Arrays.asList("repeat", "video"));
        
        return categories;
    }

    /**
     * Get default parameter values
     */
    public Map<String, String> getDefaultParameters() {
        Map<String, String> defaults = new HashMap<>();
        defaults.put("aspectRatio", "1:1");
        defaults.put("style", "raw");
        defaults.put("quality", "1");
        defaults.put("chaos", "0");
        defaults.put("stylize", "100");
        defaults.put("version", "6");
        return defaults;
    }

    /**
     * Parse a prompt string and extract parameters
     */
    public Map<String, String> parsePrompt(String promptString) {
        Map<String, String> parameters = new HashMap<>();
        
        if (promptString == null || promptString.trim().isEmpty()) {
            return parameters;
        }
        
        // Extract main prompt (everything before the first --)
        String[] parts = promptString.split(" --");
        if (parts.length > 0) {
            parameters.put("prompt", parts[0].trim());
        }
        
        // Parse parameters
        for (int i = 1; i < parts.length; i++) {
            String part = parts[i].trim();
            String[] paramParts = part.split(" ", 2);
            if (paramParts.length >= 1) {
                String paramName = paramParts[0];
                String paramValue = paramParts.length > 1 ? paramParts[1] : "";
                
                // Map parameter names
                switch (paramName) {
                    case "ar":
                        parameters.put("aspectRatio", paramValue);
                        break;
                    case "style":
                        parameters.put("style", paramValue);
                        break;
                    case "q":
                        parameters.put("quality", paramValue);
                        break;
                    case "chaos":
                        parameters.put("chaos", paramValue);
                        break;
                    case "stylize":
                        parameters.put("stylize", paramValue);
                        break;
                    case "v":
                        parameters.put("version", paramValue);
                        break;
                    case "seed":
                        parameters.put("seed", paramValue);
                        break;
                    case "stop":
                        parameters.put("stop", paramValue);
                        break;
                    case "tile":
                        parameters.put("tile", "true");
                        break;
                    case "iw":
                        parameters.put("imageWeight", paramValue);
                        break;
                    case "no":
                        parameters.put("negativePrompt", paramValue);
                        break;
                    case "weird":
                        parameters.put("weird", paramValue);
                        break;
                    case "repeat":
                        parameters.put("repeat", paramValue);
                        break;
                    case "video":
                        parameters.put("video", "true");
                        break;
                }
            }
        }
        
        return parameters;
    }

    // Validation helper methods
    private boolean isValidAspectRatio(String ar) {
        return ar.matches("\\d+:\\d+") || ar.matches("\\d+\\.\\d+:\\d+\\.\\d+");
    }

    private boolean isValidQuality(String q) {
        return q.equals("0.25") || q.equals("0.5") || q.equals("1") || q.equals("2");
    }

    private boolean isValidChaos(String c) {
        try {
            int value = Integer.parseInt(c);
            return value >= 0 && value <= 100;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean isValidStylize(String s) {
        try {
            int value = Integer.parseInt(s);
            return value >= 0 && value <= 1000;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}