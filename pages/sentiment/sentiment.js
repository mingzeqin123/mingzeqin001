// 情感分析页面逻辑
Page({
  data: {
    inputText: '',
    analysisResult: null,
    history: []
  },

  // 输入文本变化
  onInputChange: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 分析情感
  analyzeSentiment: function() {
    const text = this.data.inputText.trim();
    if (!text) return;

    wx.showLoading({
      title: '分析中...'
    });

    // 模拟分析延迟
    setTimeout(() => {
      const result = this.performSentimentAnalysis(text);
      
      this.setData({
        analysisResult: result
      });

      // 添加到历史记录
      this.addToHistory(text, result);

      wx.hideLoading();
    }, 1000);
  },

  // 执行情感分析
  performSentimentAnalysis: function(text) {
    // 情感词典
    const positiveWords = [
      '开心', '高兴', '快乐', '兴奋', '满意', '喜欢', '爱', '好', '棒', '优秀',
      '完美', '赞', '太棒了', '太好了', '不错', '很好', '棒极了', '喜欢',
      '爱', '开心', '快乐', '高兴', '兴奋', '满意', '赞', '好', '棒',
      '优秀', '完美', '太棒了', '太好了', '不错', '很好', '棒极了',
      '感谢', '谢谢', '感激', '感动', '温暖', '幸福', '满足', '舒适',
      '安心', '放心', '轻松', '愉快', '美好', '精彩', '出色', '成功'
    ];

    const negativeWords = [
      '难过', '伤心', '痛苦', '失望', '生气', '愤怒', '讨厌', '恨', '坏', '差',
      '糟糕', '烂', '太差了', '太坏了', '不好', '很差', '糟糕透了', '讨厌',
      '恨', '难过', '伤心', '痛苦', '失望', '生气', '愤怒', '坏', '差',
      '糟糕', '烂', '太差了', '太坏了', '不好', '很差', '糟糕透了',
      '担心', '焦虑', '紧张', '害怕', '恐惧', '不安', '烦躁', '郁闷',
      '沮丧', '绝望', '无助', '孤独', '寂寞', '空虚', '无聊', '厌烦'
    ];

    const neutralWords = [
      '问题', '什么', '怎么', '为什么', '如何', '哪里', '什么时候', '谁',
      '请问', '咨询', '了解', '知道', '明白', '理解', '学习', '研究',
      '工作', '生活', '学习', '吃饭', '睡觉', '走路', '开车', '购物'
    ];

    // 计算情感得分
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    const keywords = [];

    // 简单的中文分词：按字符分割并检查连续字符组合
    const chars = text.split('');
    const words = [];
    
    // 添加完整文本
    words.push(text);
    
    // 添加2-4字符的组合
    for (let i = 0; i < chars.length - 1; i++) {
      for (let len = 2; len <= Math.min(4, chars.length - i); len++) {
        const word = chars.slice(i, i + len).join('');
        if (word.length >= 2) {
          words.push(word);
        }
      }
    }
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveScore += 2;
        keywords.push(word);
      } else if (negativeWords.includes(word)) {
        negativeScore += 2;
        keywords.push(word);
      } else if (neutralWords.includes(word)) {
        neutralScore += 1;
      }
    });

    // 检查表情符号
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiPattern) || [];
    
    emojis.forEach(emoji => {
      if (['😊', '😄', '😃', '😁', '😆', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '😎', '🤓', '😇', '🥳', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤔', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😊', '😄', '😃', '😁', '😆', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '😎', '🤓', '😇', '🥳', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤔', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'].includes(emoji)) {
        positiveScore += 3;
      } else if (['😢', '😭', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].includes(emoji)) {
        negativeScore += 3;
      }
    });

    // 检查标点符号
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    
    if (exclamationCount > 0) {
      if (positiveScore > negativeScore) {
        positiveScore += exclamationCount;
      } else {
        negativeScore += exclamationCount;
      }
    }

    // 确定情感类型
    let emotion, emotionLabel, emotionIcon, confidence;
    
    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      emotion = 'positive';
      emotionLabel = '积极正面';
      emotionIcon = '😊';
      confidence = Math.min(95, Math.max(60, (positiveScore / (positiveScore + negativeScore + neutralScore)) * 100));
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      emotion = 'negative';
      emotionLabel = '消极负面';
      emotionIcon = '😔';
      confidence = Math.min(95, Math.max(60, (negativeScore / (positiveScore + negativeScore + neutralScore)) * 100));
    } else {
      emotion = 'neutral';
      emotionLabel = '中性客观';
      emotionIcon = '😐';
      confidence = Math.min(95, Math.max(60, (neutralScore / (positiveScore + negativeScore + neutralScore)) * 100));
    }

    // 生成回复
    const response = this.generateResponse(emotion, text, keywords);

    return {
      emotion,
      emotionLabel,
      emotionIcon,
      confidence: Math.round(confidence),
      response,
      keywords: [...new Set(keywords)].slice(0, 5) // 去重并限制数量
    };
  },

  // 生成回复
  generateResponse: function(emotion, text, keywords) {
    const responses = {
      positive: [
        '看到您这么开心，我也感到很高兴！继续保持这种积极的心态吧！',
        '您的正能量感染了我！生活就是要这样充满阳光！',
        '太棒了！您的乐观态度真的很令人钦佩！',
        '看到您这么满意，我也为您感到开心！',
        '您的快乐就是我的快乐！继续保持这种好心情！'
      ],
      negative: [
        '我理解您现在的感受，每个人都会有低落的时候。请相信，困难只是暂时的。',
        '看起来您现在心情不太好，我在这里陪伴您。有什么想聊的都可以告诉我。',
        '我感受到您的困扰，请记住您并不孤单，我会一直支持您。',
        '虽然现在可能有些困难，但请相信一切都会好起来的。',
        '我理解您的感受，有时候表达出来也是一种释放。'
      ],
      neutral: [
        '感谢您的提问，我会尽力为您提供帮助。',
        '这是一个很好的问题，让我来为您分析一下。',
        '我理解您的需求，让我为您详细解答。',
        '您的问题很有价值，我会认真对待。',
        '感谢您的信任，我会尽力为您提供准确的信息。'
      ]
    };

    // 根据关键词调整回复
    let baseResponse = responses[emotion][Math.floor(Math.random() * responses[emotion].length)];
    
    if (keywords.length > 0) {
      const keyword = keywords[0];
      if (emotion === 'positive') {
        baseResponse += ` 特别是关于"${keyword}"的部分，听起来真的很棒！`;
      } else if (emotion === 'negative') {
        baseResponse += ` 关于"${keyword}"的问题，我们可以一起想办法解决。`;
      } else {
        baseResponse += ` 关于"${keyword}"这个话题，确实值得深入探讨。`;
      }
    }

    return baseResponse;
  },

  // 添加到历史记录
  addToHistory: function(text, result) {
    const history = this.data.history;
    history.unshift({
      text: text.length > 50 ? text.substring(0, 50) + '...' : text,
      emotion: result.emotion,
      emotionLabel: result.emotionLabel,
      fullText: text,
      result: result
    });
    
    // 限制历史记录数量
    if (history.length > 10) {
      history.pop();
    }
    
    this.setData({ history });
  },

  // 选择历史记录
  selectHistory: function(e) {
    const index = e.currentTarget.dataset.index;
    const historyItem = this.data.history[index];
    
    this.setData({
      inputText: historyItem.fullText,
      analysisResult: historyItem.result
    });
  },

  // 页面加载
  onLoad: function(options) {
    // 可以在这里加载历史记录
    this.loadHistory();
  },

  // 加载历史记录
  loadHistory: function() {
    try {
      const history = wx.getStorageSync('sentiment_history') || [];
      this.setData({ history });
    } catch (e) {
      console.error('加载历史记录失败:', e);
    }
  },

  // 保存历史记录
  saveHistory: function() {
    try {
      wx.setStorageSync('sentiment_history', this.data.history);
    } catch (e) {
      console.error('保存历史记录失败:', e);
    }
  },

  // 页面卸载时保存历史记录
  onUnload: function() {
    this.saveHistory();
  }
});