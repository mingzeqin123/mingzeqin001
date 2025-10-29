const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, avatar } = req.body;
    
    if (!username || !password) {
      return res.json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await req.liveService.getUserByUsername(username);
    if (existingUser) {
      return res.json({
        code: 400,
        message: '用户名已存在'
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      nickname: nickname || username,
      avatar: avatar || '',
      level: 1,
      experience: 0,
      coins: 100, // 注册赠送100金币
      earnings: 0,
      totalEarnings: 0,
      liveCount: 0,
      totalLiveTime: 0,
      fansCount: 0,
      followCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await req.liveService.createUser(user);
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;
    
    res.json({
      code: 0,
      message: '注册成功',
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.json({
      code: 500,
      message: '注册失败'
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }
    
    // 查找用户
    const user = await req.liveService.getUserByUsername(username);
    if (!user) {
      return res.json({
        code: 400,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.json({
        code: 400,
        message: '用户名或密码错误'
      });
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // 更新最后登录时间
    await req.liveService.updateUser(user.id, {
      lastLoginAt: new Date()
    });
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.json({
      code: 500,
      message: '登录失败'
    });
  }
});

/**
 * 微信小程序登录
 * POST /api/auth/wechat-login
 */
router.post('/wechat-login', async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.json({
        code: 400,
        message: '缺少微信授权码'
      });
    }
    
    // 调用微信API获取openid
    const wxResponse = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`);
    const wxData = await wxResponse.json();
    
    if (wxData.errcode) {
      return res.json({
        code: 400,
        message: '微信登录失败'
      });
    }
    
    const { openid, unionid } = wxData;
    
    // 查找或创建用户
    let user = await req.liveService.getUserByOpenId(openid);
    
    if (!user) {
      // 创建新用户
      user = {
        id: Date.now().toString(),
        openid,
        unionid,
        nickname: userInfo?.nickName || '微信用户',
        avatar: userInfo?.avatarUrl || '',
        level: 1,
        experience: 0,
        coins: 100,
        earnings: 0,
        totalEarnings: 0,
        liveCount: 0,
        totalLiveTime: 0,
        fansCount: 0,
        followCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await req.liveService.createUser(user);
    } else {
      // 更新用户信息
      await req.liveService.updateUser(user.id, {
        nickname: userInfo?.nickName || user.nickname,
        avatar: userInfo?.avatarUrl || user.avatar,
        lastLoginAt: new Date()
      });
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, openid: user.openid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          coins: user.coins
        },
        token
      }
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.json({
      code: 500,
      message: '登录失败'
    });
  }
});

/**
 * 验证token
 * GET /api/auth/verify
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({
        code: 401,
        message: '缺少token'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await req.liveService.getUserById(decoded.userId);
    
    if (!user) {
      return res.json({
        code: 401,
        message: '用户不存在'
      });
    }
    
    res.json({
      code: 0,
      message: '验证成功',
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          coins: user.coins
        }
      }
    });
  } catch (error) {
    console.error('token验证失败:', error);
    res.json({
      code: 401,
      message: 'token无效'
    });
  }
});

/**
 * 刷新token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.json({
        code: 400,
        message: '缺少refresh token'
      });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    const user = await req.liveService.getUserById(decoded.userId);
    
    if (!user) {
      return res.json({
        code: 401,
        message: '用户不存在'
      });
    }
    
    // 生成新的token
    const newToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      code: 0,
      message: '刷新成功',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('token刷新失败:', error);
    res.json({
      code: 401,
      message: 'refresh token无效'
    });
  }
});

/**
 * 登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    // 这里可以实现token黑名单机制
    // 暂时直接返回成功
    res.json({
      code: 0,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出失败:', error);
    res.json({
      code: 500,
      message: '登出失败'
    });
  }
});

module.exports = router;