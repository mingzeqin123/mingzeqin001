const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 邮件配置
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 生成随机密码
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// 发送注册成功邮件
async function sendRegistrationEmail(userEmail, username, password) {
  const loginUrl = process.env.SYSTEM_LOGIN_URL || 'https://your-platform.com/login';
  const systemName = process.env.SYSTEM_NAME || '我们的平台';
  
  const mailOptions = {
    from: `"${systemName}" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: `欢迎注册${systemName} - 您的账户信息`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 注册成功！</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">欢迎加入${systemName}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">您的账户信息</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">👤 用户名</h3>
            <p style="font-size: 18px; font-weight: bold; color: #333; margin: 10px 0;">${username}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="color: #007bff; margin-top: 0;">🔑 登录密码</h3>
            <p style="font-size: 18px; font-weight: bold; color: #333; margin: 10px 0; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 4px;">${password}</p>
            <p style="color: #dc3545; font-size: 14px; margin: 10px 0 0 0;">⚠️ 请妥善保管您的密码，建议首次登录后立即修改</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">🌐 登录地址</h3>
            <p style="margin: 10px 0;">
              <a href="${loginUrl}" style="color: #007bff; text-decoration: none; font-size: 16px; font-weight: bold;">${loginUrl}</a>
            </p>
            <a href="${loginUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">立即登录</a>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #1976d2; margin-top: 0;">📋 使用说明</h3>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
              <li>使用上述用户名和密码登录系统</li>
              <li>首次登录后请立即修改密码</li>
              <li>如有任何问题，请联系我们的客服团队</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>此邮件由系统自动发送，请勿回复</p>
          <p>© 2024 ${systemName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
欢迎注册${systemName}！

您的账户信息：
用户名: ${username}
密码: ${password}
登录地址: ${loginUrl}

请妥善保管您的密码，建议首次登录后立即修改。

如有任何问题，请联系我们的客服团队。

此邮件由系统自动发送，请勿回复。
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error);
    return { success: false, error: error.message };
  }
}

// 用户注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    // 验证必填字段
    if (!email || !username) {
      return res.status(400).json({
        success: false,
        message: '邮箱和用户名不能为空'
      });
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }
    
    // 生成随机密码
    const password = generateRandomPassword();
    
    // 发送邮件
    const emailResult = await sendRegistrationEmail(email, username, password);
    
    if (emailResult.success) {
      // 这里可以将用户信息保存到数据库
      // 为了演示，我们只返回成功信息
      res.json({
        success: true,
        message: '注册成功！账户信息已发送到您的邮箱',
        data: {
          username: username,
          email: email,
          messageId: emailResult.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '注册失败，邮件发送错误',
        error: emailResult.error
      });
    }
    
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📧 邮件服务已配置`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;