package com.example.app.mj;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents a complete Midjourney prompt with all parameters
 */
public class MJPrompt {
    private String prompt;
    private String aspectRatio;
    private String style;
    private String quality;
    private String chaos;
    private String stylize;
    private String version;
    private String seed;
    private String stop;
    private String tile;
    private String iw;
    private String ar;
    private String q;
    private String s;
    private String c;
    private String v;
    private String seedValue;
    private String stopValue;
    private String tileValue;
    private String iwValue;
    private String no;
    private String styleRaw;
    private String weird;
    private String repeat;
    private String video;
    private String debug;
    private String test;
    private String testp;
    private String creative;
    private String fast;
    private String relax;
    private String hd;
    private String niji;
    private String versionValue;
    private String stylizeValue;
    private String chaosValue;
    private String qualityValue;
    private String weirdValue;
    private String repeatValue;
    private String videoValue;
    private String debugValue;
    private String testValue;
    private String testpValue;
    private String creativeValue;
    private String fastValue;
    private String relaxValue;
    private String hdValue;
    private String nijiValue;
    private String noValue;
    private String styleRawValue;

    public MJPrompt() {
        // Initialize with default values
        this.aspectRatio = "1:1";
        this.style = "raw";
        this.quality = "1";
        this.chaos = "0";
        this.stylize = "100";
        this.version = "6";
    }

    // Getters and Setters
    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getAspectRatio() {
        return aspectRatio;
    }

    public void setAspectRatio(String aspectRatio) {
        this.aspectRatio = aspectRatio;
    }

    public String getStyle() {
        return style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public String getQuality() {
        return quality;
    }

    public void setQuality(String quality) {
        this.quality = quality;
    }

    public String getChaos() {
        return chaos;
    }

    public void setChaos(String chaos) {
        this.chaos = chaos;
    }

    public String getStylize() {
        return stylize;
    }

    public void setStylize(String stylize) {
        this.stylize = stylize;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getSeed() {
        return seed;
    }

    public void setSeed(String seed) {
        this.seed = seed;
    }

    public String getStop() {
        return stop;
    }

    public void setStop(String stop) {
        this.stop = stop;
    }

    public String getTile() {
        return tile;
    }

    public void setTile(String tile) {
        this.tile = tile;
    }

    public String getIw() {
        return iw;
    }

    public void setIw(String iw) {
        this.iw = iw;
    }

    public String getAr() {
        return ar;
    }

    public void setAr(String ar) {
        this.ar = ar;
    }

    public String getQ() {
        return q;
    }

    public void setQ(String q) {
        this.q = q;
    }

    public String getS() {
        return s;
    }

    public void setS(String s) {
        this.s = s;
    }

    public String getC() {
        return c;
    }

    public void setC(String c) {
        this.c = c;
    }

    public String getV() {
        return v;
    }

    public void setV(String v) {
        this.v = v;
    }

    // Additional getters and setters for all parameters
    public String getSeedValue() { return seedValue; }
    public void setSeedValue(String seedValue) { this.seedValue = seedValue; }
    
    public String getStopValue() { return stopValue; }
    public void setStopValue(String stopValue) { this.stopValue = stopValue; }
    
    public String getTileValue() { return tileValue; }
    public void setTileValue(String tileValue) { this.tileValue = tileValue; }
    
    public String getIwValue() { return iwValue; }
    public void setIwValue(String iwValue) { this.iwValue = iwValue; }
    
    public String getNo() { return no; }
    public void setNo(String no) { this.no = no; }
    
    public String getStyleRaw() { return styleRaw; }
    public void setStyleRaw(String styleRaw) { this.styleRaw = styleRaw; }
    
    public String getWeird() { return weird; }
    public void setWeird(String weird) { this.weird = weird; }
    
    public String getRepeat() { return repeat; }
    public void setRepeat(String repeat) { this.repeat = repeat; }
    
    public String getVideo() { return video; }
    public void setVideo(String video) { this.video = video; }
    
    public String getDebug() { return debug; }
    public void setDebug(String debug) { this.debug = debug; }
    
    public String getTest() { return test; }
    public void setTest(String test) { this.test = test; }
    
    public String getTestp() { return testp; }
    public void setTestp(String testp) { this.testp = testp; }
    
    public String getCreative() { return creative; }
    public void setCreative(String creative) { this.creative = creative; }
    
    public String getFast() { return fast; }
    public void setFast(String fast) { this.fast = fast; }
    
    public String getRelax() { return relax; }
    public void setRelax(String relax) { this.relax = relax; }
    
    public String getHd() { return hd; }
    public void setHd(String hd) { this.hd = hd; }
    
    public String getNiji() { return niji; }
    public void setNiji(String niji) { this.niji = niji; }

    // Value getters and setters
    public String getVersionValue() { return versionValue; }
    public void setVersionValue(String versionValue) { this.versionValue = versionValue; }
    
    public String getStylizeValue() { return stylizeValue; }
    public void setStylizeValue(String stylizeValue) { this.stylizeValue = stylizeValue; }
    
    public String getChaosValue() { return chaosValue; }
    public void setChaosValue(String chaosValue) { this.chaosValue = chaosValue; }
    
    public String getQualityValue() { return qualityValue; }
    public void setQualityValue(String qualityValue) { this.qualityValue = qualityValue; }
    
    public String getWeirdValue() { return weirdValue; }
    public void setWeirdValue(String weirdValue) { this.weirdValue = weirdValue; }
    
    public String getRepeatValue() { return repeatValue; }
    public void setRepeatValue(String repeatValue) { this.repeatValue = repeatValue; }
    
    public String getVideoValue() { return videoValue; }
    public void setVideoValue(String videoValue) { this.videoValue = videoValue; }
    
    public String getDebugValue() { return debugValue; }
    public void setDebugValue(String debugValue) { this.debugValue = debugValue; }
    
    public String getTestValue() { return testValue; }
    public void setTestValue(String testValue) { this.testValue = testValue; }
    
    public String getTestpValue() { return testpValue; }
    public void setTestpValue(String testpValue) { this.testpValue = testpValue; }
    
    public String getCreativeValue() { return creativeValue; }
    public void setCreativeValue(String creativeValue) { this.creativeValue = creativeValue; }
    
    public String getFastValue() { return fastValue; }
    public void setFastValue(String fastValue) { this.fastValue = fastValue; }
    
    public String getRelaxValue() { return relaxValue; }
    public void setRelaxValue(String relaxValue) { this.relaxValue = relaxValue; }
    
    public String getHdValue() { return hdValue; }
    public void setHdValue(String hdValue) { this.hdValue = hdValue; }
    
    public String getNijiValue() { return nijiValue; }
    public void setNijiValue(String nijiValue) { this.nijiValue = nijiValue; }
    
    public String getNoValue() { return noValue; }
    public void setNoValue(String noValue) { this.noValue = noValue; }
    
    public String getStyleRawValue() { return styleRawValue; }
    public void setStyleRawValue(String styleRawValue) { this.styleRawValue = styleRawValue; }

    /**
     * Validates the prompt parameters
     */
    public List<String> validate() {
        List<String> errors = new ArrayList<>();
        
        if (prompt == null || prompt.trim().isEmpty()) {
            errors.add("Prompt is required");
        }
        
        // Validate aspect ratio
        if (aspectRatio != null && !isValidAspectRatio(aspectRatio)) {
            errors.add("Invalid aspect ratio format. Use format like '1:1', '16:9', etc.");
        }
        
        // Validate quality
        if (quality != null && !isValidQuality(quality)) {
            errors.add("Invalid quality value. Must be 0.25, 0.5, 1, or 2");
        }
        
        // Validate chaos
        if (chaos != null && !isValidChaos(chaos)) {
            errors.add("Invalid chaos value. Must be between 0 and 100");
        }
        
        // Validate stylize
        if (stylize != null && !isValidStylize(stylize)) {
            errors.add("Invalid stylize value. Must be between 0 and 1000");
        }
        
        return errors;
    }

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

    @Override
    public String toString() {
        return "MJPrompt{" +
                "prompt='" + prompt + '\'' +
                ", aspectRatio='" + aspectRatio + '\'' +
                ", style='" + style + '\'' +
                ", quality='" + quality + '\'' +
                ", chaos='" + chaos + '\'' +
                ", stylize='" + stylize + '\'' +
                ", version='" + version + '\'' +
                '}';
    }
}