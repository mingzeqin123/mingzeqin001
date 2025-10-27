-- 创建数据库
CREATE DATABASE IF NOT EXISTS `mybatis_plus_demo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `mybatis_plus_demo`;

-- 用户表
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `avatar` varchar(200) DEFAULT NULL COMMENT '头像URL',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `gender` tinyint(1) DEFAULT NULL COMMENT '性别：0-女，1-男',
  `birthday` date DEFAULT NULL COMMENT '生日',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `version` int(11) DEFAULT '1' COMMENT '乐观锁版本号',
  `deleted` tinyint(1) DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_name` varchar(50) NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) NOT NULL COMMENT '角色编码',
  `description` varchar(200) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `version` int(11) DEFAULT '1' COMMENT '乐观锁版本号',
  `deleted` tinyint(1) DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  KEY `idx_role_name` (`role_name`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
DROP TABLE IF EXISTS `permission`;
CREATE TABLE `permission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `permission_name` varchar(50) NOT NULL COMMENT '权限名称',
  `permission_code` varchar(100) NOT NULL COMMENT '权限编码',
  `permission_type` varchar(20) DEFAULT 'MENU' COMMENT '权限类型：MENU-菜单，BUTTON-按钮，API-接口',
  `parent_id` bigint(20) DEFAULT '0' COMMENT '父权限ID',
  `path` varchar(200) DEFAULT NULL COMMENT '路径',
  `component` varchar(200) DEFAULT NULL COMMENT '组件',
  `icon` varchar(50) DEFAULT NULL COMMENT '图标',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `description` varchar(200) DEFAULT NULL COMMENT '权限描述',
  `version` int(11) DEFAULT '1' COMMENT '乐观锁版本号',
  `deleted` tinyint(1) DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_permission_type` (`permission_type`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 用户角色关联表
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 角色权限关联表
DROP TABLE IF EXISTS `role_permission`;
CREATE TABLE `role_permission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `permission_id` bigint(20) NOT NULL COMMENT '权限ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 文章表（示例业务表）
DROP TABLE IF EXISTS `article`;
CREATE TABLE `article` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(200) NOT NULL COMMENT '文章标题',
  `content` longtext COMMENT '文章内容',
  `summary` varchar(500) DEFAULT NULL COMMENT '文章摘要',
  `cover_image` varchar(200) DEFAULT NULL COMMENT '封面图片',
  `author_id` bigint(20) NOT NULL COMMENT '作者ID',
  `category_id` bigint(20) DEFAULT NULL COMMENT '分类ID',
  `tags` varchar(200) DEFAULT NULL COMMENT '标签，多个用逗号分隔',
  `view_count` int(11) DEFAULT '0' COMMENT '浏览次数',
  `like_count` int(11) DEFAULT '0' COMMENT '点赞次数',
  `comment_count` int(11) DEFAULT '0' COMMENT '评论次数',
  `status` varchar(20) DEFAULT 'DRAFT' COMMENT '状态：DRAFT-草稿，PUBLISHED-已发布，ARCHIVED-已归档',
  `is_top` tinyint(1) DEFAULT '0' COMMENT '是否置顶：0-否，1-是',
  `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
  `version` int(11) DEFAULT '1' COMMENT '乐观锁版本号',
  `deleted` tinyint(1) DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_time` (`publish_time`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- 分类表
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `category_name` varchar(50) NOT NULL COMMENT '分类名称',
  `category_code` varchar(50) NOT NULL COMMENT '分类编码',
  `parent_id` bigint(20) DEFAULT '0' COMMENT '父分类ID',
  `description` varchar(200) DEFAULT NULL COMMENT '分类描述',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `version` int(11) DEFAULT '1' COMMENT '乐观锁版本号',
  `deleted` tinyint(1) DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_code` (`category_code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_category_name` (`category_name`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 插入示例数据
INSERT INTO `user` (`username`, `password`, `email`, `phone`, `real_name`, `status`, `gender`) VALUES
('admin', '$2a$10$7JB720yubVSOfvVMe6/YqO4wzdO/r/2WeE2kEEVPNlV/Q/S9DuMpe', 'admin@example.com', '13800138000', '管理员', 1, 1),
('user1', '$2a$10$7JB720yubVSOfvVMe6/YqO4wzdO/r/2WeE2kEEVPNlV/Q/S9DuMpe', 'user1@example.com', '13800138001', '用户1', 1, 0),
('user2', '$2a$10$7JB720yubVSOfvVMe6/YqO4wzdO/r/2WeE2kEEVPNlV/Q/S9DuMpe', 'user2@example.com', '13800138002', '用户2', 1, 1);

INSERT INTO `role` (`role_name`, `role_code`, `description`, `status`) VALUES
('超级管理员', 'SUPER_ADMIN', '系统超级管理员，拥有所有权限', 1),
('管理员', 'ADMIN', '系统管理员，拥有大部分权限', 1),
('普通用户', 'USER', '普通用户，拥有基础权限', 1);

INSERT INTO `permission` (`permission_name`, `permission_code`, `permission_type`, `parent_id`, `path`, `sort_order`) VALUES
('系统管理', 'SYSTEM', 'MENU', 0, '/system', 1),
('用户管理', 'USER_MANAGE', 'MENU', 1, '/system/user', 1),
('角色管理', 'ROLE_MANAGE', 'MENU', 1, '/system/role', 2),
('权限管理', 'PERMISSION_MANAGE', 'MENU', 1, '/system/permission', 3),
('内容管理', 'CONTENT', 'MENU', 0, '/content', 2),
('文章管理', 'ARTICLE_MANAGE', 'MENU', 5, '/content/article', 1),
('分类管理', 'CATEGORY_MANAGE', 'MENU', 5, '/content/category', 2);

INSERT INTO `user_role` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 3),
(3, 3);

INSERT INTO `category` (`category_name`, `category_code`, `description`, `sort_order`) VALUES
('技术', 'TECH', '技术相关文章', 1),
('生活', 'LIFE', '生活相关文章', 2),
('随笔', 'ESSAY', '随笔文章', 3);

INSERT INTO `article` (`title`, `content`, `summary`, `author_id`, `category_id`, `status`, `publish_time`) VALUES
('MyBatis Plus 入门教程', 'MyBatis Plus 是一个 MyBatis 的增强工具...', 'MyBatis Plus 基础教程', 1, 1, 'PUBLISHED', NOW()),
('Spring Boot 实战', 'Spring Boot 是一个快速开发框架...', 'Spring Boot 开发指南', 1, 1, 'PUBLISHED', NOW()),
('生活感悟', '生活中的点点滴滴...', '记录生活的美好', 2, 2, 'PUBLISHED', NOW());