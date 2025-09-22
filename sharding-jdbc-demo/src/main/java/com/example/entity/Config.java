package com.example.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Config entity for broadcast table demonstration
 * This table will exist in all shards (broadcast table)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_config")
public class Config {
    
    @TableId(type = IdType.ASSIGN_ID)
    private Long configId;
    
    private String configKey;
    
    private String configValue;
    
    private String description;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    private Integer deleted;
    
    public Config(String configKey, String configValue, String description) {
        this.configKey = configKey;
        this.configValue = configValue;
        this.description = description;
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.deleted = 0;
    }
}