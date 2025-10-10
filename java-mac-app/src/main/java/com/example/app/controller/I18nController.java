package com.example.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * REST Controller for i18n functionality
 * Demonstrates how to handle internationalization in Spring Boot
 */
@RestController
@RequestMapping("/api/i18n")
@CrossOrigin(origins = "*")
public class I18nController {

    @Autowired
    private MessageSource messageSource;

    /**
     * Get localized messages for the current locale
     */
    @GetMapping("/messages")
    public Map<String, String> getMessages() {
        Locale locale = LocaleContextHolder.getLocale();
        Map<String, String> messages = new HashMap<>();
        
        // Get all the messages we need for the frontend
        String[] messageKeys = {
            "app.title", "app.welcome.title", "app.welcome.description",
            "app.button.hello", "app.button.file", "app.button.system", "app.button.clear",
            "app.status.ready", "app.status.started", "app.status.greeting",
            "app.status.file.selected", "app.status.file.cancelled", "app.status.system.info", "app.status.output.cleared",
            "file.chooser.title", "file.chooser.all.files", "file.chooser.text.files", "file.chooser.image.files",
            "system.info.title", "system.info.os", "system.info.os.version", "system.info.arch",
            "system.info.java.version", "system.info.java.vendor", "system.info.username",
            "system.info.home", "system.info.workdir", "system.info.processors",
            "system.info.max.memory", "system.info.used.memory",
            "message.startup.success", "message.current.time", "message.greeting",
            "message.greeting.features", "message.greeting.feature.gui", "message.greeting.feature.file",
            "message.greeting.feature.system", "message.greeting.feature.macos",
            "file.selected", "file.size", "file.readable", "unit.mb"
        };
        
        for (String key : messageKeys) {
            messages.put(key, messageSource.getMessage(key, null, locale));
        }
        
        return messages;
    }

    /**
     * Get a specific localized message
     */
    @GetMapping("/message/{key}")
    public Map<String, String> getMessage(@PathVariable String key, 
                                        @RequestParam(required = false) String[] args) {
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(key, args, locale);
        
        Map<String, String> result = new HashMap<>();
        result.put("key", key);
        result.put("message", message);
        result.put("locale", locale.toString());
        
        return result;
    }

    /**
     * Get system information with localized labels
     */
    @GetMapping("/system-info")
    public Map<String, Object> getSystemInfo() {
        Locale locale = LocaleContextHolder.getLocale();
        Map<String, Object> systemInfo = new HashMap<>();
        
        // Get localized labels
        systemInfo.put("title", messageSource.getMessage("system.info.title", null, locale));
        systemInfo.put("os", messageSource.getMessage("system.info.os", null, locale));
        systemInfo.put("osVersion", messageSource.getMessage("system.info.os.version", null, locale));
        systemInfo.put("arch", messageSource.getMessage("system.info.arch", null, locale));
        systemInfo.put("javaVersion", messageSource.getMessage("system.info.java.version", null, locale));
        systemInfo.put("javaVendor", messageSource.getMessage("system.info.java.vendor", null, locale));
        systemInfo.put("username", messageSource.getMessage("system.info.username", null, locale));
        systemInfo.put("home", messageSource.getMessage("system.info.home", null, locale));
        systemInfo.put("workdir", messageSource.getMessage("system.info.workdir", null, locale));
        systemInfo.put("processors", messageSource.getMessage("system.info.processors", null, locale));
        systemInfo.put("maxMemory", messageSource.getMessage("system.info.max.memory", null, locale));
        systemInfo.put("usedMemory", messageSource.getMessage("system.info.used.memory", null, locale));
        
        // Get actual system information
        Map<String, Object> data = new HashMap<>();
        data.put("os", System.getProperty("os.name"));
        data.put("osVersion", System.getProperty("os.version"));
        data.put("arch", System.getProperty("os.arch"));
        data.put("javaVersion", System.getProperty("java.version"));
        data.put("javaVendor", System.getProperty("java.vendor"));
        data.put("username", System.getProperty("user.name"));
        data.put("home", System.getProperty("user.home"));
        data.put("workdir", System.getProperty("user.dir"));
        data.put("processors", Runtime.getRuntime().availableProcessors());
        data.put("maxMemory", Runtime.getRuntime().maxMemory() / 1024 / 1024);
        data.put("usedMemory", (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024 / 1024);
        
        systemInfo.put("data", data);
        systemInfo.put("locale", locale.toString());
        
        return systemInfo;
    }

    /**
     * Get greeting message with localized content
     */
    @GetMapping("/greeting")
    public Map<String, Object> getGreeting() {
        Locale locale = LocaleContextHolder.getLocale();
        Map<String, Object> greeting = new HashMap<>();
        
        greeting.put("title", messageSource.getMessage("message.greeting", null, locale));
        greeting.put("features", messageSource.getMessage("message.greeting.features", null, locale));
        greeting.put("featureGui", messageSource.getMessage("message.greeting.feature.gui", null, locale));
        greeting.put("featureFile", messageSource.getMessage("message.greeting.feature.file", null, locale));
        greeting.put("featureSystem", messageSource.getMessage("message.greeting.feature.system", null, locale));
        greeting.put("featureMacos", messageSource.getMessage("message.greeting.feature.macos", null, locale));
        greeting.put("locale", locale.toString());
        
        return greeting;
    }

    /**
     * Get startup message with current time
     */
    @GetMapping("/startup")
    public Map<String, Object> getStartupMessage() {
        Locale locale = LocaleContextHolder.getLocale();
        Map<String, Object> startup = new HashMap<>();
        
        String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        
        startup.put("success", messageSource.getMessage("message.startup.success", null, locale));
        startup.put("currentTime", messageSource.getMessage("message.current.time", new Object[]{currentTime}, locale));
        startup.put("locale", locale.toString());
        
        return startup;
    }
}