// 网易云推流平台配置
const LIVE_CONFIG = {
  // 网易云信配置
  netease: {
    appKey: 'YOUR_NETEASE_APP_KEY', // 请替换为您的网易云信AppKey
    appSecret: 'YOUR_NETEASE_APP_SECRET', // 请替换为您的网易云信AppSecret
    
    // 推流配置
    streaming: {
      // 推流域名
      pushDomain: 'push.your-domain.com',
      // 拉流域名
      pullDomain: 'pull.your-domain.com',
      // 推流协议
      pushProtocol: 'rtmp',
      // 拉流协议
      pullProtocol: 'http-flv', // 支持 http-flv, hls, rtmp
      // 默认码率
      bitrate: {
        video: 1000, // kbps
        audio: 128   // kbps
      },
      // 分辨率
      resolution: {
        width: 720,
        height: 1280
      },
      // 帧率
      fps: 30
    },
    
    // 直播间配置
    room: {
      // 房间类型
      type: 'live', // live: 直播, video: 点播
      // 最大观众数
      maxAudience: 10000,
      // 是否需要鉴权
      needAuth: true,
      // 录制配置
      record: {
        enabled: true,
        format: 'mp4',
        duration: 3600 // 秒
      }
    }
  },
  
  // 小程序配置
  miniprogram: {
    // 直播组件配置
    livePlayer: {
      // 播放模式 live: 直播, RTC: 实时通话
      mode: 'live',
      // 画面方向
      orientation: 'vertical',
      // 是否静音
      muted: false,
      // 最小缓冲区
      minCache: 1,
      // 最大缓冲区
      maxCache: 3,
      // 背景色
      backgroundColor: '#000000'
    },
    
    // 推流组件配置
    livePusher: {
      // 推流模式
      mode: 'HD', // SD: 标清, HD: 高清, FHD: 超清
      // 画面方向
      orientation: 'vertical',
      // 美颜级别
      beauty: 5,
      // 美白级别
      whiteness: 5,
      // 是否静音
      muted: false,
      // 是否开启摄像头
      enableCamera: true,
      // 前置/后置摄像头
      devicePosition: 'front'
    }
  },
  
  // API接口配置
  api: {
    baseUrl: 'https://your-api-domain.com',
    endpoints: {
      // 创建直播间
      createRoom: '/api/live/room/create',
      // 获取推流地址
      getPushUrl: '/api/live/stream/push',
      // 获取拉流地址
      getPullUrl: '/api/live/stream/pull',
      // 直播间列表
      roomList: '/api/live/room/list',
      // 进入直播间
      joinRoom: '/api/live/room/join',
      // 离开直播间
      leaveRoom: '/api/live/room/leave',
      // 发送消息
      sendMessage: '/api/live/chat/send',
      // 获取消息
      getMessages: '/api/live/chat/messages'
    }
  },
  
  // 聊天配置
  chat: {
    // 消息类型
    messageTypes: {
      TEXT: 'text',
      EMOJI: 'emoji',
      GIFT: 'gift',
      SYSTEM: 'system'
    },
    // 最大消息长度
    maxMessageLength: 200,
    // 消息发送间隔（毫秒）
    sendInterval: 1000,
    // 最大显示消息数
    maxDisplayMessages: 100
  }
};

module.exports = LIVE_CONFIG;