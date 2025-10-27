const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class OSSService {
  constructor(logger) {
    this.logger = logger;
    this.client = null;
    this.init();
  }

  init() {
    try {
      this.client = new OSS({
        region: process.env.OSS_REGION,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET
      });
      this.logger.info('OSS客户端初始化成功');
    } catch (error) {
      this.logger.error('OSS客户端初始化失败:', error);
      throw error;
    }
  }

  async uploadFile(localFilePath, remotePath) {
    try {
      const result = await this.client.put(remotePath, localFilePath);
      this.logger.info(`文件上传成功: ${localFilePath} -> ${remotePath}`);
      return result;
    } catch (error) {
      this.logger.error('文件上传失败:', { localFilePath, remotePath, error: error.message });
      throw error;
    }
  }

  async uploadBuffer(buffer, remotePath, contentType = 'application/json') {
    try {
      const result = await this.client.put(remotePath, buffer, {
        headers: {
          'Content-Type': contentType
        }
      });
      this.logger.info(`缓冲区上传成功: ${remotePath}`);
      return result;
    } catch (error) {
      this.logger.error('缓冲区上传失败:', { remotePath, error: error.message });
      throw error;
    }
  }

  async uploadJSON(data, remotePath) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonString, 'utf8');
      return await this.uploadBuffer(buffer, remotePath, 'application/json');
    } catch (error) {
      this.logger.error('JSON上传失败:', { remotePath, error: error.message });
      throw error;
    }
  }

  async uploadCSV(csvData, remotePath) {
    try {
      const buffer = Buffer.from(csvData, 'utf8');
      return await this.uploadBuffer(buffer, remotePath, 'text/csv');
    } catch (error) {
      this.logger.error('CSV上传失败:', { remotePath, error: error.message });
      throw error;
    }
  }

  async uploadExcel(excelBuffer, remotePath) {
    try {
      return await this.uploadBuffer(excelBuffer, remotePath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) {
      this.logger.error('Excel上传失败:', { remotePath, error: error.message });
      throw error;
    }
  }

  generateRemotePath(tableName, format = 'json', timestamp = null) {
    const now = timestamp || moment();
    const dateStr = now.format('YYYY/MM/DD');
    const timeStr = now.format('HH-mm-ss');
    const fileName = `${tableName}_${now.format('YYYYMMDD_HHmmss')}.${format}`;
    return `data-aggregation/${dateStr}/${fileName}`;
  }

  async listFiles(prefix = 'data-aggregation/', maxKeys = 100) {
    try {
      const result = await this.client.list({
        prefix,
        'max-keys': maxKeys
      });
      return result.objects || [];
    } catch (error) {
      this.logger.error('列出文件失败:', { prefix, error: error.message });
      throw error;
    }
  }

  async deleteFile(remotePath) {
    try {
      await this.client.delete(remotePath);
      this.logger.info(`文件删除成功: ${remotePath}`);
    } catch (error) {
      this.logger.error('文件删除失败:', { remotePath, error: error.message });
      throw error;
    }
  }

  async getFileUrl(remotePath, expires = 3600) {
    try {
      const url = this.client.signatureUrl(remotePath, { expires });
      return url;
    } catch (error) {
      this.logger.error('获取文件URL失败:', { remotePath, error: error.message });
      throw error;
    }
  }
}

module.exports = OSSService;