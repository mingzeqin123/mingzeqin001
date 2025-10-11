// OSS批量上传工具
// 支持自动文件类型识别和批量上传

const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

class OSSUploader {
  constructor(config) {
    this.client = new OSS(config)
    this.uploadQueue = []
    this.isUploading = false
    this.concurrency = 3 // 并发上传数量
    this.retryLimit = 3 // 重试次数
    
    // 支持的文件类型映射
    this.mimeTypeMap = {
      // 图片类型
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      
      // 音频类型
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      
      // 视频类型
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      
      // 文档类型
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      
      // 压缩文件
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      
      // 代码文件
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
      
      // 其他常用格式
      '.exe': 'application/octet-stream',
      '.dmg': 'application/x-apple-diskimage',
      '.apk': 'application/vnd.android.package-archive'
    }
  }
  
  /**
   * 自动识别文件类型
   * @param {string} filePath 文件路径
   * @returns {object} 文件信息对象
   */
  detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const basename = path.basename(filePath)
    
    // 尝试从自定义映射中获取MIME类型
    let mimeType = this.mimeTypeMap[ext]
    
    // 如果自定义映射中没有，使用mime-types库
    if (!mimeType) {
      mimeType = mime.lookup(filePath) || 'application/octet-stream'
    }
    
    // 根据MIME类型确定文件分类
    let category = 'other'
    if (mimeType.startsWith('image/')) {
      category = 'image'
    } else if (mimeType.startsWith('audio/')) {
      category = 'audio'  
    } else if (mimeType.startsWith('video/')) {
      category = 'video'
    } else if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType === 'application/pdf') {
      category = 'document'
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('compressed')) {
      category = 'archive'
    }
    
    return {
      filePath,
      basename,
      ext,
      mimeType,
      category,
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
    }
  }
  
  /**
   * 生成OSS对象键（路径）
   * @param {object} fileInfo 文件信息
   * @param {object} options 选项
   * @returns {string} OSS对象键
   */
  generateObjectKey(fileInfo, options = {}) {
    const { 
      prefix = '',
      useCategory = true,
      useDate = true,
      preserveStructure = false,
      customKeyGenerator = null
    } = options
    
    // 如果提供了自定义键生成器
    if (customKeyGenerator && typeof customKeyGenerator === 'function') {
      return customKeyGenerator(fileInfo)
    }
    
    let keyParts = []
    
    // 添加前缀
    if (prefix) {
      keyParts.push(prefix.replace(/^\/|\/$/g, ''))
    }
    
    // 添加分类目录
    if (useCategory) {
      keyParts.push(fileInfo.category)
    }
    
    // 添加日期目录
    if (useDate) {
      const now = new Date()
      const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      keyParts.push(dateStr)
    }
    
    // 保持原有目录结构
    if (preserveStructure) {
      const dir = path.dirname(fileInfo.filePath)
      if (dir && dir !== '.') {
        keyParts.push(dir.replace(/\\/g, '/'))
      }
    }
    
    // 生成唯一文件名（避免重名冲突）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substr(2, 8)
    const nameWithoutExt = path.basename(fileInfo.basename, fileInfo.ext)
    const finalName = `${nameWithoutExt}_${timestamp}_${randomStr}${fileInfo.ext}`
    
    keyParts.push(finalName)
    
    return keyParts.join('/')
  }
  
  /**
   * 添加文件到上传队列
   * @param {string|Array} files 文件路径或文件路径数组
   * @param {object} options 上传选项
   */
  addFiles(files, options = {}) {
    const fileArray = Array.isArray(files) ? files : [files]
    
    fileArray.forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        console.warn(`文件不存在: ${filePath}`)
        return
      }
      
      const fileInfo = this.detectFileType(filePath)
      const objectKey = this.generateObjectKey(fileInfo, options)
      
      this.uploadQueue.push({
        ...fileInfo,
        objectKey,
        options,
        status: 'pending',
        retryCount: 0
      })
    })
    
    console.log(`已添加 ${fileArray.length} 个文件到上传队列`)
  }
  
  /**
   * 批量添加目录中的文件
   * @param {string} dirPath 目录路径
   * @param {object} options 选项
   */
  addDirectory(dirPath, options = {}) {
    const {
      recursive = true,
      includePattern = null,
      excludePattern = null,
      maxSize = null // 最大文件大小（字节）
    } = options
    
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`目录不存在或不是有效目录: ${dirPath}`)
    }
    
    const files = this._scanDirectory(dirPath, recursive, includePattern, excludePattern, maxSize)
    this.addFiles(files, options)
  }
  
  /**
   * 扫描目录获取文件列表
   * @param {string} dirPath 目录路径
   * @param {boolean} recursive 是否递归
   * @param {RegExp} includePattern 包含模式
   * @param {RegExp} excludePattern 排除模式
   * @param {number} maxSize 最大文件大小
   * @returns {Array} 文件路径数组
   */
  _scanDirectory(dirPath, recursive, includePattern, excludePattern, maxSize) {
    const files = []
    const items = fs.readdirSync(dirPath)
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && recursive) {
        files.push(...this._scanDirectory(fullPath, recursive, includePattern, excludePattern, maxSize))
      } else if (stat.isFile()) {
        // 检查文件大小
        if (maxSize && stat.size > maxSize) {
          return
        }
        
        // 检查包含模式
        if (includePattern && !includePattern.test(item)) {
          return
        }
        
        // 检查排除模式
        if (excludePattern && excludePattern.test(item)) {
          return
        }
        
        files.push(fullPath)
      }
    })
    
    return files
  }
  
  /**
   * 开始批量上传
   * @param {function} progressCallback 进度回调函数
   * @param {function} completeCallback 完成回调函数
   * @returns {Promise} 上传结果
   */
  async startUpload(progressCallback = null, completeCallback = null) {
    if (this.isUploading) {
      throw new Error('上传正在进行中，请等待完成')
    }
    
    if (this.uploadQueue.length === 0) {
      throw new Error('上传队列为空')
    }
    
    this.isUploading = true
    const total = this.uploadQueue.length
    let completed = 0
    let failed = 0
    let succeeded = 0
    
    console.log(`开始批量上传，共 ${total} 个文件`)
    
    try {
      // 创建并发上传池
      const uploadPromises = []
      const semaphore = new Semaphore(this.concurrency)
      
      for (const fileItem of this.uploadQueue) {
        const uploadPromise = semaphore.acquire().then(async () => {
          try {
            const result = await this._uploadSingleFile(fileItem)
            fileItem.status = 'success'
            fileItem.result = result
            succeeded++
          } catch (error) {
            fileItem.status = 'failed'
            fileItem.error = error
            failed++
            console.error(`上传失败: ${fileItem.filePath}`, error.message)
          } finally {
            completed++
            
            // 调用进度回调
            if (progressCallback) {
              progressCallback({
                total,
                completed,
                succeeded,
                failed,
                progress: (completed / total * 100).toFixed(2)
              })
            }
            
            semaphore.release()
          }
        })
        
        uploadPromises.push(uploadPromise)
      }
      
      // 等待所有上传完成
      await Promise.all(uploadPromises)
      
      const result = {
        total,
        succeeded,
        failed,
        files: this.uploadQueue.map(item => ({
          filePath: item.filePath,
          objectKey: item.objectKey,
          status: item.status,
          error: item.error?.message,
          url: item.result?.url
        }))
      }
      
      // 调用完成回调
      if (completeCallback) {
        completeCallback(result)
      }
      
      // 清空队列
      this.uploadQueue = []
      
      console.log(`批量上传完成: 成功 ${succeeded}, 失败 ${failed}`)
      return result
      
    } finally {
      this.isUploading = false
    }
  }
  
  /**
   * 上传单个文件
   * @param {object} fileItem 文件项目
   * @returns {Promise} 上传结果
   */
  async _uploadSingleFile(fileItem) {
    let lastError = null
    
    // 重试机制
    for (let i = 0; i <= this.retryLimit; i++) {
      try {
        console.log(`上传文件: ${fileItem.filePath} -> ${fileItem.objectKey}`)
        
        const result = await this.client.put(fileItem.objectKey, fileItem.filePath, {
          headers: {
            'Content-Type': fileItem.mimeType
          }
        })
        
        return result
        
      } catch (error) {
        lastError = error
        fileItem.retryCount = i + 1
        
        if (i < this.retryLimit) {
          console.warn(`上传失败，准备重试 (${i + 1}/${this.retryLimit}): ${fileItem.filePath}`)
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
    }
    
    throw lastError
  }
  
  /**
   * 获取队列状态
   * @returns {object} 队列状态
   */
  getQueueStatus() {
    return {
      total: this.uploadQueue.length,
      pending: this.uploadQueue.filter(item => item.status === 'pending').length,
      uploading: this.isUploading,
      files: this.uploadQueue.map(item => ({
        filePath: item.filePath,
        objectKey: item.objectKey,
        category: item.category,
        size: item.size,
        status: item.status
      }))
    }
  }
  
  /**
   * 清空上传队列
   */
  clearQueue() {
    if (this.isUploading) {
      throw new Error('上传正在进行中，无法清空队列')
    }
    this.uploadQueue = []
  }
  
  /**
   * 设置并发数
   * @param {number} concurrency 并发数
   */
  setConcurrency(concurrency) {
    this.concurrency = Math.max(1, Math.min(concurrency, 10))
  }
}

// 信号量类，用于控制并发
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
    this.currentConcurrency = 0
    this.queue = []
  }
  
  async acquire() {
    return new Promise((resolve) => {
      if (this.currentConcurrency < this.maxConcurrency) {
        this.currentConcurrency++
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }
  
  release() {
    this.currentConcurrency--
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      this.currentConcurrency++
      next()
    }
  }
}

module.exports = OSSUploader