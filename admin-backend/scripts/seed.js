#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const seedData = async () => {
  try {
    console.log('🌱 开始数据库初始化...');
    
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi_tenant_admin';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ 数据库连接成功');

    // 清理现有数据（可选，谨慎使用）
    if (process.argv.includes('--clean')) {
      console.log('🧹 清理现有数据...');
      await User.deleteMany({});
      await Tenant.deleteMany({});
      console.log('✅ 数据清理完成');
    }

    // 1. 创建超级管理员
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123456';
    
    const existingSuperAdmin = await User.findOne({ 
      email: superAdminEmail, 
      role: 'super_admin' 
    });

    if (!existingSuperAdmin) {
      const superAdmin = new User({
        username: 'superadmin',
        email: superAdminEmail,
        password: superAdminPassword,
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
        profile: {
          firstName: '超级',
          lastName: '管理员'
        }
      });

      await superAdmin.save();
      console.log(`✅ 超级管理员创建成功: ${superAdminEmail}`);
    } else {
      console.log('ℹ️ 超级管理员已存在');
    }

    // 2. 创建示例租户
    const sampleTenants = [
      {
        name: '示例公司A',
        slug: 'company-a',
        domain: 'company-a.example.com',
        status: 'active',
        contact: {
          email: 'admin@company-a.com',
          phone: '13800138001',
          address: '北京市朝阳区示例大厦A座'
        },
        subscription: {
          plan: 'premium',
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
          maxUsers: 50,
          maxStorage: 5120
        },
        settings: {
          theme: 'blue',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          features: ['user_management', 'reporting', 'api_access']
        }
      },
      {
        name: '示例公司B',
        slug: 'company-b',
        status: 'trial',
        contact: {
          email: 'admin@company-b.com',
          phone: '13800138002',
          address: '上海市浦东新区示例大厦B座'
        },
        subscription: {
          plan: 'basic',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天试用
          maxUsers: 10,
          maxStorage: 1024
        },
        settings: {
          theme: 'green',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          features: ['user_management']
        }
      }
    ];

    const createdTenants = [];
    
    for (const tenantData of sampleTenants) {
      const existingTenant = await Tenant.findOne({ slug: tenantData.slug });
      
      if (!existingTenant) {
        const tenant = new Tenant(tenantData);
        await tenant.save();
        createdTenants.push(tenant);
        console.log(`✅ 租户创建成功: ${tenant.name} (${tenant.slug})`);
      } else {
        createdTenants.push(existingTenant);
        console.log(`ℹ️ 租户已存在: ${existingTenant.name}`);
      }
    }

    // 3. 为每个租户创建管理员和用户
    const sampleUsers = [
      {
        tenantIndex: 0, // 对应 company-a
        users: [
          {
            username: 'admin-a',
            email: 'admin@company-a.com',
            password: 'admin123456',
            role: 'tenant_admin',
            profile: {
              firstName: '张',
              lastName: '管理员',
              department: '管理部',
              position: '系统管理员'
            },
            permissions: [
              'user.read', 'user.create', 'user.update', 'user.delete',
              'tenant.read', 'tenant.update',
              'report.read'
            ]
          },
          {
            username: 'user1-a',
            email: 'user1@company-a.com',
            password: 'user123456',
            role: 'user',
            profile: {
              firstName: '李',
              lastName: '用户',
              department: '销售部',
              position: '销售经理'
            },
            permissions: ['user.read']
          }
        ]
      },
      {
        tenantIndex: 1, // 对应 company-b
        users: [
          {
            username: 'admin-b',
            email: 'admin@company-b.com',
            password: 'admin123456',
            role: 'tenant_admin',
            profile: {
              firstName: '王',
              lastName: '管理员',
              department: '管理部',
              position: '系统管理员'
            },
            permissions: [
              'user.read', 'user.create', 'user.update', 'user.delete',
              'tenant.read', 'tenant.update'
            ]
          }
        ]
      }
    ];

    for (const tenantUsers of sampleUsers) {
      const tenant = createdTenants[tenantUsers.tenantIndex];
      
      for (const userData of tenantUsers.users) {
        const existingUser = await User.findOne({
          email: userData.email,
          tenantId: tenant._id
        });

        if (!existingUser) {
          const user = new User({
            ...userData,
            tenantId: tenant._id,
            status: 'active',
            emailVerified: true
          });

          await user.save();
          console.log(`✅ 用户创建成功: ${user.username} (${tenant.slug})`);
        } else {
          console.log(`ℹ️ 用户已存在: ${userData.username} (${tenant.slug})`);
        }
      }
    }

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 登录信息:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('超级管理员:');
    console.log(`  邮箱: ${superAdminEmail}`);
    console.log(`  密码: ${superAdminPassword}`);
    console.log('');
    console.log('租户管理员:');
    console.log('  公司A - 邮箱: admin@company-a.com, 密码: admin123456, 租户: company-a');
    console.log('  公司B - 邮箱: admin@company-b.com, 密码: admin123456, 租户: company-b');
    console.log('');
    console.log('普通用户:');
    console.log('  公司A - 邮箱: user1@company-a.com, 密码: user123456, 租户: company-a');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行脚本
if (require.main === module) {
  seedData();
}

module.exports = seedData;