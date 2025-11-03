const FrameAnalyzer = require('../../utils/videoFrameAnalyzer.js');

Page({
  data: {
    videoPath: '',
    duration: 0,
    durationText: '0.0',
    frameCandidates: [],
    selectedCount: 0,
    autoSelecting: false,
    analyzingProgress: 0,
    topK: 3,
    sampleFrameCount: 12,
    captureInProgress: false,
    saving: false,
    videoInfo: {},
    canvasReady: false,
    videoReady: false
  },

  onReady() {
    this.seekQueue = [];
    this.isProcessingSeek = false;
    this.canvasInitPromise = null;
    this.videoInitPromise = null;
    this.videoContext = null;
    this.videoNode = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.canvasWidthPx = 0;
    this.canvasHeightPx = 0;
    this.canvasPixelWidth = 0;
    this.canvasPixelHeight = 0;
    this.currentTime = 0;
    this.initCanvas().catch((error) => {
      console.warn('初始化画布失败', error);
    });
  },

  async initCanvas() {
    if (this.canvas && this.canvasCtx) {
      return;
    }

    if (!this.canvasInitPromise) {
      this.canvasInitPromise = new Promise((resolve, reject) => {
        const query = wx.createSelectorQuery().in(this);
        query
          .select('#analysisCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvasRef = res && res[0];
            if (!canvasRef || !canvasRef.node) {
              reject(new Error('当前基础库不支持 2d canvas 节点'));
              return;
            }

            const canvas = canvasRef.node;
            const ctx = canvas.getContext('2d');
            const sysInfo = wx.getSystemInfoSync();
            const dpr = sysInfo.pixelRatio || 1;
            const width = Math.max(canvasRef.width || 320, 120);
            const height = Math.max(canvasRef.height || 180, 90);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.scale(dpr, dpr);

            this.canvas = canvas;
            this.canvasCtx = ctx;
            this.canvasWidthPx = width;
            this.canvasHeightPx = height;
            this.canvasPixelWidth = canvas.width;
            this.canvasPixelHeight = canvas.height;

            this.setData({ canvasReady: true });
            resolve();
          });
      }).catch((err) => {
        this.canvasInitPromise = null;
        throw err;
      });
    }

    return this.canvasInitPromise;
  },

  async initVideoNode() {
    if (!this.data.videoPath) {
      throw new Error('未选择视频');
    }

    if (this.videoNode && this.videoContext) {
      return;
    }

    if (!this.videoInitPromise) {
      this.videoInitPromise = new Promise((resolve) => {
        const query = wx.createSelectorQuery().in(this);
        query
          .select('#previewVideo')
          .fields({ node: true, size: true })
          .exec((res) => {
            const videoRef = res && res[0];
            if (videoRef && videoRef.node) {
              this.videoNode = videoRef.node;
            } else {
              console.warn('未能获取 video 节点，可能无法自动抽帧');
            }
            this.videoContext = wx.createVideoContext('previewVideo', this);
            this.setData({ videoReady: true });
            resolve();
          });
      }).catch((err) => {
        this.videoInitPromise = null;
        throw err;
      });
    }

    return this.videoInitPromise;
  },

  chooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: async (res) => {
        if (!res.tempFiles || !res.tempFiles.length) {
          return;
        }
        const file = res.tempFiles[0];
        const duration = Number(file.duration || 0);
        const durationText = duration ? duration.toFixed(1) : '0.0';

        this.videoNode = null;
        this.videoContext = null;
        this.videoInitPromise = null;

        this.setData({
          videoPath: file.tempFilePath,
          duration,
          durationText,
          frameCandidates: [],
          selectedCount: 0,
          analyzingProgress: 0,
          autoSelecting: false,
          videoInfo: {
            width: file.width,
            height: file.height,
            size: file.size,
            thumb: file.thumbTempFilePath
          }
        });

        this.currentTime = 0;

        this.videoContext = wx.createVideoContext('previewVideo', this);

        wx.getVideoInfo({
          src: file.tempFilePath,
          success: (info) => {
            const durationFromInfo = Number(info.duration || duration);
            this.setData({
              duration: durationFromInfo,
              durationText: durationFromInfo ? durationFromInfo.toFixed(1) : durationText,
              videoInfo: {
                width: info.width,
                height: info.height,
                fps: info.fps,
                bitrate: info.bitrate,
                duration: info.duration
              }
            });
          },
          fail: () => {}
        });

        setTimeout(() => {
          this.initVideoNode().catch((error) => {
            console.warn('初始化 video 节点失败', error);
          });
        }, 200);
      },
      fail: (error) => {
        if (error && error.errMsg) {
          wx.showToast({ title: '选择视频取消', icon: 'none' });
        } else {
          wx.showToast({ title: '选择视频失败', icon: 'error' });
        }
      }
    });
  },

  async ensureResourcesReady() {
    await this.initCanvas();
    await this.initVideoNode();

    if (!this.videoNode) {
      throw new Error('无法访问视频节点，请升级基础库到 2.9.0 以上');
    }
  },

  onVideoReady() {
    if (!this.videoContext) {
      this.videoContext = wx.createVideoContext('previewVideo', this);
    }
    this.initVideoNode().catch(() => {});
  },

  onTimeUpdate(e) {
    this.currentTime = e.detail.currentTime || 0;
  },

  onSampleCountChange(e) {
    const value = Number(e.detail.value) || 6;
    const sampleFrameCount = Math.max(6, Math.min(value, 60));
    const topK = Math.min(this.data.topK, sampleFrameCount);
    this.setData({ sampleFrameCount, topK });
  },

  onTopKChange(e) {
    const value = Number(e.detail.value) || 1;
    const topK = Math.max(1, Math.min(value, this.data.sampleFrameCount));
    this.setData({ topK });
  },

  async autoSelectCovers() {
    if (!this.data.videoPath) {
      wx.showToast({ title: '请先选择视频', icon: 'none' });
      return;
    }

    try {
      await this.ensureResourcesReady();
    } catch (error) {
      wx.showModal({
        title: '无法自动抽帧',
        content: error.message || '当前设备不支持自动抽帧，请手动捕捉封面',
        showCancel: false
      });
      return;
    }

    this.setData({ autoSelecting: true, analyzingProgress: 0 });

    const duration = Math.max(this.data.duration, 1);
    const frameCount = Math.max(6, Math.min(this.data.sampleFrameCount, 60));
    const step = duration / frameCount;
    const autoCandidates = [];
    let previousImageData = null;

    for (let i = 0; i < frameCount; i += 1) {
      const targetTime = Math.min(
        Math.max(step * i + step / 2, 0.1),
        Math.max(duration - 0.1, 0.1)
      );
      try {
        const capture = await this.captureFrameAt(targetTime);
        if (!capture || !capture.imageData) {
          continue;
        }

        const diff = previousImageData
          ? FrameAnalyzer.frameDifference(capture.imageData, previousImageData)
          : 1;
        previousImageData = capture.imageData;

        if (i !== 0 && diff < 0.08) {
          continue;
        }

        const analysis = FrameAnalyzer.scoreFrame(capture.imageData);
        autoCandidates.push({
          id: `auto-${Date.now()}-${i}`,
          time: targetTime,
          timeText: targetTime.toFixed(1),
          thumb: capture.tempPath,
          score: analysis.score,
          scoreText: analysis.score.toFixed(2),
          stats: analysis.stats,
          selected: false,
          source: 'auto'
        });
      } catch (error) {
        console.warn('捕捉帧失败', error);
      }

      const progress = Math.round(((i + 1) / frameCount) * 100);
      this.setData({ analyzingProgress: progress });
    }

    const manualFrames = this.data.frameCandidates.filter((item) => item.source === 'manual');
    const manualSelectedCount = manualFrames.filter((item) => item.selected).length;

    autoCandidates.sort((a, b) => b.score - a.score);

    const availableSlots = Math.max(this.data.topK - manualSelectedCount, 0);
    autoCandidates.forEach((item, index) => {
      item.selected = index < availableSlots;
    });

    const merged = [...manualFrames, ...autoCandidates];
    merged.sort((a, b) => Number(b.selected) - Number(a.selected) || b.score - a.score);

    this.setData({
      frameCandidates: merged,
      autoSelecting: false,
      analyzingProgress: 100
    });
    this.updateSelectedCount();

    if (merged.length === 0) {
      wx.showToast({ title: '未能抽取有效封面', icon: 'none' });
    } else {
      wx.showToast({ title: '自动挑选完成', icon: 'success' });
    }
  },

  captureFrameAt(time) {
    return new Promise((resolve, reject) => {
      if (!this.videoContext || !this.videoNode || !this.canvasCtx) {
        reject(new Error('资源未就绪'));
        return;
      }

      const task = {
        time: Math.max(0, Math.min(time, Math.max(this.data.duration - 0.05, 0))),
        resolve,
        reject,
        attempts: 0
      };

      this.seekQueue.push(task);
      if (!this.isProcessingSeek) {
        this.processSeekQueue();
      }
    });
  },

  processSeekQueue() {
    if (!this.seekQueue.length) {
      this.isProcessingSeek = false;
      return;
    }

    this.isProcessingSeek = true;
    const task = this.seekQueue.shift();

    const attemptSeek = () => {
      if (!this.videoContext) {
        task.reject(new Error('视频上下文缺失'));
        this.isProcessingSeek = false;
        this.processSeekQueue();
        return;
      }

      this.videoContext.pause();
      this.videoContext.seek(task.time);

      setTimeout(async () => {
        try {
          const frame = await this.drawAndExportFrame(task.time);
          this.isProcessingSeek = false;
          task.resolve(frame);
          this.processSeekQueue();
        } catch (error) {
          if (task.attempts < 3) {
            task.attempts += 1;
            setTimeout(attemptSeek, 120);
          } else {
            this.isProcessingSeek = false;
            task.reject(error);
            this.processSeekQueue();
          }
        }
      }, 320);
    };

    attemptSeek();
  },

  drawAndExportFrame(time) {
    return new Promise((resolve, reject) => {
      try {
        const drawWidth = this.canvasWidthPx || 320;
        const drawHeight = this.canvasHeightPx || 180;
        this.canvasCtx.clearRect(0, 0, drawWidth, drawHeight);
        this.canvasCtx.drawImage(this.videoNode, 0, 0, drawWidth, drawHeight);
      } catch (error) {
        reject(error);
        return;
      }

      wx.canvasToTempFilePath(
        {
          canvas: this.canvas,
          width: this.canvasWidthPx,
          height: this.canvasHeightPx,
          destWidth: this.canvasPixelWidth,
          destHeight: this.canvasPixelHeight,
          fileType: 'jpg',
          quality: 0.9,
          success: (res) => {
            let imageData = null;
            try {
              const captureWidth = Math.round(this.canvasWidthPx);
              const captureHeight = Math.round(this.canvasHeightPx);
              imageData = this.canvasCtx.getImageData(0, 0, captureWidth, captureHeight);
            } catch (err) {
              console.warn('读取图像数据失败', err);
            }
            resolve({ tempPath: res.tempFilePath, imageData, time });
          },
          fail: reject
        },
        this
      );
    });
  },

  toggleFrameSelection(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      return;
    }

    const updated = this.data.frameCandidates.map((item) => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    this.setData({ frameCandidates: updated });
    this.updateSelectedCount();
  },

  updateSelectedCount() {
    const selectedCount = this.data.frameCandidates.filter((item) => item.selected).length;
    this.setData({ selectedCount });
  },

  previewSelected() {
    const selected = this.data.frameCandidates.filter((item) => item.selected);
    if (!selected.length) {
      wx.showToast({ title: '尚未选择封面', icon: 'none' });
      return;
    }
    wx.previewImage({
      urls: selected.map((item) => item.thumb),
      current: selected[0].thumb
    });
  },

  async saveSelectedToAlbum() {
    const selected = this.data.frameCandidates.filter((item) => item.selected);
    if (!selected.length) {
      wx.showToast({ title: '尚未选择封面', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: `保存中 0/${selected.length}` });

    try {
      for (let i = 0; i < selected.length; i += 1) {
        const path = selected[i].thumb;
        wx.showLoading({ title: `保存中 ${i + 1}/${selected.length}` });
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          wx.saveImageToPhotosAlbum({
            filePath: path,
            success: resolve,
            fail: reject
          });
        });
      }
      wx.hideLoading();
      wx.showToast({ title: '已保存至相册', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      if (error && typeof error.errMsg === 'string' && error.errMsg.includes('auth')) {
        wx.showModal({
          title: '需要授权',
          content: '请在设置中开启“保存到相册”权限后重试',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      } else {
        wx.showToast({ title: '保存失败', icon: 'error' });
      }
    } finally {
      this.setData({ saving: false });
    }
  },

  async captureCurrentFrame() {
    if (!this.data.videoPath) {
      wx.showToast({ title: '请先选择视频', icon: 'none' });
      return;
    }

    try {
      await this.ensureResourcesReady();
    } catch (error) {
      wx.showToast({ title: '当前设备不支持捕捉', icon: 'none' });
      return;
    }

    this.setData({ captureInProgress: true });
    const targetTime = this.currentTime || 0;

    try {
      const capture = await this.captureFrameAt(targetTime);
      if (!capture || !capture.imageData) {
        wx.showToast({ title: '捕捉失败', icon: 'none' });
        return;
      }

      const analysis = FrameAnalyzer.scoreFrame(capture.imageData);
      const candidate = {
        id: `manual-${Date.now()}-${Math.round(targetTime * 1000)}`,
        time: targetTime,
        timeText: targetTime.toFixed(1),
        thumb: capture.tempPath,
        score: analysis.score,
        scoreText: analysis.score.toFixed(2),
        stats: analysis.stats,
        selected: true,
        source: 'manual'
      };

      const others = this.data.frameCandidates.filter((item) => item.id !== candidate.id);
      others.push(candidate);
      others.sort((a, b) => Number(b.selected) - Number(a.selected) || b.score - a.score);

      this.setData({ frameCandidates: others });
      this.updateSelectedCount();
      wx.showToast({ title: '已添加当前帧', icon: 'success' });
    } catch (error) {
      console.warn('捕捉当前帧失败', error);
      wx.showToast({ title: '捕捉失败', icon: 'none' });
    } finally {
      this.setData({ captureInProgress: false });
    }
  },

  resetCandidates() {
    this.setData({ frameCandidates: [], selectedCount: 0, analyzingProgress: 0 });
    wx.showToast({ title: '已清空候选', icon: 'none' });
  }
});
