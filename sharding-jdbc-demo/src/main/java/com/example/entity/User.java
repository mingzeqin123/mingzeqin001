package com.example.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * User entity for sharding demonstration
 * This table will be sharded by user_id across databases and tables
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_user")
public class User {
    
    @TableId(type = IdType.ASSIGN_ID)
    private Long userId;
    
    private String username;
    
    private String email;
    
    private String phone;
    
    private Integer age;
    
    private String address;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    private Integer deleted;
    
    public User(String username, String email, String phone, Integer age, String address) {
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.age = age;
        this.address = address;
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.deleted = 0;
    }
}