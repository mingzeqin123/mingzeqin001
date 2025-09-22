package com.example.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.Config;
import com.example.mapper.ConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Config service implementation for broadcast table
 */
@Slf4j
@Service
public class ConfigService extends ServiceImpl<ConfigMapper, Config> {
    
    /**
     * Create or update config
     * This will be synchronized across all shards (broadcast table)
     */
    public Config saveConfig(String key, String value, String description) {
        Config existingConfig = baseMapper.findByKey(key);
        
        if (existingConfig != null) {
            existingConfig.setConfigValue(value);
            existingConfig.setDescription(description);
            boolean updated = updateById(existingConfig);
            if (updated) {
                log.info("Config updated successfully: {}", existingConfig);
                return existingConfig;
            }
        } else {
            Config newConfig = new Config(key, value, description);
            boolean saved = save(newConfig);
            if (saved) {
                log.info("Config created successfully: {}", newConfig);
                return newConfig;
            }
        }
        
        throw new RuntimeException("Failed to save config");
    }
    
    /**
     * Find config by key
     * This can query from any shard since it's a broadcast table
     */
    public Config findByKey(String key) {
        Config config = baseMapper.findByKey(key);
        if (config != null) {
            log.info("Found config: {}", config);
        }
        return config;
    }
    
    /**
     * Get config value
     */
    public String getConfigValue(String key) {
        Config config = findByKey(key);
        return config != null ? config.getConfigValue() : null;
    }
}