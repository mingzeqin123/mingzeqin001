const express = require('express');
const router = express.Router();

/**
 * 获取用户信息
 * GET /api/user/info/:userId
 */
router.get('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await req.liveService.getUserById(userId);
    
    if (!user) {
      return res.json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    // 不返回敏感信息
    const { password, ...userInfo } = user;
    
    res.json({
      code: 0,
      message: '获取成功',
      data: userInfo
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 更新用户信息
 * PUT /api/user/info/:userId
 */
router.put('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname, avatar, bio, gender, birthday } = req.body;
    
    const updateData = {};
    
    if (nickname) updateData.nickname = nickname;
    if (avatar) updateData.avatar = avatar;
    if (bio) updateData.bio = bio;
    if (gender) updateData.gender = gender;
    if (birthday) updateData.birthday = birthday;
    
    updateData.updatedAt = new Date();
    
    const success = await req.liveService.updateUser(userId, updateData);
    
    if (!success) {
      return res.json({
        code: 500,
        message: '更新失败'
      });
    }
    
    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.json({
      code: 500,
      message: '更新失败'
    });
  }
});

/**
 * 获取用户直播记录
 * GET /api/user/live-history/:userId
 */
router.get('/live-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await req.liveService.getUserLiveHistory(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: history
    });
  } catch (error) {
    console.error('获取直播记录失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取用户关注列表
 * GET /api/user/following/:userId
 */
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const following = await req.liveService.getUserFollowing(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: following
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取用户粉丝列表
 * GET /api/user/followers/:userId
 */
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const followers = await req.liveService.getUserFollowers(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: followers
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 关注用户
 * POST /api/user/follow
 */
router.post('/follow', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!userId || !targetUserId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    if (userId === targetUserId) {
      return res.json({
        code: 400,
        message: '不能关注自己'
      });
    }
    
    const success = await req.liveService.followUser(userId, targetUserId);
    
    if (!success) {
      return res.json({
        code: 500,
        message: '关注失败'
      });
    }
    
    res.json({
      code: 0,
      message: '关注成功'
    });
  } catch (error) {
    console.error('关注用户失败:', error);
    res.json({
      code: 500,
      message: '关注失败'
    });
  }
});

/**
 * 取消关注
 * POST /api/user/unfollow
 */
router.post('/unfollow', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!userId || !targetUserId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    const success = await req.liveService.unfollowUser(userId, targetUserId);
    
    if (!success) {
      return res.json({
        code: 500,
        message: '取消关注失败'
      });
    }
    
    res.json({
      code: 0,
      message: '取消关注成功'
    });
  } catch (error) {
    console.error('取消关注失败:', error);
    res.json({
      code: 500,
      message: '取消关注失败'
    });
  }
});

/**
 * 检查是否已关注
 * GET /api/user/is-following
 */
router.get('/is-following', async (req, res) => {
  try {
    const { userId, targetUserId } = req.query;
    
    if (!userId || !targetUserId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    const isFollowing = await req.liveService.isFollowing(userId, targetUserId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: { isFollowing }
    });
  } catch (error) {
    console.error('检查关注状态失败:', error);
    res.json({
      code: 500,
      message: '检查失败'
    });
  }
});

/**
 * 获取用户统计信息
 * GET /api/user/stats/:userId
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await req.liveService.getUserStats(userId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: stats
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取用户等级信息
 * GET /api/user/level/:userId
 */
router.get('/level/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const levelInfo = await req.liveService.getUserLevelInfo(userId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: levelInfo
    });
  } catch (error) {
    console.error('获取用户等级失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取用户收益统计
 * GET /api/user/earnings/:userId
 */
router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const earnings = await req.liveService.getUserEarnings(
      userId,
      startDate,
      endDate
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: earnings
    });
  } catch (error) {
    console.error('获取用户收益失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 搜索用户
 * GET /api/user/search
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    
    if (!keyword) {
      return res.json({
        code: 400,
        message: '缺少搜索关键词'
      });
    }
    
    const results = await req.liveService.searchUsers(
      keyword,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '搜索成功',
      data: results
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.json({
      code: 500,
      message: '搜索失败'
    });
  }
});

/**
 * 举报用户
 * POST /api/user/report
 */
router.post('/report', async (req, res) => {
  try {
    const { reporterId, targetUserId, reason, description } = req.body;
    
    if (!reporterId || !targetUserId || !reason) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    const report = {
      id: Date.now().toString(),
      reporterId,
      targetUserId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date()
    };
    
    await req.liveService.createReport(report);
    
    res.json({
      code: 0,
      message: '举报已提交'
    });
  } catch (error) {
    console.error('举报用户失败:', error);
    res.json({
      code: 500,
      message: '举报失败'
    });
  }
});

/**
 * 获取用户设置
 * GET /api/user/settings/:userId
 */
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const settings = await req.liveService.getUserSettings(userId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: settings
    });
  } catch (error) {
    console.error('获取用户设置失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 更新用户设置
 * PUT /api/user/settings/:userId
 */
router.put('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    const success = await req.liveService.updateUserSettings(userId, settings);
    
    if (!success) {
      return res.json({
        code: 500,
        message: '更新失败'
      });
    }
    
    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户设置失败:', error);
    res.json({
      code: 500,
      message: '更新失败'
    });
  }
});

module.exports = router;