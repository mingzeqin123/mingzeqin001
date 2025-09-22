-- Create databases for sharding demonstration
-- Execute this script in MySQL to create the required databases

-- Create database ds0
CREATE DATABASE IF NOT EXISTS sharding_db_0 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create database ds1
CREATE DATABASE IF NOT EXISTS sharding_db_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON sharding_db_0.* TO 'root'@'localhost';
-- GRANT ALL PRIVILEGES ON sharding_db_1.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;