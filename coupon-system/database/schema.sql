-- 优惠券系统数据库设计
-- 支持发放、领取、使用、付款、退款等功能

-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active'
);

-- 优惠券模板表（用于定义优惠券类型）
CREATE TABLE coupon_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    description TEXT COMMENT '优惠券描述',
    type ENUM('fixed', 'percentage', 'free_shipping') NOT NULL COMMENT '优惠类型：固定金额、百分比、免运费',
    value DECIMAL(10,2) NOT NULL COMMENT '优惠值（金额或百分比）',
    min_order_amount DECIMAL(10,2) DEFAULT 0 COMMENT '最小订单金额',
    max_discount_amount DECIMAL(10,2) COMMENT '最大优惠金额（百分比类型时使用）',
    valid_days INT NOT NULL DEFAULT 30 COMMENT '有效天数',
    usage_limit_per_user INT DEFAULT 1 COMMENT '每用户使用限制',
    total_quantity INT COMMENT '总发行量（NULL表示无限制）',
    category_ids JSON COMMENT '适用商品分类ID列表',
    product_ids JSON COMMENT '适用商品ID列表',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active'
);

-- 优惠券发放批次表
CREATE TABLE coupon_batches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id BIGINT NOT NULL,
    batch_name VARCHAR(100) NOT NULL COMMENT '批次名称',
    distribution_type ENUM('manual', 'auto', 'event', 'registration', 'birthday') NOT NULL COMMENT '发放类型',
    target_users JSON COMMENT '目标用户（手动发放时使用）',
    distribution_rules JSON COMMENT '自动发放规则',
    quantity INT NOT NULL COMMENT '本批次发放数量',
    distributed_count INT DEFAULT 0 COMMENT '已发放数量',
    start_time TIMESTAMP COMMENT '发放开始时间',
    end_time TIMESTAMP COMMENT '发放结束时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (template_id) REFERENCES coupon_templates(id)
);

-- 用户优惠券表（用户实际拥有的优惠券）
CREATE TABLE user_coupons (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    batch_id BIGINT,
    coupon_code VARCHAR(50) UNIQUE NOT NULL COMMENT '优惠券码',
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    used_at TIMESTAMP NULL COMMENT '使用时间',
    order_id BIGINT COMMENT '使用的订单ID',
    status ENUM('unused', 'used', 'expired', 'refunded') DEFAULT 'unused',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES coupon_templates(id),
    FOREIGN KEY (batch_id) REFERENCES coupon_batches(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_code (coupon_code),
    INDEX idx_expires (expires_at)
);

-- 订单表
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL COMMENT '原始金额',
    coupon_discount DECIMAL(10,2) DEFAULT 0 COMMENT '优惠券折扣金额',
    final_amount DECIMAL(10,2) NOT NULL COMMENT '最终金额',
    coupon_id BIGINT COMMENT '使用的优惠券ID',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'partial_refunded') DEFAULT 'pending',
    payment_method VARCHAR(50) COMMENT '支付方式',
    payment_transaction_id VARCHAR(100) COMMENT '支付交易ID',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES user_coupons(id),
    INDEX idx_user_status (user_id, payment_status),
    INDEX idx_order_no (order_no)
);

-- 订单商品表
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_order (order_id)
);

-- 退款记录表
CREATE TABLE refunds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    refund_no VARCHAR(50) UNIQUE NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL COMMENT '退款金额',
    coupon_refund_type ENUM('restore', 'void', 'new_coupon') DEFAULT 'restore' COMMENT '优惠券退款处理方式',
    refund_reason TEXT COMMENT '退款原因',
    refund_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    refund_transaction_id VARCHAR(100) COMMENT '退款交易ID',
    processed_at TIMESTAMP NULL COMMENT '处理时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_order (order_id),
    INDEX idx_user (user_id),
    INDEX idx_status (refund_status)
);

-- 优惠券使用记录表
CREATE TABLE coupon_usage_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_coupon_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL COMMENT '实际折扣金额',
    action_type ENUM('use', 'refund_restore', 'refund_void') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_user_coupon (user_coupon_id),
    INDEX idx_user (user_id),
    INDEX idx_order (order_id)
);

-- 优惠券分发记录表
CREATE TABLE coupon_distribution_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    batch_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_coupon_id BIGINT NOT NULL,
    distribution_channel ENUM('manual', 'auto', 'api', 'event', 'promotion') NOT NULL,
    distributed_by BIGINT COMMENT '分发操作人ID（管理员）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES coupon_batches(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(id),
    INDEX idx_batch (batch_id),
    INDEX idx_user (user_id)
);

-- 商品分类表（用于优惠券适用范围）
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT,
    level INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- 商品表（简化版，用于优惠券适用范围）
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id BIGINT,
    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_user_coupons_user_status ON user_coupons(user_id, status);
CREATE INDEX idx_user_coupons_expires ON user_coupons(expires_at);
CREATE INDEX idx_orders_user_payment ON orders(user_id, payment_status);
CREATE INDEX idx_coupon_templates_status ON coupon_templates(status);
CREATE INDEX idx_coupon_batches_status ON coupon_batches(status);