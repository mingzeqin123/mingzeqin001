const OSS = require('ali-oss');
const logger = require('../utils/logger');

class OSSService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    try {
      this.client = new OSS({
        region: process.env.OSS_REGION || 'oss-cn-hangzhou',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET
      });
      
      logger.info('OSS客户端初始化成功');
    } catch (error) {
      logger.error('OSS客户端初始化失败:', error);
      throw error;
    }
  }

  /**
   * 上传文件到OSS
   * @param {string} objectName OSS对象名称
   * @param {string|Buffer} content 文件内容
   * @param {Object} options 上传选项
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(objectName, content, options = {}) {
    try {
      const result = await this.client.put(objectName, content, {
        headers: {
          'Content-Type': options.contentType || 'application/octet-stream',
          'Cache-Control': options.cacheControl || 'no-cache'
        }
      });
      
      logger.info(`文件上传成功: ${objectName}`);
      return result;
    } catch (error) {
      logger.error(`文件上传失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 上传Excel文件到OSS
   * @param {string} objectName OSS对象名称
   * @param {Buffer} buffer Excel文件缓冲区
   * @returns {Promise<Object>} 上传结果
   */
  async uploadExcel(objectName, buffer) {
    return await this.uploadFile(objectName, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /**
   * 上传JSON文件到OSS
   * @param {string} objectName OSS对象名称
   * @param {Object} data JSON数据
   * @returns {Promise<Object>} 上传结果
   */
  async uploadJson(objectName, data) {
    const content = JSON.stringify(data, null, 2);
    return await this.uploadFile(objectName, content, {
      contentType: 'application/json'
    });
  }

  /**
   * 检查文件是否存在
   * @param {string} objectName OSS对象名称
   * @returns {Promise<boolean>} 文件是否存在
   */
  async fileExists(objectName) {
    try {
      await this.client.head(objectName);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} objectName OSS对象名称
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFile(objectName) {
    try {
      const result = await this.client.delete(objectName);
      logger.info(`文件删除成功: ${objectName}`);
      return result;
    } catch (error) {
      logger.error(`文件删除失败: ${objectName}`, error);
      throw error;
    }
  }
}

module.exports = new OSSService();