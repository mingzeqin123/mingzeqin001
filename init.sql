-- 创建示例数据库表
CREATE DATABASE IF NOT EXISTS data_aggregation_db;
USE data_aggregation_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    age INT,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 插入示例数据
INSERT INTO users (username, email, age, status) VALUES
('john_doe', 'john@example.com', 25, 'active'),
('jane_smith', 'jane@example.com', 30, 'active'),
('bob_wilson', 'bob@example.com', 35, 'inactive'),
('alice_brown', 'alice@example.com', 28, 'active'),
('charlie_davis', 'charlie@example.com', 42, 'pending');

INSERT INTO products (name, category, price, status) VALUES
('Laptop', 'Electronics', 999.99, 'active'),
('Mouse', 'Electronics', 29.99, 'active'),
('Keyboard', 'Electronics', 79.99, 'active'),
('Desk', 'Furniture', 299.99, 'active'),
('Chair', 'Furniture', 199.99, 'active'),
('Monitor', 'Electronics', 399.99, 'active'),
('Headphones', 'Electronics', 149.99, 'active'),
('Table', 'Furniture', 199.99, 'inactive');

INSERT INTO orders (user_id, amount, status) VALUES
(1, 1029.98, 'delivered'),
(2, 79.99, 'shipped'),
(3, 499.98, 'paid'),
(1, 29.99, 'delivered'),
(4, 199.99, 'pending'),
(2, 149.99, 'delivered'),
(5, 999.99, 'cancelled'),
(1, 399.99, 'shipped');