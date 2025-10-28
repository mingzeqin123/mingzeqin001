// utils/sonos-api.js
// Sonos API 集成工具类

class SonosAPI {
  constructor() {
    this.apiKey = null
    this.apiSecret = null
    this.accessToken = null
    this.baseURL = 'https://api.sonos.com/control/v1'
    this.households = []
    this.groups = []
    this.players = []
    this.isInitialized = false
  }

  // 初始化Sonos API
  async initialize(apiKey, apiSecret) {
    try {
      this.apiKey = apiKey
      this.apiSecret = apiSecret
      
      // 获取访问令牌
      await this.getAccessToken()
      
      // 获取家庭信息
      await this.getHouseholds()
      
      this.isInitialized = true
      console.log('Sonos API 初始化成功')
      return true
    } catch (error) {
      console.error('Sonos API 初始化失败:', error)
      return false
    }
  }

  // 获取访问令牌
  async getAccessToken() {
    try {
      const response = await wx.request({
        url: 'https://api.sonos.com/login/v3/oauth/access',
        method: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret
        }
      })

      if (response.statusCode === 200) {
        this.accessToken = response.data.access_token
        return true
      } else {
        throw new Error(`获取访问令牌失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('获取访问令牌错误:', error)
      throw error
    }
  }

  // 获取家庭列表
  async getHouseholds() {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (response.statusCode === 200) {
        this.households = response.data.households
        return this.households
      } else {
        throw new Error(`获取家庭列表失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('获取家庭列表错误:', error)
      throw error
    }
  }

  // 获取播放器组
  async getGroups(householdId) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/groups`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (response.statusCode === 200) {
        this.groups = response.data.groups
        return this.groups
      } else {
        throw new Error(`获取播放器组失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('获取播放器组错误:', error)
      throw error
    }
  }

  // 获取播放器列表
  async getPlayers(householdId) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/players`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (response.statusCode === 200) {
        this.players = response.data.players
        return this.players
      } else {
        throw new Error(`获取播放器列表失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('获取播放器列表错误:', error)
      throw error
    }
  }

  // 播放音频片段
  async playAudioClip(householdId, playerId, audioClip) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/groups/playAudioClip`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          playerId: playerId,
          audioClip: {
            name: audioClip.name,
            appId: audioClip.appId,
            streamUrl: audioClip.streamUrl,
            httpAuthorization: audioClip.httpAuthorization,
            volume: audioClip.volume || 20,
            clipType: audioClip.clipType || 'CHIME'
          }
        }
      })

      if (response.statusCode === 202) {
        console.log('音频片段播放请求已发送')
        return true
      } else {
        throw new Error(`播放音频片段失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('播放音频片段错误:', error)
      throw error
    }
  }

  // 播放TTS语音
  async playTTS(householdId, playerId, text, options = {}) {
    try {
      // 使用Google TTS生成语音
      const ttsUrl = await this.generateTTS(text, options)
      
      const audioClip = {
        name: 'Game TTS',
        appId: 'com.wechat.jumpgame',
        streamUrl: ttsUrl,
        volume: options.volume || 20,
        clipType: 'CUSTOM'
      }

      return await this.playAudioClip(householdId, playerId, audioClip)
    } catch (error) {
      console.error('播放TTS错误:', error)
      throw error
    }
  }

  // 生成TTS语音URL
  async generateTTS(text, options = {}) {
    try {
      const language = options.language || 'zh-CN'
      const voice = options.voice || 'zh-CN-Wavenet-A'
      const speed = options.speed || 1.0
      const pitch = options.pitch || 0.0
      
      // 这里需要配置Google TTS API密钥
      const apiKey = options.googleApiKey || 'YOUR_GOOGLE_TTS_API_KEY'
      
      const encodedText = encodeURIComponent(text)
      const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`
      
      const response = await wx.request({
        url: ttsUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          input: { text: text },
          voice: {
            languageCode: language,
            name: voice,
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speed,
            pitch: pitch
          }
        }
      })

      if (response.statusCode === 200) {
        // 将base64音频数据转换为可播放的URL
        const audioData = response.data.audioContent
        return `data:audio/mp3;base64,${audioData}`
      } else {
        throw new Error(`TTS生成失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('TTS生成错误:', error)
      throw error
    }
  }

  // 控制播放器音量
  async setVolume(householdId, playerId, volume) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/players/${playerId}/playerVolume`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          volume: Math.max(0, Math.min(100, volume))
        }
      })

      if (response.statusCode === 200) {
        console.log(`播放器音量设置为: ${volume}`)
        return true
      } else {
        throw new Error(`设置音量失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('设置音量错误:', error)
      throw error
    }
  }

  // 暂停播放
  async pause(householdId, playerId) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/groups/pause`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          playerId: playerId
        }
      })

      if (response.statusCode === 200) {
        console.log('播放已暂停')
        return true
      } else {
        throw new Error(`暂停播放失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('暂停播放错误:', error)
      throw error
    }
  }

  // 恢复播放
  async resume(householdId, playerId) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/groups/play`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          playerId: playerId
        }
      })

      if (response.statusCode === 200) {
        console.log('播放已恢复')
        return true
      } else {
        throw new Error(`恢复播放失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('恢复播放错误:', error)
      throw error
    }
  }

  // 获取播放状态
  async getPlaybackState(householdId, playerId) {
    try {
      const response = await wx.request({
        url: `${this.baseURL}/households/${householdId}/groups/playbackState`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        data: {
          playerId: playerId
        }
      })

      if (response.statusCode === 200) {
        return response.data
      } else {
        throw new Error(`获取播放状态失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('获取播放状态错误:', error)
      throw error
    }
  }

  // 播放游戏音效
  async playGameSound(householdId, playerId, soundType, score = 0) {
    const soundMessages = {
      'jump': '跳跃！',
      'landing': '落地成功！',
      'perfect': '完美落地！',
      'gameOver': '游戏结束！',
      'newRecord': `新纪录！${score}分！`,
      'start': '游戏开始！'
    }

    const message = soundMessages[soundType] || '游戏音效'
    
    try {
      await this.playTTS(householdId, playerId, message, {
        volume: 15,
        speed: 1.2
      })
    } catch (error) {
      console.error('播放游戏音效错误:', error)
    }
  }

  // 检查API是否已初始化
  isReady() {
    return this.isInitialized && this.accessToken !== null
  }

  // 获取当前配置
  getConfig() {
    return {
      isInitialized: this.isInitialized,
      hasAccessToken: this.accessToken !== null,
      householdsCount: this.households.length,
      groupsCount: this.groups.length,
      playersCount: this.players.length
    }
  }
}

// 创建全局实例
const sonosAPI = new SonosAPI()

export default sonosAPI