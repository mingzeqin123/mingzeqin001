// utils/captcha.js - 验证码生成和验证工具

class CaptchaGenerator {
  constructor() {
    this.chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.mathOperators = ['+', '-', '×'];
    this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
  }

  /**
   * 生成文字验证码
   * @param {number} length 验证码长度
   * @returns {string} 验证码文本
   */
  generateTextCaptcha(length = 4) {
    let captcha = '';
    for (let i = 0; i < length; i++) {
      captcha += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
    }
    return captcha;
  }

  /**
   * 生成数学验证码
   * @returns {Object} 包含问题和答案的对象
   */
  generateMathCaptcha() {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operator = this.mathOperators[Math.floor(Math.random() * this.mathOperators.length)];
    
    let question, answer;
    
    switch (operator) {
      case '+':
        question = `${num1} + ${num2} = ?`;
        answer = num1 + num2;
        break;
      case '-':
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        question = `${larger} - ${smaller} = ?`;
        answer = larger - smaller;
        break;
      case '×':
        const smallNum1 = Math.floor(Math.random() * 10) + 1;
        const smallNum2 = Math.floor(Math.random() * 10) + 1;
        question = `${smallNum1} × ${smallNum2} = ?`;
        answer = smallNum1 * smallNum2;
        break;
    }
    
    return { question, answer: answer.toString() };
  }

  /**
   * 在Canvas上绘制文字验证码
   * @param {Object} ctx Canvas上下文
   * @param {string} text 验证码文本
   * @param {number} width Canvas宽度
   * @param {number} height Canvas高度
   */
  drawTextCaptcha(ctx, text, width = 120, height = 40) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制干扰线
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = this.colors[Math.floor(Math.random() * this.colors.length)];
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
    
    // 绘制干扰点
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = this.colors[Math.floor(Math.random() * this.colors.length)];
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // 绘制验证码文字
    const charWidth = width / text.length;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = charWidth * i + charWidth / 2;
      const y = height / 2;
      
      // 随机颜色
      ctx.fillStyle = this.colors[Math.floor(Math.random() * this.colors.length)];
      
      // 随机字体大小
      const fontSize = Math.random() * 8 + 16;
      ctx.font = `${fontSize}px Arial, sans-serif`;
      
      // 随机角度
      const angle = (Math.random() - 0.5) * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }

  /**
   * 在Canvas上绘制数学验证码
   * @param {Object} ctx Canvas上下文
   * @param {string} question 数学问题
   * @param {number} width Canvas宽度
   * @param {number} height Canvas高度
   */
  drawMathCaptcha(ctx, question, width = 150, height = 40) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制边框
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // 绘制问题文字
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(question, width / 2, height / 2);
  }

  /**
   * 生成滑动验证码的拼图
   * @param {Object} ctx Canvas上下文
   * @param {number} width Canvas宽度
   * @param {number} height Canvas高度
   * @returns {Object} 包含拼图位置信息的对象
   */
  generateSlideCaptcha(ctx, width = 300, height = 150) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景图案
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff9a56');
    gradient.addColorStop(0.5, '#ffad56');
    gradient.addColorStop(1, '#ff9a56');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加纹理
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // 拼图位置
    const puzzleX = Math.random() * (width - 60) + 30;
    const puzzleY = Math.random() * (height - 60) + 30;
    const puzzleSize = 40;
    
    // 绘制拼图缺口
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    this.drawPuzzlePiece(ctx, puzzleX, puzzleY, puzzleSize);
    ctx.restore();
    
    // 绘制拼图边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    this.drawPuzzlePiece(ctx, puzzleX, puzzleY, puzzleSize, true);
    
    return {
      x: puzzleX,
      y: puzzleY,
      size: puzzleSize,
      tolerance: 5 // 允许的误差范围
    };
  }

  /**
   * 绘制拼图片段
   * @param {Object} ctx Canvas上下文
   * @param {number} x X坐标
   * @param {number} y Y坐标
   * @param {number} size 拼图大小
   * @param {boolean} strokeOnly 是否只绘制边框
   */
  drawPuzzlePiece(ctx, x, y, size, strokeOnly = false) {
    const radius = size / 8;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // 上边
    ctx.lineTo(x + size * 0.3, y);
    ctx.arc(x + size * 0.5, y, radius, Math.PI, 0, false);
    ctx.lineTo(x + size, y);
    
    // 右边
    ctx.lineTo(x + size, y + size * 0.3);
    ctx.arc(x + size, y + size * 0.5, radius, Math.PI * 1.5, Math.PI * 0.5, false);
    ctx.lineTo(x + size, y + size);
    
    // 下边
    ctx.lineTo(x + size * 0.7, y + size);
    ctx.arc(x + size * 0.5, y + size, radius, 0, Math.PI, false);
    ctx.lineTo(x, y + size);
    
    // 左边
    ctx.lineTo(x, y + size * 0.7);
    ctx.arc(x, y + size * 0.5, radius, Math.PI * 0.5, Math.PI * 1.5, false);
    ctx.closePath();
    
    if (strokeOnly) {
      ctx.stroke();
    } else {
      ctx.fill();
    }
  }

  /**
   * 验证滑动验证码
   * @param {number} userX 用户拖拽的X坐标
   * @param {number} correctX 正确的X坐标
   * @param {number} tolerance 允许的误差
   * @returns {boolean} 验证是否通过
   */
  verifySlideCaptcha(userX, correctX, tolerance = 5) {
    return Math.abs(userX - correctX) <= tolerance;
  }

  /**
   * 生成点击验证码
   * @param {Object} ctx Canvas上下文
   * @param {number} width Canvas宽度
   * @param {number} height Canvas高度
   * @param {string} targetText 要点击的文字
   * @returns {Array} 正确答案的坐标数组
   */
  generateClickCaptcha(ctx, width = 300, height = 200, targetText = '春') {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    
    // 干扰文字
    const interferenceChars = ['夏', '秋', '冬', '东', '南', '西', '北', '上', '下', '左', '右'];
    const allChars = [...interferenceChars, targetText, targetText, targetText]; // 目标文字出现3次
    
    const correctPositions = [];
    const usedPositions = [];
    
    // 随机放置文字
    for (let i = 0; i < allChars.length; i++) {
      let x, y, attempts = 0;
      
      // 确保文字不重叠
      do {
        x = Math.random() * (width - 40) + 20;
        y = Math.random() * (height - 40) + 30;
        attempts++;
      } while (this.isPositionTooClose(x, y, usedPositions, 40) && attempts < 50);
      
      usedPositions.push({ x, y });
      
      // 绘制文字
      ctx.fillStyle = this.colors[Math.floor(Math.random() * this.colors.length)];
      ctx.font = '24px SimSun, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(allChars[i], x, y);
      
      // 记录正确答案位置
      if (allChars[i] === targetText) {
        correctPositions.push({ x, y, radius: 20 });
      }
    }
    
    return correctPositions;
  }

  /**
   * 检查位置是否太近
   * @param {number} x X坐标
   * @param {number} y Y坐标
   * @param {Array} positions 已有位置数组
   * @param {number} minDistance 最小距离
   * @returns {boolean} 是否太近
   */
  isPositionTooClose(x, y, positions, minDistance) {
    return positions.some(pos => {
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      return distance < minDistance;
    });
  }

  /**
   * 验证点击验证码
   * @param {Array} userClicks 用户点击坐标数组
   * @param {Array} correctPositions 正确位置数组
   * @param {number} tolerance 允许误差
   * @returns {boolean} 验证是否通过
   */
  verifyClickCaptcha(userClicks, correctPositions, tolerance = 25) {
    if (userClicks.length !== correctPositions.length) {
      return false;
    }
    
    let matchCount = 0;
    const usedCorrect = new Set();
    
    for (const userClick of userClicks) {
      for (let i = 0; i < correctPositions.length; i++) {
        if (usedCorrect.has(i)) continue;
        
        const correct = correctPositions[i];
        const distance = Math.sqrt(
          Math.pow(userClick.x - correct.x, 2) + 
          Math.pow(userClick.y - correct.y, 2)
        );
        
        if (distance <= tolerance) {
          matchCount++;
          usedCorrect.add(i);
          break;
        }
      }
    }
    
    return matchCount === correctPositions.length;
  }

  /**
   * 生成图形验证码
   * @param {Object} ctx Canvas上下文
   * @param {number} width Canvas宽度
   * @param {number} height Canvas高度
   * @returns {Object} 包含正确答案的对象
   */
  generateShapeCaptcha(ctx, width = 200, height = 150) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);
    
    const shapes = ['circle', 'square', 'triangle'];
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    const shapePositions = [];
    
    // 绘制多个图形
    for (let i = 0; i < 8; i++) {
      const shape = Math.random() < 0.3 ? targetShape : shapes[Math.floor(Math.random() * shapes.length)];
      const x = Math.random() * (width - 60) + 30;
      const y = Math.random() * (height - 60) + 30;
      const size = Math.random() * 15 + 15;
      
      ctx.fillStyle = this.colors[Math.floor(Math.random() * this.colors.length)];
      
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
      } else if (shape === 'square') {
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
      } else if (shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();
      }
      
      if (shape === targetShape) {
        shapePositions.push({ x, y, radius: size + 5 });
      }
    }
    
    return {
      targetShape,
      positions: shapePositions
    };
  }
}

// 导出单例
const captchaGenerator = new CaptchaGenerator();

module.exports = captchaGenerator;