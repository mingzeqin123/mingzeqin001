package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.User;
import com.example.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * User service implementation
 */
@Slf4j
@Service
public class UserService extends ServiceImpl<UserMapper, User> {
    
    /**
     * Create a new user
     * The user will be automatically sharded based on user_id
     */
    public User createUser(String username, String email, String phone, Integer age, String address) {
        User user = new User(username, email, phone, age, address);
        boolean saved = save(user);
        if (saved) {
            log.info("User created successfully: {}", user);
            return user;
        } else {
            throw new RuntimeException("Failed to create user");
        }
    }
    
    /**
     * Find user by ID
     * This will query the specific shard based on user_id
     */
    public User findById(Long userId) {
        User user = getById(userId);
        if (user != null) {
            log.info("Found user in shard: {}", user);
        }
        return user;
    }
    
    /**
     * Find users by username
     * This will query across all shards since username is not a sharding key
     */
    public List<User> findByUsername(String username) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("username", username);
        List<User> users = list(queryWrapper);
        log.info("Found {} users with username: {}", users.size(), username);
        return users;
    }
    
    /**
     * Find users by age range
     * This will query across all shards
     */
    public List<User> findByAgeRange(Integer minAge, Integer maxAge) {
        List<User> users = baseMapper.findByAgeRange(minAge, maxAge);
        log.info("Found {} users in age range {}-{}", users.size(), minAge, maxAge);
        return users;
    }
    
    /**
     * Update user
     * The update will be routed to the correct shard based on user_id
     */
    public User updateUser(Long userId, String email, String phone, String address) {
        User user = getById(userId);
        if (user != null) {
            user.setEmail(email);
            user.setPhone(phone);
            user.setAddress(address);
            boolean updated = updateById(user);
            if (updated) {
                log.info("User updated successfully: {}", user);
                return user;
            }
        }
        throw new RuntimeException("Failed to update user with ID: " + userId);
    }
    
    /**
     * Delete user
     * The deletion will be routed to the correct shard based on user_id
     */
    public boolean deleteUser(Long userId) {
        boolean deleted = removeById(userId);
        if (deleted) {
            log.info("User deleted successfully with ID: {}", userId);
        }
        return deleted;
    }
    
    /**
     * Get total user count
     * This will aggregate results from all shards
     */
    public long getTotalUserCount() {
        long count = count();
        log.info("Total user count across all shards: {}", count);
        return count;
    }
}