/**
 * 水印功能使用示例
 */
const WatermarkUtil = require('../utils/watermark.js');

// 示例1: 添加简单文字水印
async function example1() {
  try {
    const imagePath = '/path/to/your/image.jpg';
    const result = await WatermarkUtil.addTextWatermark(imagePath, {
      text: '© 2024 我的水印',
      position: 'bottom-right',
      fontSize: 24,
      color: '#FFFFFF',
      opacity: 0.8
    });
    
    console.log('文字水印添加成功:', result);
    return result;
  } catch (error) {
    console.error('添加文字水印失败:', error);
  }
}

// 示例2: 添加自定义位置的文字水印
async function example2() {
  try {
    const imagePath = '/path/to/your/image.jpg';
    const result = await WatermarkUtil.addTextWatermark(imagePath, {
      text: '自定义位置水印',
      x: 0.1, // 左边距为图片宽度的10%
      y: 0.9, // 上边距为图片高度的90%
      fontSize: 20,
      color: '#FF0000',
      opacity: 0.7
    });
    
    console.log('自定义位置文字水印添加成功:', result);
    return result;
  } catch (error) {
    console.error('添加自定义文字水印失败:', error);
  }
}

// 示例3: 添加图片水印
async function example3() {
  try {
    const imagePath = '/path/to/your/image.jpg';
    const watermarkPath = '/path/to/your/watermark.png';
    
    const result = await WatermarkUtil.addImageWatermark(imagePath, watermarkPath, {
      position: 'top-right',
      width: 100,
      height: 100,
      opacity: 0.6
    });
    
    console.log('图片水印添加成功:', result);
    return result;
  } catch (error) {
    console.error('添加图片水印失败:', error);
  }
}

// 示例4: 批量添加水印
async function example4() {
  try {
    const imagePaths = [
      '/path/to/image1.jpg',
      '/path/to/image2.jpg',
      '/path/to/image3.jpg'
    ];
    
    const watermarkConfig = {
      type: 'text',
      text: '批量水印',
      position: 'bottom-right',
      fontSize: 22,
      color: '#FFFFFF',
      opacity: 0.8
    };
    
    const results = await WatermarkUtil.batchAddWatermark(
      imagePaths,
      watermarkConfig,
      (progress) => {
        console.log(`处理进度: ${progress.completed}/${progress.total} (${Math.round(progress.progress * 100)}%)`);
      }
    );
    
    console.log('批量处理完成:', results);
    return results;
  } catch (error) {
    console.error('批量处理失败:', error);
  }
}

// 示例5: 在小程序页面中使用
function exampleInPage() {
  // 在页面的methods中
  const pageExample = {
    data: {
      selectedImage: '',
      watermarkedImage: ''
    },

    // 选择图片
    selectImage() {
      wx.chooseImage({
        count: 1,
        success: (res) => {
          this.setData({
            selectedImage: res.tempFilePaths[0]
          });
        }
      });
    },

    // 添加水印
    async addWatermark() {
      if (!this.data.selectedImage) {
        wx.showToast({
          title: '请先选择图片',
          icon: 'error'
        });
        return;
      }

      wx.showLoading({
        title: '添加水印中...'
      });

      try {
        const result = await WatermarkUtil.addTextWatermark(this.data.selectedImage, {
          text: '我的水印',
          position: 'bottom-right',
          fontSize: 20,
          color: '#FFFFFF',
          opacity: 0.8
        });

        this.setData({
          watermarkedImage: result
        });

        wx.hideLoading();
        wx.showToast({
          title: '水印添加成功',
          icon: 'success'
        });
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: '添加水印失败',
          icon: 'error'
        });
        console.error('水印添加失败:', error);
      }
    },

    // 保存图片
    saveImage() {
      if (!this.data.watermarkedImage) {
        return;
      }

      wx.saveImageToPhotosAlbum({
        filePath: this.data.watermarkedImage,
        success: () => {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
        },
        fail: (error) => {
          console.error('保存失败:', error);
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          });
        }
      });
    }
  };

  return pageExample;
}

// 导出示例函数
module.exports = {
  example1,
  example2,
  example3,
  example4,
  exampleInPage
};

/**
 * 使用说明:
 * 
 * 1. 文字水印配置选项:
 *    - text: 水印文字内容
 *    - x, y: 自定义坐标 (0-1为比例，>1为像素值)
 *    - position: 预设位置 ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')
 *    - fontSize: 字体大小 (像素)
 *    - color: 文字颜色 (十六进制)
 *    - opacity: 透明度 (0-1)
 *    - fontFamily: 字体名称
 * 
 * 2. 图片水印配置选项:
 *    - width, height: 水印图片尺寸
 *    - x, y: 自定义坐标
 *    - position: 预设位置
 *    - opacity: 透明度
 * 
 * 3. 批量处理配置:
 *    - type: 'text' 或 'image'
 *    - 其他配置项与单张处理相同
 *    - 支持进度回调
 * 
 * 4. 注意事项:
 *    - 需要在小程序中使用Canvas API
 *    - 图片路径可以是本地临时文件或网络图片
 *    - 处理后的图片为临时文件，需要及时保存
 *    - 批量处理时注意性能和内存使用
 */