package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.Config;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * Config mapper interface for broadcast table
 */
@Mapper
public interface ConfigMapper extends BaseMapper<Config> {
    
    /**
     * Find config by key
     * This will query from any shard since it's a broadcast table
     */
    @Select("SELECT * FROM t_config WHERE config_key = #{configKey}")
    Config findByKey(String configKey);
}