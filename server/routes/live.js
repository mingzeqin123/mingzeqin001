const express = require('express');
const router = express.Router();

/**
 * 创建直播间
 * POST /api/live/create
 */
router.post('/create', async (req, res) => {
  try {
    const { title, cover, hostId, hostInfo } = req.body;
    
    if (!title || !hostId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    const room = await req.liveService.createRoom({
      title,
      cover,
      hostId,
      hostInfo
    });
    
    res.json({
      code: 0,
      message: '创建成功',
      data: room
    });
  } catch (error) {
    console.error('创建直播间失败:', error);
    res.json({
      code: 500,
      message: '创建失败'
    });
  }
});

/**
 * 获取直播间信息
 * GET /api/live/room/:roomId
 */
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await req.liveService.getRoomInfo(roomId);
    
    if (!room) {
      return res.json({
        code: 404,
        message: '直播间不存在'
      });
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: room
    });
  } catch (error) {
    console.error('获取直播间信息失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取推流地址
 * POST /api/live/push-url
 */
router.post('/push-url', async (req, res) => {
  try {
    const { roomId, title, cover } = req.body;
    
    if (!roomId || !title) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    // 获取推流地址
    const pushInfo = await req.neteaseService.getPushUrl(roomId, title, cover);
    
    // 更新直播间信息
    await req.liveService.updateRoom(roomId, {
      pushUrl: pushInfo.pushUrl,
      streamUrl: pushInfo.streamUrl,
      hlsUrl: pushInfo.hlsUrl,
      rtmpUrl: pushInfo.rtmpUrl
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: pushInfo
    });
  } catch (error) {
    console.error('获取推流地址失败:', error);
    res.json({
      code: 500,
      message: error.message || '获取失败'
    });
  }
});

/**
 * 开始直播
 * POST /api/live/start
 */
router.post('/start', async (req, res) => {
  try {
    const { roomId, title, cover } = req.body;
    
    if (!roomId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    // 获取推流地址
    const pushInfo = await req.neteaseService.getPushUrl(roomId, title, cover);
    
    // 开始直播
    const success = await req.liveService.startLive(roomId, {
      title,
      cover,
      ...pushInfo
    });
    
    if (!success) {
      return res.json({
        code: 500,
        message: '开始直播失败'
      });
    }
    
    res.json({
      code: 0,
      message: '开始直播成功',
      data: pushInfo
    });
  } catch (error) {
    console.error('开始直播失败:', error);
    res.json({
      code: 500,
      message: error.message || '开始直播失败'
    });
  }
});

/**
 * 停止直播
 * POST /api/live/stop
 */
router.post('/stop', async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    const success = await req.liveService.stopLive(roomId);
    
    if (!success) {
      return res.json({
        code: 500,
        message: '停止直播失败'
      });
    }
    
    res.json({
      code: 0,
      message: '停止直播成功'
    });
  } catch (error) {
    console.error('停止直播失败:', error);
    res.json({
      code: 500,
      message: '停止直播失败'
    });
  }
});

/**
 * 获取正在直播的房间列表
 * GET /api/live/rooms
 */
router.get('/rooms', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await req.liveService.getLiveRooms(
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result
    });
  } catch (error) {
    console.error('获取直播房间列表失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 搜索直播间
 * GET /api/live/search
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
    
    const result = await req.liveService.searchRooms(
      keyword,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '搜索成功',
      data: result
    });
  } catch (error) {
    console.error('搜索直播间失败:', error);
    res.json({
      code: 500,
      message: '搜索失败'
    });
  }
});

/**
 * 获取弹幕列表
 * GET /api/live/danmaku/:roomId
 */
router.get('/danmaku/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.query;
    
    const danmakuList = await req.liveService.getDanmakuList(
      roomId,
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: danmakuList
    });
  } catch (error) {
    console.error('获取弹幕列表失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取礼物列表
 * GET /api/live/gifts/:roomId
 */
router.get('/gifts/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.query;
    
    const giftList = await req.liveService.getGiftList(
      roomId,
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: giftList
    });
  } catch (error) {
    console.error('获取礼物列表失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取直播统计信息
 * GET /api/live/stats/:roomId
 */
router.get('/stats/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const stats = await req.liveService.getLiveStats(roomId);
    
    if (!stats) {
      return res.json({
        code: 404,
        message: '直播间不存在'
      });
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: stats
    });
  } catch (error) {
    console.error('获取直播统计失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 更新观看人数
 * POST /api/live/viewer-count
 */
router.post('/viewer-count', async (req, res) => {
  try {
    const { roomId, count } = req.body;
    
    if (!roomId || count === undefined) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    const success = await req.liveService.updateViewerCount(roomId, count);
    
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
    console.error('更新观看人数失败:', error);
    res.json({
      code: 500,
      message: '更新失败'
    });
  }
});

/**
 * 删除直播间
 * DELETE /api/live/room/:roomId
 */
router.delete('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const success = await req.liveService.deleteRoom(roomId);
    
    if (!success) {
      return res.json({
        code: 500,
        message: '删除失败'
      });
    }
    
    res.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除直播间失败:', error);
    res.json({
      code: 500,
      message: '删除失败'
    });
  }
});

module.exports = router;