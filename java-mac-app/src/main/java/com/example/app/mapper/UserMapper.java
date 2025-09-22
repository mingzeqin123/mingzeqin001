package com.example.app.mapper;

import com.example.app.entity.User;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {
    
    /**
     * 插入用户
     */
    @Insert("INSERT INTO t_user (user_id, username, email, phone, age, gender, create_time, update_time, status) " +
            "VALUES (#{userId}, #{username}, #{email}, #{phone}, #{age}, #{gender}, #{createTime}, #{updateTime}, #{status})")
    int insert(User user);
    
    /**
     * 根据用户ID查询
     */
    @Select("SELECT * FROM t_user WHERE user_id = #{userId}")
    User selectById(@Param("userId") Long userId);
    
    /**
     * 根据用户名查询
     */
    @Select("SELECT * FROM t_user WHERE username = #{username}")
    List<User> selectByUsername(@Param("username") String username);
    
    /**
     * 根据邮箱查询
     */
    @Select("SELECT * FROM t_user WHERE email = #{email}")
    List<User> selectByEmail(@Param("email") String email);
    
    /**
     * 分页查询用户
     */
    @Select("SELECT * FROM t_user ORDER BY create_time DESC LIMIT #{offset}, #{limit}")
    List<User> selectPage(@Param("offset") int offset, @Param("limit") int limit);
    
    /**
     * 查询所有用户
     */
    @Select("SELECT * FROM t_user ORDER BY create_time DESC")
    List<User> selectAll();
    
    /**
     * 更新用户
     */
    @Update("UPDATE t_user SET username = #{username}, email = #{email}, phone = #{phone}, " +
            "age = #{age}, gender = #{gender}, update_time = #{updateTime}, status = #{status} " +
            "WHERE user_id = #{userId}")
    int update(User user);
    
    /**
     * 删除用户
     */
    @Delete("DELETE FROM t_user WHERE user_id = #{userId}")
    int deleteById(@Param("userId") Long userId);
    
    /**
     * 统计用户数量
     */
    @Select("SELECT COUNT(*) FROM t_user")
    int count();
    
    /**
     * 根据年龄范围查询
     */
    @Select("SELECT * FROM t_user WHERE age BETWEEN #{minAge} AND #{maxAge} ORDER BY create_time DESC")
    List<User> selectByAgeRange(@Param("minAge") int minAge, @Param("maxAge") int maxAge);
}