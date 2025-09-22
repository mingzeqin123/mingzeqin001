package com.example.app.service;

import com.example.app.entity.User;
import com.example.app.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户服务类
 * 演示分表操作
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserMapper userMapper;
    
    /**
     * 创建用户
     */
    @Transactional
    public User createUser(User user) {
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        user.setStatus(1); // 默认状态为正常
        
        int result = userMapper.insert(user);
        log.info("创建用户结果: {}, 用户ID: {}", result, user.getUserId());
        
        return user;
    }
    
    /**
     * 根据ID获取用户
     */
    public User getUserById(Long userId) {
        User user = userMapper.selectById(userId);
        log.info("查询用户ID: {}, 结果: {}", userId, user != null ? "找到" : "未找到");
        return user;
    }
    
    /**
     * 根据用户名获取用户
     */
    public List<User> getUsersByUsername(String username) {
        List<User> users = userMapper.selectByUsername(username);
        log.info("根据用户名查询: {}, 结果数量: {}", username, users.size());
        return users;
    }
    
    /**
     * 根据邮箱获取用户
     */
    public List<User> getUsersByEmail(String email) {
        List<User> users = userMapper.selectByEmail(email);
        log.info("根据邮箱查询: {}, 结果数量: {}", email, users.size());
        return users;
    }
    
    /**
     * 分页获取用户
     */
    public List<User> getUsers(int page, int size) {
        int offset = (page - 1) * size;
        List<User> users = userMapper.selectPage(offset, size);
        log.info("分页查询用户: 页码={}, 大小={}, 结果数量={}", page, size, users.size());
        return users;
    }
    
    /**
     * 获取所有用户
     */
    public List<User> getAllUsers() {
        List<User> users = userMapper.selectAll();
        log.info("查询所有用户, 结果数量: {}", users.size());
        return users;
    }
    
    /**
     * 更新用户
     */
    @Transactional
    public boolean updateUser(User user) {
        user.setUpdateTime(LocalDateTime.now());
        int result = userMapper.update(user);
        log.info("更新用户: {}, 结果: {}", user.getUserId(), result > 0 ? "成功" : "失败");
        return result > 0;
    }
    
    /**
     * 删除用户
     */
    @Transactional
    public boolean deleteUser(Long userId) {
        int result = userMapper.deleteById(userId);
        log.info("删除用户: {}, 结果: {}", userId, result > 0 ? "成功" : "失败");
        return result > 0;
    }
    
    /**
     * 统计用户数量
     */
    public int getUserCount() {
        int count = userMapper.count();
        log.info("用户总数: {}", count);
        return count;
    }
    
    /**
     * 根据年龄范围查询用户
     */
    public List<User> getUsersByAgeRange(int minAge, int maxAge) {
        List<User> users = userMapper.selectByAgeRange(minAge, maxAge);
        log.info("年龄范围查询: {}-{}, 结果数量: {}", minAge, maxAge, users.size());
        return users;
    }
    
    /**
     * 批量创建用户（演示分表分布）
     */
    @Transactional
    public void createUsersBatch(int count) {
        log.info("开始批量创建用户，数量: {}", count);
        
        for (int i = 1; i <= count; i++) {
            User user = User.builder()
                    .userId((long) i)
                    .username("user" + i)
                    .email("user" + i + "@example.com")
                    .phone("138" + String.format("%08d", i))
                    .age(20 + (i % 50))
                    .gender(i % 2 + 1)
                    .createTime(LocalDateTime.now())
                    .updateTime(LocalDateTime.now())
                    .status(1)
                    .build();
            
            userMapper.insert(user);
            
            if (i % 100 == 0) {
                log.info("已创建用户数量: {}", i);
            }
        }
        
        log.info("批量创建用户完成，总数量: {}", count);
    }
}