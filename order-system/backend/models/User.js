const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // 创建用户
  static async create(userData) {
    const { username, email, password, full_name, phone, address } = userData;
    
    // 检查用户是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      throw new Error('用户名或邮箱已存在');
    }

    // 加密密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, full_name, phone, address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, full_name, phone, address]
    );

    return result.insertId;
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  // 根据ID查找用户
  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, phone, address, role, status, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  // 验证密码
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 更新用户信息
  static async update(id, updateData) {
    const allowedFields = ['full_name', 'phone', 'address'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // 更新用户状态
  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  // 获取用户列表（分页）
  static async getUsers(page = 1, limit = 10, role = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, username, email, full_name, phone, role, status, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      countQuery += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, role ? [role] : []);
    const total = countResult[0].total;

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 删除用户
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = User;