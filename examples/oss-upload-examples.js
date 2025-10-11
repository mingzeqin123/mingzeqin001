const OSSUploader = require('../utils/ossUploader')

// OSS上传工具使用示例

// 1. 基本配置示例
function createUploaderExample() {
  const ossConfig = {
    region: 'oss-cn-beijing', // 你的OSS区域
    accessKeyId: 'your-access-key-id', // 你的AccessKey ID
    accessKeySecret: 'your-access-key-secret', // 你的AccessKey Secret
    bucket: 'your-bucket-name' // 你的存储桶名称
  }
  
  return new OSSUploader(ossConfig)
}

// 2. 单文件上传示例
async function singleFileUploadExample() {
  const uploader = createUploaderExample()
  
  try {
    // 添加单个文件
    uploader.addFiles('./images/demo.jpg')
    
    // 开始上传
    const result = await uploader.startUpload()
    
    console.log('单文件上传完成:', result)
    
    // 获取上传后的URL
    const uploadedFile = result.files[0]
    if (uploadedFile.status === 'success') {
      console.log('文件访问URL:', uploadedFile.url)
    }
    
  } catch (error) {
    console.error('单文件上传失败:', error.message)
  }
}

// 3. 批量文件上传示例
async function batchFilesUploadExample() {
  const uploader = createUploaderExample()
  
  try {
    // 准备要上传的文件列表
    const files = [
      './images/photo1.jpg',
      './images/photo2.png', 
      './documents/report.pdf',
      './videos/demo.mp4',
      './sounds/music.mp3'
    ]
    
    // 添加文件到上传队列
    uploader.addFiles(files, {
      prefix: 'uploads/batch', // OSS路径前缀
      useCategory: true, // 按文件类型分类
      useDate: true // 按日期分类
    })
    
    // 带进度监控的上传
    console.log('开始批量上传...')
    
    const result = await uploader.startUpload(
      // 进度回调
      (progress) => {
        console.log(`📤 上传进度: ${progress.progress}%`)
        console.log(`   已完成: ${progress.completed}/${progress.total}`)
        console.log(`   成功: ${progress.succeeded}, 失败: ${progress.failed}`)
        console.log('---')
      },
      // 完成回调
      (result) => {
        console.log('✅ 批量上传完成!')
        console.log(`   总计: ${result.total}, 成功: ${result.succeeded}, 失败: ${result.failed}`)
      }
    )
    
    // 处理结果
    result.files.forEach(file => {
      if (file.status === 'success') {
        console.log(`✅ ${file.filePath} -> ${file.objectKey}`)
      } else {
        console.log(`❌ ${file.filePath}: ${file.error}`)
      }
    })
    
  } catch (error) {
    console.error('批量上传失败:', error.message)
  }
}

// 4. 目录上传示例
async function directoryUploadExample() {
  const uploader = createUploaderExample()
  
  try {
    // 上传整个目录
    uploader.addDirectory('./assets', {
      recursive: true, // 递归扫描子目录
      includePattern: /\.(jpg|jpeg|png|gif|pdf|mp4|mp3|txt)$/i, // 只上传这些类型
      excludePattern: /(node_modules|\.git|\.DS_Store)/i, // 排除这些
      maxSize: 50 * 1024 * 1024, // 最大50MB
      prefix: 'website-assets',
      useCategory: true,
      useDate: false // 不按日期分类
    })
    
    // 设置并发数
    uploader.setConcurrency(5)
    
    console.log('目录扫描完成，队列状态:')
    console.log(uploader.getQueueStatus())
    
    // 开始上传
    const result = await uploader.startUpload(
      (progress) => {
        // 每10%显示一次进度
        if (progress.completed % Math.max(1, Math.floor(progress.total / 10)) === 0) {
          console.log(`📁 目录上传进度: ${progress.progress}%`)
        }
      }
    )
    
    console.log('目录上传完成:', result)
    
  } catch (error) {
    console.error('目录上传失败:', error.message)
  }
}

// 5. 自定义配置示例
async function customConfigExample() {
  const uploader = createUploaderExample()
  
  try {
    const files = ['./demo1.jpg', './demo2.pdf']
    
    // 使用自定义键生成器
    uploader.addFiles(files, {
      customKeyGenerator: (fileInfo) => {
        // 自定义文件路径规则
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
        const category = fileInfo.category
        const originalName = fileInfo.basename.replace(/\s+/g, '_') // 替换空格
        
        return `custom/${category}/${timestamp}_${originalName}`
      }
    })
    
    const result = await uploader.startUpload()
    console.log('自定义配置上传完成:', result)
    
  } catch (error) {
    console.error('自定义配置上传失败:', error.message)
  }
}

// 6. 文件类型检测示例
function fileTypeDetectionExample() {
  const uploader = createUploaderExample()
  
  const testFiles = [
    './test.jpg',
    './document.pdf', 
    './video.mp4',
    './music.mp3',
    './data.json',
    './archive.zip'
  ]
  
  console.log('文件类型检测结果:')
  testFiles.forEach(filePath => {
    const fileInfo = uploader.detectFileType(filePath)
    console.log(`${filePath}:`)
    console.log(`  类型: ${fileInfo.mimeType}`)
    console.log(`  分类: ${fileInfo.category}`)
    console.log(`  扩展名: ${fileInfo.ext}`)
    console.log('---')
  })
}

// 7. 错误处理和重试示例
async function errorHandlingExample() {
  const uploader = createUploaderExample()
  
  try {
    // 添加一些可能失败的文件（包括不存在的文件）
    uploader.addFiles([
      './existing-file.jpg',
      './non-existent-file.txt', // 不存在的文件
      './large-file.zip' // 可能超时的大文件
    ])
    
    // 设置重试参数
    uploader.retryLimit = 5 // 增加重试次数
    
    const result = await uploader.startUpload(
      (progress) => {
        console.log(`进度: ${progress.progress}% (成功:${progress.succeeded}, 失败:${progress.failed})`)
      }
    )
    
    // 分析结果
    console.log('\n上传结果分析:')
    console.log(`总文件数: ${result.total}`)
    console.log(`成功上传: ${result.succeeded}`)
    console.log(`上传失败: ${result.failed}`)
    
    if (result.failed > 0) {
      console.log('\n失败文件详情:')
      result.files
        .filter(f => f.status === 'failed')
        .forEach(f => {
          console.log(`❌ ${f.filePath}: ${f.error}`)
        })
    }
    
  } catch (error) {
    console.error('上传过程出错:', error.message)
  }
}

// 8. 实用工具函数
class UploadUtils {
  // 格式化文件大小
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // 计算上传速度
  static calculateSpeed(uploadedBytes, startTime) {
    const duration = (Date.now() - startTime) / 1000 // 秒
    const speed = uploadedBytes / duration // 字节/秒
    return this.formatFileSize(speed) + '/s'
  }
  
  // 预估剩余时间
  static estimateRemainingTime(progress, startTime) {
    if (progress.completed === 0) return '计算中...'
    
    const elapsed = (Date.now() - startTime) / 1000
    const avgTimePerFile = elapsed / progress.completed
    const remaining = (progress.total - progress.completed) * avgTimePerFile
    
    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)
    
    return `${minutes}分${seconds}秒`
  }
}

// 9. 完整的上传监控示例
async function fullMonitoringExample() {
  const uploader = createUploaderExample()
  const startTime = Date.now()
  let uploadedBytes = 0
  
  try {
    // 添加文件
    uploader.addDirectory('./test-files', {
      recursive: true,
      maxSize: 100 * 1024 * 1024 // 100MB限制
    })
    
    const queueStatus = uploader.getQueueStatus()
    const totalSize = queueStatus.files.reduce((sum, f) => sum + f.size, 0)
    
    console.log(`📋 准备上传 ${queueStatus.total} 个文件，总大小: ${UploadUtils.formatFileSize(totalSize)}`)
    
    const result = await uploader.startUpload(
      (progress) => {
        // 计算已上传字节数（估算）
        const avgFileSize = totalSize / progress.total
        uploadedBytes = progress.completed * avgFileSize
        
        console.clear() // 清屏显示最新进度
        console.log('📤 OSS批量上传进度监控')
        console.log('=' * 50)
        console.log(`进度: ${progress.progress}%`)
        console.log(`文件: ${progress.completed}/${progress.total}`)
        console.log(`成功: ${progress.succeeded}`)
        console.log(`失败: ${progress.failed}`) 
        console.log(`速度: ${UploadUtils.calculateSpeed(uploadedBytes, startTime)}`)
        console.log(`剩余: ${UploadUtils.estimateRemainingTime(progress, startTime)}`)
        
        // 进度条
        const barLength = 30
        const filledLength = Math.floor((progress.progress / 100) * barLength)
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength)
        console.log(`[${bar}] ${progress.progress}%`)
      },
      
      (result) => {
        const duration = (Date.now() - startTime) / 1000
        console.log('\n✅ 上传完成!')
        console.log(`总耗时: ${Math.floor(duration / 60)}分${Math.floor(duration % 60)}秒`)
        console.log(`平均速度: ${UploadUtils.formatFileSize(totalSize / duration)}/s`)
      }
    )
    
    return result
    
  } catch (error) {
    console.error('监控上传失败:', error.message)
  }
}

// 导出示例函数
module.exports = {
  createUploaderExample,
  singleFileUploadExample,
  batchFilesUploadExample, 
  directoryUploadExample,
  customConfigExample,
  fileTypeDetectionExample,
  errorHandlingExample,
  fullMonitoringExample,
  UploadUtils
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  console.log('🚀 OSS批量上传工具示例')
  console.log('请根据需要取消注释并运行相应示例:')
  console.log()
  
  // 取消注释运行相应示例
  // singleFileUploadExample()
  // batchFilesUploadExample()
  // directoryUploadExample()
  // customConfigExample()
  // fileTypeDetectionExample()
  // errorHandlingExample()
  // fullMonitoringExample()
}