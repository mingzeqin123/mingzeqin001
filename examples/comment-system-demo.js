// examples/comment-system-demo.js - 防恶意评论系统使用示例

const AntiSpam = require('../utils/antiSpam.js');
const CommentStorage = require('../utils/commentStorage.js');
const RiskAssessment = require('../utils/riskAssessment.js');
const CaptchaGenerator = require('../utils/captcha.js');

/**
 * 评论系统使用示例
 */
class CommentSystemDemo {
  constructor() {
    this.demoUsers = [
      {
        userId: 'user_normal_001',
        username: '正常用户',
        profile: { joinTime: Date.now() - 86400000 * 30, reportCount: 0 }
      },
      {
        userId: 'user_suspicious_002',
        username: '可疑用户',
        profile: { joinTime: Date.now() - 3600000, reportCount: 2 }
      },
      {
        userId: 'user_spam_003',
        username: '垃圾用户',
        profile: { joinTime: Date.now() - 1800000, reportCount: 8 }
      }
    ];
    
    this.demoComments = [
      '这是一个正常的评论内容，表达了用户的真实想法。',
      '垃圾内容！！！！！快来加我微信领取免费礼品！！！',
      'aaaaaaaaaaaa',
      '政治敏感内容测试',
      '这是一条重复的评论',
      '这是一条重复的评论',
      '123456789012345678901234567890',
      '很好的内容，值得推荐给大家！'
    ];
  }

  /**
   * 运行完整的演示
   */
  runDemo() {
    console.log('=== 防恶意评论系统演示开始 ===\n');
    
    // 1. 演示反垃圾检测
    this.demoAntiSpamDetection();
    
    // 2. 演示用户风险评估
    this.demoRiskAssessment();
    
    // 3. 演示验证码生成
    this.demoCaptchaGeneration();
    
    // 4. 演示评论存储管理
    this.demoCommentStorage();
    
    // 5. 演示举报系统
    this.demoReportSystem();
    
    console.log('=== 防恶意评论系统演示结束 ===');
  }

  /**
   * 演示反垃圾检测功能
   */
  demoAntiSpamDetection() {
    console.log('--- 1. 反垃圾检测演示 ---');
    
    this.demoComments.forEach((content, index) => {
      const userId = this.demoUsers[index % this.demoUsers.length].userId;
      const result = AntiSpam.checkComment(content, userId);
      
      console.log(`评论 ${index + 1}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`);
      console.log(`  检测结果: ${result.isValid ? '通过' : '拒绝'}`);
      console.log(`  风险等级: ${result.riskLevel} (${this.getRiskLevelText(result.riskLevel)})`);
      console.log(`  拒绝原因: ${result.reasons.join(', ') || '无'}`);
      console.log(`  需要验证码: ${result.needCaptcha ? '是' : '否'}`);
      console.log(`  需要人工审核: ${result.needManualReview ? '是' : '否'}`);
      console.log('');
    });
  }

  /**
   * 演示用户风险评估
   */
  demoRiskAssessment() {
    console.log('--- 2. 用户风险评估演示 ---');
    
    this.demoUsers.forEach(user => {
      // 模拟用户评论历史
      const userComments = this.generateMockUserComments(user.userId);
      
      const riskResult = RiskAssessment.assessUserRisk(
        user.userId,
        user.profile,
        userComments
      );
      
      console.log(`用户: ${user.username} (${user.userId})`);
      console.log(`  风险分数: ${riskResult.riskScore}`);
      console.log(`  风险等级: ${riskResult.riskLevel} (${riskResult.riskText})`);
      console.log(`  风险因子:`);
      
      Object.entries(riskResult.factors).forEach(([factor, score]) => {
        console.log(`    ${factor}: ${score.toFixed(3)}`);
      });
      
      console.log(`  处理建议:`);
      riskResult.recommendations.forEach(rec => {
        console.log(`    - ${rec}`);
      });
      console.log('');
    });
  }

  /**
   * 演示验证码生成
   */
  demoCaptchaGeneration() {
    console.log('--- 3. 验证码生成演示 ---');
    
    // 文字验证码
    const textCaptcha = CaptchaGenerator.generateTextCaptcha(4);
    console.log(`文字验证码: ${textCaptcha}`);
    
    // 数学验证码
    const mathCaptcha = CaptchaGenerator.generateMathCaptcha();
    console.log(`数学验证码: ${mathCaptcha.question} (答案: ${mathCaptcha.answer})`);
    
    // 验证码验证示例
    console.log('验证码验证测试:');
    console.log(`  正确答案验证: ${textCaptcha === textCaptcha ? '通过' : '失败'}`);
    console.log(`  错误答案验证: ${textCaptcha === 'wrong' ? '通过' : '失败'}`);
    console.log('');
  }

  /**
   * 演示评论存储管理
   */
  demoCommentStorage() {
    console.log('--- 4. 评论存储管理演示 ---');
    
    // 添加测试评论
    const testComment = {
      content: '这是一条测试评论',
      userId: 'demo_user',
      username: '演示用户',
      userAvatar: '/images/demo-avatar.png',
      riskLevel: 1
    };
    
    const addResult = CommentStorage.addComment(testComment);
    console.log(`添加评论: ${addResult.success ? '成功' : '失败'}`);
    
    if (addResult.success) {
      console.log(`  评论ID: ${addResult.comment.id}`);
      console.log(`  时间显示: ${addResult.comment.timeDisplay}`);
    }
    
    // 获取评论列表
    const commentsResult = CommentStorage.getComments({ page: 1, pageSize: 5 });
    console.log(`获取评论列表: ${commentsResult.comments.length} 条评论`);
    console.log(`  总数: ${commentsResult.total}`);
    console.log(`  是否有更多: ${commentsResult.hasMore}`);
    
    // 统计信息
    const stats = CommentStorage.getStatistics();
    console.log('评论统计:');
    console.log(`  总评论数: ${stats.totalComments}`);
    console.log(`  今日评论: ${stats.todayComments}`);
    console.log(`  本周评论: ${stats.weekComments}`);
    console.log(`  待处理举报: ${stats.pendingReports}`);
    console.log(`  已屏蔽评论: ${stats.blockedComments}`);
    console.log('');
  }

  /**
   * 演示举报系统
   */
  demoReportSystem() {
    console.log('--- 5. 举报系统演示 ---');
    
    // 模拟举报
    const reportResult = CommentStorage.reportComment(
      'demo_comment_id',
      'reporter_user_id',
      'spam',
      '这条评论包含垃圾信息'
    );
    
    console.log(`提交举报: ${reportResult.success ? '成功' : '失败'}`);
    
    if (!reportResult.success) {
      console.log(`  失败原因: ${reportResult.error}`);
    }
    
    // 获取举报列表
    const reportsResult = CommentStorage.getReports({ status: 'all', page: 1, pageSize: 10 });
    console.log(`举报记录: ${reportsResult.reports.length} 条`);
    
    reportsResult.reports.forEach((report, index) => {
      console.log(`  举报 ${index + 1}:`);
      console.log(`    原因: ${this.getReportReasonText(report.reason)}`);
      console.log(`    状态: ${this.getReportStatusText(report.status)}`);
      console.log(`    时间: ${new Date(report.timestamp).toLocaleString()}`);
    });
    
    console.log('');
  }

  /**
   * 生成模拟用户评论历史
   */
  generateMockUserComments(userId) {
    const comments = [];
    const now = Date.now();
    
    // 根据用户类型生成不同的评论模式
    if (userId.includes('normal')) {
      // 正常用户：少量高质量评论
      for (let i = 0; i < 5; i++) {
        comments.push({
          id: `comment_${userId}_${i}`,
          content: `正常用户的优质评论内容 ${i + 1}`,
          timestamp: now - Math.random() * 86400000 * 7, // 过去一周
          likes: Math.floor(Math.random() * 10)
        });
      }
    } else if (userId.includes('suspicious')) {
      // 可疑用户：频繁短评论
      for (let i = 0; i < 20; i++) {
        comments.push({
          id: `comment_${userId}_${i}`,
          content: `短评论${i}`,
          timestamp: now - Math.random() * 3600000, // 过去一小时
          likes: 0
        });
      }
    } else if (userId.includes('spam')) {
      // 垃圾用户：大量重复/垃圾评论
      for (let i = 0; i < 50; i++) {
        comments.push({
          id: `comment_${userId}_${i}`,
          content: i % 3 === 0 ? '重复内容' : 'aaaaaaa',
          timestamp: now - Math.random() * 1800000, // 过去半小时
          likes: 0
        });
      }
    }
    
    return comments;
  }

  /**
   * 获取风险等级文本
   */
  getRiskLevelText(level) {
    const texts = ['正常', '低风险', '中风险', '高风险'];
    return texts[level] || '未知';
  }

  /**
   * 获取举报原因文本
   */
  getReportReasonText(reason) {
    const reasonMap = {
      'spam': '垃圾信息',
      'abuse': '辱骂攻击',
      'porn': '色情内容',
      'ad': '广告推广',
      'politics': '政治敏感',
      'other': '其他'
    };
    return reasonMap[reason] || reason;
  }

  /**
   * 获取举报状态文本
   */
  getReportStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'processed': '已处理',
      'rejected': '已驳回'
    };
    return statusMap[status] || status;
  }

  /**
   * 性能测试
   */
  performanceTest() {
    console.log('--- 性能测试 ---');
    
    const testCases = [
      { name: '反垃圾检测', count: 1000 },
      { name: '风险评估', count: 100 },
      { name: '验证码生成', count: 500 }
    ];
    
    testCases.forEach(testCase => {
      const startTime = Date.now();
      
      for (let i = 0; i < testCase.count; i++) {
        if (testCase.name === '反垃圾检测') {
          AntiSpam.checkComment('测试评论内容', 'test_user');
        } else if (testCase.name === '风险评估') {
          RiskAssessment.assessUserRisk('test_user', {}, []);
        } else if (testCase.name === '验证码生成') {
          CaptchaGenerator.generateTextCaptcha();
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / testCase.count;
      
      console.log(`${testCase.name}:`);
      console.log(`  执行次数: ${testCase.count}`);
      console.log(`  总耗时: ${duration}ms`);
      console.log(`  平均耗时: ${avgTime.toFixed(2)}ms`);
      console.log('');
    });
  }
}

// 导出演示类
module.exports = CommentSystemDemo;

// 如果直接运行此文件，执行演示
if (typeof module !== 'undefined' && require.main === module) {
  const demo = new CommentSystemDemo();
  demo.runDemo();
  demo.performanceTest();
}