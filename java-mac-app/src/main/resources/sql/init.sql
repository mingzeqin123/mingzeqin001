-- 数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS test_db_0 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS test_db_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE test_db_0;

-- 用户表分表
CREATE TABLE IF NOT EXISTS t_user_0 (
    user_id BIGINT NOT NULL PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    age INT COMMENT '年龄',
    gender INT COMMENT '性别：1-男，2-女',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    status INT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表_0';

CREATE TABLE IF NOT EXISTS t_user_1 (
    user_id BIGINT NOT NULL PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    age INT COMMENT '年龄',
    gender INT COMMENT '性别：1-男，2-女',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    status INT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表_1';

-- 订单表分表
CREATE TABLE IF NOT EXISTS t_order_0 (
    order_id BIGINT NOT NULL PRIMARY KEY COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_no VARCHAR(50) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    status INT NOT NULL COMMENT '订单状态：1-待支付，2-已支付，3-已发货，4-已完成，5-已取消',
    address VARCHAR(255) COMMENT '收货地址',
    receiver VARCHAR(50) COMMENT '收货人',
    receiver_phone VARCHAR(20) COMMENT '收货人电话',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    remark VARCHAR(255) COMMENT '备注',
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表_0';

CREATE TABLE IF NOT EXISTS t_order_1 (
    order_id BIGINT NOT NULL PRIMARY KEY COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_no VARCHAR(50) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    status INT NOT NULL COMMENT '订单状态：1-待支付，2-已支付，3-已发货，4-已完成，5-已取消',
    address VARCHAR(255) COMMENT '收货地址',
    receiver VARCHAR(50) COMMENT '收货人',
    receiver_phone VARCHAR(20) COMMENT '收货人电话',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    remark VARCHAR(255) COMMENT '备注',
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表_1';

USE test_db_1;

-- 复制相同的表结构到第二个数据库
CREATE TABLE IF NOT EXISTS t_user_0 (
    user_id BIGINT NOT NULL PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    age INT COMMENT '年龄',
    gender INT COMMENT '性别：1-男，2-女',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    status INT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表_0';

CREATE TABLE IF NOT EXISTS t_user_1 (
    user_id BIGINT NOT NULL PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    age INT COMMENT '年龄',
    gender INT COMMENT '性别：1-男，2-女',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    status INT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表_1';

CREATE TABLE IF NOT EXISTS t_order_0 (
    order_id BIGINT NOT NULL PRIMARY KEY COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_no VARCHAR(50) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    status INT NOT NULL COMMENT '订单状态：1-待支付，2-已支付，3-已发货，4-已完成，5-已取消',
    address VARCHAR(255) COMMENT '收货地址',
    receiver VARCHAR(50) COMMENT '收货人',
    receiver_phone VARCHAR(20) COMMENT '收货人电话',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    remark VARCHAR(255) COMMENT '备注',
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表_0';

CREATE TABLE IF NOT EXISTS t_order_1 (
    order_id BIGINT NOT NULL PRIMARY KEY COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_no VARCHAR(50) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    status INT NOT NULL COMMENT '订单状态：1-待支付，2-已支付，3-已发货，4-已完成，5-已取消',
    address VARCHAR(255) COMMENT '收货地址',
    receiver VARCHAR(50) COMMENT '收货人',
    receiver_phone VARCHAR(20) COMMENT '收货人电话',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    remark VARCHAR(255) COMMENT '备注',
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表_1';