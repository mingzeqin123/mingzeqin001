#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const migrate = async () => {
  try {
    console.log('🔄 开始数据库迁移...');
    
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi_tenant_admin';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ 数据库连接成功');

    // 创建索引
    console.log('📊 创建数据库索引...');
    
    // 租户索引
    await Tenant.collection.createIndex({ slug: 1 }, { unique: true });
    await Tenant.collection.createIndex({ domain: 1 }, { unique: true, sparse: true });
    await Tenant.collection.createIndex({ status: 1 });
    await Tenant.collection.createIndex({ 'subscription.plan': 1 });
    await Tenant.collection.createIndex({ 'subscription.endDate': 1 });
    
    // 用户索引
    await User.collection.createIndex({ tenantId: 1, username: 1 }, { unique: true });
    await User.collection.createIndex({ tenantId: 1, email: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1, role: 1 });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ lastLogin: 1 });
    
    // 超级管理员邮箱唯一索引
    await User.collection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { role: 'super_admin' }
      }
    );

    console.log('✅ 索引创建完成');

    // 数据迁移任务
    console.log('🔄 执行数据迁移任务...');

    // 任务1: 为没有权限的用户添加默认权限
    const usersWithoutPermissions = await User.find({ 
      permissions: { $exists: false } 
    });
    
    for (const user of usersWithoutPermissions) {
      let defaultPermissions = [];
      
      switch (user.role) {
        case 'super_admin':
          defaultPermissions = ['*']; // 所有权限
          break;
        case 'tenant_admin':
          defaultPermissions = [
            'user.read', 'user.create', 'user.update', 'user.delete',
            'tenant.read', 'tenant.update',
            'report.read'
          ];
          break;
        case 'admin':
          defaultPermissions = [
            'user.read', 'user.create', 'user.update',
            'report.read'
          ];
          break;
        case 'user':
          defaultPermissions = ['user.read'];
          break;
      }
      
      user.permissions = defaultPermissions;
      await user.save();
    }
    
    if (usersWithoutPermissions.length > 0) {
      console.log(`✅ 为 ${usersWithoutPermissions.length} 个用户添加了默认权限`);
    }

    // 任务2: 为没有订阅信息的租户添加默认订阅
    const tenantsWithoutSubscription = await Tenant.find({ 
      'subscription.plan': { $exists: false } 
    });
    
    for (const tenant of tenantsWithoutSubscription) {
      tenant.subscription = {
        plan: 'free',
        startDate: tenant.createdAt || new Date(),
        maxUsers: 5,
        maxStorage: 1024
      };
      await tenant.save();
    }
    
    if (tenantsWithoutSubscription.length > 0) {
      console.log(`✅ 为 ${tenantsWithoutSubscription.length} 个租户添加了默认订阅信息`);
    }

    // 任务3: 更新用户统计信息
    const users = await User.find({ loginCount: { $exists: false } });
    for (const user of users) {
      user.loginCount = 0;
      await user.save();
    }
    
    if (users.length > 0) {
      console.log(`✅ 为 ${users.length} 个用户初始化了登录统计`);
    }

    // 任务4: 验证数据完整性
    console.log('🔍 验证数据完整性...');
    
    const orphanUsers = await User.find({ 
      tenantId: { $ne: null },
      role: { $ne: 'super_admin' }
    }).populate('tenantId');
    
    let orphanCount = 0;
    for (const user of orphanUsers) {
      if (!user.tenantId) {
        console.warn(`⚠️ 发现孤儿用户: ${user.username} (${user.email})`);
        orphanCount++;
      }
    }
    
    if (orphanCount === 0) {
      console.log('✅ 数据完整性检查通过');
    } else {
      console.warn(`⚠️ 发现 ${orphanCount} 个孤儿用户，请手动处理`);
    }

    console.log('\n🎉 数据库迁移完成！');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行脚本
if (require.main === module) {
  migrate();
}

module.exports = migrate;