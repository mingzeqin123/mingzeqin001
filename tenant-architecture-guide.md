# 后台管理平台多租户架构实现指南

## 📋 概述

本文档详细说明如何在现有的后台管理平台中实现多租户功能，包括架构设计、数据隔离、权限管理等核心功能。

## 🏗️ 多租户架构设计

### 1. 租户隔离模式选择

#### 方案对比

| 隔离模式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|----------|
| **共享数据库，共享Schema** | 成本低，维护简单 | 数据隔离性差，扩展性有限 | 小型应用，租户数量少 |
| **共享数据库，独立Schema** | 数据隔离性好，成本适中 | 跨租户查询复杂 | 中型应用，中等租户数量 |
| **独立数据库** | 数据隔离性最好，扩展性强 | 成本高，维护复杂 | 大型应用，高安全要求 |

#### 推荐方案：共享数据库，独立Schema

```sql
-- 租户表结构
CREATE TABLE tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    config JSON,
    INDEX idx_tenant_code (tenant_code),
    INDEX idx_status (status)
);

-- 用户表（增加租户字段）
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'tenant_admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE KEY uk_tenant_username (tenant_id, username),
    UNIQUE KEY uk_tenant_email (tenant_id, email)
);
```

### 2. 数据隔离策略

#### 应用层隔离
```javascript
// 租户上下文管理
class TenantContext {
    constructor() {
        this.currentTenant = null;
        this.tenantConfig = null;
    }

    setTenant(tenantId) {
        this.currentTenant = tenantId;
        // 加载租户配置
        this.loadTenantConfig(tenantId);
    }

    getTenantId() {
        return this.currentTenant;
    }

    async loadTenantConfig(tenantId) {
        // 从缓存或数据库加载租户配置
        const config = await this.getTenantConfigFromDB(tenantId);
        this.tenantConfig = config;
    }
}

// 全局租户上下文
const tenantContext = new TenantContext();
```

#### 数据库查询隔离
```javascript
// 数据访问层基类
class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async findAll(filters = {}) {
        const tenantId = tenantContext.getTenantId();
        if (!tenantId) {
            throw new Error('No tenant context found');
        }

        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE tenant_id = ? 
            ${this.buildWhereClause(filters)}
        `;
        
        return await db.query(query, [tenantId, ...Object.values(filters)]);
    }

    async create(data) {
        const tenantId = tenantContext.getTenantId();
        const dataWithTenant = {
            ...data,
            tenant_id: tenantId,
            created_at: new Date()
        };

        const query = `
            INSERT INTO ${this.tableName} 
            (${Object.keys(dataWithTenant).join(', ')})
            VALUES (${Object.keys(dataWithTenant).map(() => '?').join(', ')})
        `;

        return await db.query(query, Object.values(dataWithTenant));
    }
}
```

## 🔐 权限管理系统

### 1. 角色权限设计

```sql
-- 角色表
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE KEY uk_tenant_role_code (tenant_id, role_code)
);

-- 权限表
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE KEY uk_permission_code (permission_code)
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (role_id, permission_id)
);

-- 用户角色关联表
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_role (user_id, role_id)
);
```

### 2. 权限检查中间件

```javascript
// 权限检查中间件
class PermissionMiddleware {
    static checkPermission(requiredPermission) {
        return async (req, res, next) => {
            try {
                const user = req.user;
                const tenantId = req.tenantId;

                if (!user || !tenantId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // 检查用户权限
                const hasPermission = await this.userHasPermission(
                    user.id, 
                    requiredPermission, 
                    tenantId
                );

                if (!hasPermission) {
                    return res.status(403).json({ error: 'Insufficient permissions' });
                }

                next();
            } catch (error) {
                res.status(500).json({ error: 'Permission check failed' });
            }
        };
    }

    static async userHasPermission(userId, permission, tenantId) {
        const query = `
            SELECT COUNT(*) as count
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = ? 
            AND p.permission_code = ?
            AND ur.role_id IN (
                SELECT id FROM roles WHERE tenant_id = ?
            )
        `;

        const result = await db.query(query, [userId, permission, tenantId]);
        return result[0].count > 0;
    }
}
```

## 🚀 租户管理功能实现

### 1. 租户管理API

```javascript
// 租户管理控制器
class TenantController {
    // 创建新租户
    static async createTenant(req, res) {
        try {
            const { tenantName, tenantCode, adminEmail, adminPassword } = req.body;

            // 验证租户代码唯一性
            const existingTenant = await Tenant.findByCode(tenantCode);
            if (existingTenant) {
                return res.status(400).json({ error: 'Tenant code already exists' });
            }

            // 开始事务
            await db.beginTransaction();

            try {
                // 创建租户
                const tenant = await Tenant.create({
                    tenant_name: tenantName,
                    tenant_code: tenantCode,
                    status: 'active'
                });

                // 创建租户管理员
                const adminUser = await User.create({
                    tenant_id: tenant.id,
                    username: 'admin',
                    email: adminEmail,
                    password_hash: await bcrypt.hash(adminPassword, 10),
                    role: 'tenant_admin'
                });

                // 分配默认角色和权限
                await this.assignDefaultRoles(tenant.id, adminUser.id);

                await db.commit();
                res.status(201).json({ 
                    message: 'Tenant created successfully',
                    tenant: { id: tenant.id, code: tenantCode }
                });

            } catch (error) {
                await db.rollback();
                throw error;
            }

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 获取租户列表
    static async getTenants(req, res) {
        try {
            const { page = 1, limit = 10, status, search } = req.query;
            const offset = (page - 1) * limit;

            const tenants = await Tenant.findAll({
                page: parseInt(page),
                limit: parseInt(limit),
                offset,
                status,
                search
            });

            res.json(tenants);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 更新租户状态
    static async updateTenantStatus(req, res) {
        try {
            const { tenantId } = req.params;
            const { status } = req.body;

            await Tenant.updateStatus(tenantId, status);
            res.json({ message: 'Tenant status updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 删除租户
    static async deleteTenant(req, res) {
        try {
            const { tenantId } = req.params;

            // 软删除：将状态设为inactive
            await Tenant.updateStatus(tenantId, 'inactive');
            res.json({ message: 'Tenant deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
```

### 2. 租户模型

```javascript
// 租户模型
class Tenant {
    static async create(data) {
        const query = `
            INSERT INTO tenants (tenant_name, tenant_code, status, config)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await db.query(query, [
            data.tenant_name,
            data.tenant_code,
            data.status || 'active',
            JSON.stringify(data.config || {})
        ]);

        return { id: result.insertId, ...data };
    }

    static async findByCode(tenantCode) {
        const query = 'SELECT * FROM tenants WHERE tenant_code = ?';
        const result = await db.query(query, [tenantCode]);
        return result[0] || null;
    }

    static async findAll(options = {}) {
        let query = 'SELECT * FROM tenants WHERE 1=1';
        const params = [];

        if (options.status) {
            query += ' AND status = ?';
            params.push(options.status);
        }

        if (options.search) {
            query += ' AND (tenant_name LIKE ? OR tenant_code LIKE ?)';
            params.push(`%${options.search}%`, `%${options.search}%`);
        }

        query += ' ORDER BY created_at DESC';

        if (options.limit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(options.limit, options.offset || 0);
        }

        const tenants = await db.query(query, params);

        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM tenants WHERE 1=1';
        const countParams = [];
        
        if (options.status) {
            countQuery += ' AND status = ?';
            countParams.push(options.status);
        }

        if (options.search) {
            countQuery += ' AND (tenant_name LIKE ? OR tenant_code LIKE ?)';
            countParams.push(`%${options.search}%`, `%${options.search}%`);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        return {
            data: tenants,
            pagination: {
                page: options.page || 1,
                limit: options.limit || 10,
                total,
                pages: Math.ceil(total / (options.limit || 10))
            }
        };
    }

    static async updateStatus(tenantId, status) {
        const query = 'UPDATE tenants SET status = ?, updated_at = NOW() WHERE id = ?';
        await db.query(query, [status, tenantId]);
    }
}
```

## 🎨 前端界面实现

### 1. 租户管理页面

```html
<!-- 租户管理页面 -->
<div class="tenant-management">
    <div class="page-header">
        <h1>租户管理</h1>
        <button class="btn btn-primary" onclick="showCreateTenantModal()">
            添加租户
        </button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filters">
        <input type="text" id="searchInput" placeholder="搜索租户名称或代码" />
        <select id="statusFilter">
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
            <option value="suspended">已暂停</option>
        </select>
        <button class="btn btn-secondary" onclick="searchTenants()">搜索</button>
    </div>

    <!-- 租户列表 -->
    <div class="tenant-list">
        <table class="table">
            <thead>
                <tr>
                    <th>租户代码</th>
                    <th>租户名称</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="tenantTableBody">
                <!-- 动态加载租户数据 -->
            </tbody>
        </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" id="pagination">
        <!-- 动态生成分页控件 -->
    </div>
</div>

<!-- 创建租户模态框 -->
<div class="modal" id="createTenantModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>创建新租户</h2>
            <span class="close" onclick="closeCreateTenantModal()">&times;</span>
        </div>
        <div class="modal-body">
            <form id="createTenantForm">
                <div class="form-group">
                    <label for="tenantName">租户名称</label>
                    <input type="text" id="tenantName" name="tenantName" required />
                </div>
                <div class="form-group">
                    <label for="tenantCode">租户代码</label>
                    <input type="text" id="tenantCode" name="tenantCode" required />
                </div>
                <div class="form-group">
                    <label for="adminEmail">管理员邮箱</label>
                    <input type="email" id="adminEmail" name="adminEmail" required />
                </div>
                <div class="form-group">
                    <label for="adminPassword">管理员密码</label>
                    <input type="password" id="adminPassword" name="adminPassword" required />
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeCreateTenantModal()">取消</button>
            <button class="btn btn-primary" onclick="createTenant()">创建</button>
        </div>
    </div>
</div>
```

### 2. JavaScript 功能实现

```javascript
// 租户管理前端逻辑
class TenantManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentFilters = {};
        this.init();
    }

    init() {
        this.loadTenants();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchTenants();
            }
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.searchTenants();
        });
    }

    async loadTenants() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                ...this.currentFilters
            });

            const response = await fetch(`/api/tenants?${params}`);
            const data = await response.json();

            this.renderTenantTable(data.data);
            this.renderPagination(data.pagination);
        } catch (error) {
            console.error('加载租户列表失败:', error);
            this.showError('加载租户列表失败');
        }
    }

    renderTenantTable(tenants) {
        const tbody = document.getElementById('tenantTableBody');
        tbody.innerHTML = '';

        tenants.forEach(tenant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tenant.tenant_code}</td>
                <td>${tenant.tenant_name}</td>
                <td>
                    <span class="status-badge status-${tenant.status}">
                        ${this.getStatusText(tenant.status)}
                    </span>
                </td>
                <td>${new Date(tenant.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewTenant(${tenant.id})">
                        查看
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editTenant(${tenant.id})">
                        编辑
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTenant(${tenant.id})">
                        删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPagination(pagination) {
        const paginationDiv = document.getElementById('pagination');
        paginationDiv.innerHTML = '';

        const { page, pages, total } = pagination;
        
        // 上一页
        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '上一页';
            prevBtn.className = 'btn btn-sm btn-secondary';
            prevBtn.onclick = () => {
                this.currentPage = page - 1;
                this.loadTenants();
            };
            paginationDiv.appendChild(prevBtn);
        }

        // 页码
        for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}`;
            pageBtn.onclick = () => {
                this.currentPage = i;
                this.loadTenants();
            };
            paginationDiv.appendChild(pageBtn);
        }

        // 下一页
        if (page < pages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = '下一页';
            nextBtn.className = 'btn btn-sm btn-secondary';
            nextBtn.onclick = () => {
                this.currentPage = page + 1;
                this.loadTenants();
            };
            paginationDiv.appendChild(nextBtn);
        }

        // 显示总数
        const totalSpan = document.createElement('span');
        totalSpan.textContent = `共 ${total} 条记录`;
        totalSpan.className = 'pagination-info';
        paginationDiv.appendChild(totalSpan);
    }

    searchTenants() {
        this.currentFilters = {
            search: document.getElementById('searchInput').value,
            status: document.getElementById('statusFilter').value
        };
        this.currentPage = 1;
        this.loadTenants();
    }

    async createTenant() {
        const form = document.getElementById('createTenantForm');
        const formData = new FormData(form);
        
        const tenantData = {
            tenantName: formData.get('tenantName'),
            tenantCode: formData.get('tenantCode'),
            adminEmail: formData.get('adminEmail'),
            adminPassword: formData.get('adminPassword')
        };

        try {
            const response = await fetch('/api/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tenantData)
            });

            if (response.ok) {
                this.showSuccess('租户创建成功');
                this.closeCreateTenantModal();
                this.loadTenants();
            } else {
                const error = await response.json();
                this.showError(error.error || '创建失败');
            }
        } catch (error) {
            console.error('创建租户失败:', error);
            this.showError('创建租户失败');
        }
    }

    getStatusText(status) {
        const statusMap = {
            'active': '活跃',
            'inactive': '非活跃',
            'suspended': '已暂停'
        };
        return statusMap[status] || status;
    }

    showSuccess(message) {
        // 显示成功消息
        console.log('Success:', message);
    }

    showError(message) {
        // 显示错误消息
        console.error('Error:', message);
    }
}

// 全局函数
function showCreateTenantModal() {
    document.getElementById('createTenantModal').style.display = 'block';
}

function closeCreateTenantModal() {
    document.getElementById('createTenantModal').style.display = 'none';
    document.getElementById('createTenantForm').reset();
}

function createTenant() {
    tenantManager.createTenant();
}

// 初始化
const tenantManager = new TenantManager();
```

## 🔧 部署和配置

### 1. 环境配置

```javascript
// 配置文件 config/database.js
module.exports = {
    development: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'admin_platform',
        charset: 'utf8mb4',
        timezone: '+08:00',
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    },
    production: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4',
        timezone: '+08:00',
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        ssl: process.env.DB_SSL === 'true' ? {} : false
    }
};
```

### 2. 数据库迁移脚本

```sql
-- 01_create_tenants_table.sql
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    config JSON,
    INDEX idx_tenant_code (tenant_code),
    INDEX idx_status (status)
);

-- 02_create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'tenant_admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tenant_username (tenant_id, username),
    UNIQUE KEY uk_tenant_email (tenant_id, email),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email (email)
);

-- 03_create_permissions_table.sql
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_permission_code (permission_code),
    INDEX idx_resource_action (resource_type, action)
);

-- 04_create_roles_table.sql
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tenant_role_code (tenant_id, role_code),
    INDEX idx_tenant_id (tenant_id)
);

-- 05_create_role_permissions_table.sql
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (role_id, permission_id)
);

-- 06_create_user_roles_table.sql
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);

-- 07_insert_default_permissions.sql
INSERT INTO permissions (permission_name, permission_code, resource_type, action, description) VALUES
('用户管理', 'user.manage', 'user', 'manage', '管理用户信息'),
('用户查看', 'user.view', 'user', 'view', '查看用户信息'),
('用户创建', 'user.create', 'user', 'create', '创建新用户'),
('用户编辑', 'user.edit', 'user', 'edit', '编辑用户信息'),
('用户删除', 'user.delete', 'user', 'delete', '删除用户'),
('租户管理', 'tenant.manage', 'tenant', 'manage', '管理租户信息'),
('租户查看', 'tenant.view', 'tenant', 'view', '查看租户信息'),
('租户创建', 'tenant.create', 'tenant', 'create', '创建新租户'),
('租户编辑', 'tenant.edit', 'tenant', 'edit', '编辑租户信息'),
('租户删除', 'tenant.delete', 'tenant', 'delete', '删除租户'),
('角色管理', 'role.manage', 'role', 'manage', '管理角色信息'),
('权限管理', 'permission.manage', 'permission', 'manage', '管理权限信息');
```

### 3. 应用启动配置

```javascript
// app.js - 应用入口
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 导入路由
const tenantRoutes = require('./routes/tenants');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// 限流
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use(limiter);

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 租户上下文中间件
app.use(require('./middleware/tenantContext'));

// 认证中间件
app.use('/api', require('./middleware/auth'));

// 路由
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

## 📊 监控和日志

### 1. 租户使用情况监控

```javascript
// 租户监控服务
class TenantMonitoringService {
    static async getTenantStats(tenantId) {
        const stats = await Promise.all([
            this.getUserCount(tenantId),
            this.getActiveUsers(tenantId),
            this.getResourceUsage(tenantId),
            this.getLastActivity(tenantId)
        ]);

        return {
            userCount: stats[0],
            activeUsers: stats[1],
            resourceUsage: stats[2],
            lastActivity: stats[3]
        };
    }

    static async getUserCount(tenantId) {
        const query = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = ?';
        const result = await db.query(query, [tenantId]);
        return result[0].count;
    }

    static async getActiveUsers(tenantId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM users 
            WHERE tenant_id = ? 
            AND status = 'active' 
            AND last_login_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;
        const result = await db.query(query, [tenantId]);
        return result[0].count;
    }
}
```

### 2. 审计日志

```javascript
// 审计日志服务
class AuditLogService {
    static async log(action, resource, resourceId, userId, tenantId, details = {}) {
        const query = `
            INSERT INTO audit_logs 
            (action, resource, resource_id, user_id, tenant_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        await db.query(query, [
            action,
            resource,
            resourceId,
            userId,
            tenantId,
            JSON.stringify(details)
        ]);
    }

    static async getAuditLogs(tenantId, filters = {}) {
        let query = `
            SELECT al.*, u.username, u.email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.tenant_id = ?
        `;
        const params = [tenantId];

        if (filters.action) {
            query += ' AND al.action = ?';
            params.push(filters.action);
        }

        if (filters.resource) {
            query += ' AND al.resource = ?';
            params.push(filters.resource);
        }

        if (filters.startDate) {
            query += ' AND al.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND al.created_at <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY al.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        return await db.query(query, params);
    }
}
```

## 🚀 部署指南

### 1. Docker 配置

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USER=admin
      - DB_PASSWORD=password
      - DB_NAME=admin_platform
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=admin_platform
      - MYSQL_USER=admin
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mysql_data:
```

### 2. 环境变量配置

```bash
# .env.production
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your_password
DB_NAME=admin_platform
DB_SSL=false

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# 允许的域名
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# 文件上传配置
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760
```

## 📋 总结

本指南提供了完整的后台管理平台多租户功能实现方案，包括：

1. **架构设计**：共享数据库独立Schema模式
2. **数据隔离**：应用层和数据库层的隔离机制
3. **权限管理**：基于角色的权限控制系统
4. **租户管理**：完整的CRUD操作和状态管理
5. **前端界面**：现代化的管理界面
6. **部署配置**：Docker化和生产环境配置

通过这个方案，您可以：
- 快速为现有平台添加多租户支持
- 确保数据安全和隔离
- 提供灵活的权限管理
- 支持租户的独立配置和管理
- 实现可扩展的架构设计

建议按照本指南逐步实施，并根据实际业务需求进行调整和优化。