package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * User mapper interface
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * Find users by age range
     * This will query across all shards
     */
    @Select("SELECT * FROM t_user WHERE age BETWEEN #{minAge} AND #{maxAge}")
    List<User> findByAgeRange(Integer minAge, Integer maxAge);
    
    /**
     * Count users by address
     * This demonstrates broadcast query
     */
    @Select("SELECT COUNT(*) FROM t_user WHERE address LIKE CONCAT('%', #{address}, '%')")
    Long countByAddress(String address);
}