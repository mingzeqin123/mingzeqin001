/**
 * 防恶意评论测试脚本
 * 演示各种防刷机制的效果
 */

const CommentService = require('./commentService');
const assert = require('assert');

class AntiSpamTester {
  constructor() {
    this.service = new CommentService();
    this.testResults = [];
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始防恶意评论测试...\n');

    await this.testNormalComment();
    await this.testRateLimit();
    await this.testSensitiveWords();
    await this.testDuplicateContent();
    await this.testSpamContent();
    await this.testQualityFilter();
    await this.testUserBehaviorTracking();
    await this.testBlacklist();

    this.printTestResults();
  }

  // 测试正常评论
  async testNormalComment() {
    console.log('📝 测试正常评论...');
    
    try {
      const mockReq = {
        body: { content: '这个游戏很有趣，画面也很精美！' },
        user: { id: 'test_user_001' },
        ip: '192.168.1.100',
        get: () => 'Mozilla/5.0...'
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 200) {
              console.log('✅ 正常评论通过验证');
              this.testResults.push({ test: '正常评论', result: 'PASS' });
            } else {
              console.log('❌ 正常评论被错误拦截');
              this.testResults.push({ test: '正常评论', result: 'FAIL' });
            }
          }
        })
      };

      await this.service.submitComment(mockReq, mockRes);
    } catch (error) {
      console.log('❌ 正常评论测试失败:', error.message);
      this.testResults.push({ test: '正常评论', result: 'ERROR' });
    }
  }

  // 测试频率限制
  async testRateLimit() {
    console.log('⏰ 测试频率限制...');
    
    let blockedCount = 0;
    
    // 快速发送多个评论
    for (let i = 0; i < 5; i++) {
      const mockReq = {
        body: { content: `测试评论 ${i + 1}` },
        user: { id: 'test_user_rate_limit' },
        ip: '192.168.1.101',
        get: () => 'Mozilla/5.0...'
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 429) {
              blockedCount++;
            }
          }
        })
      };

      await this.service.submitComment(mockReq, mockRes);
    }
    
    if (blockedCount >= 2) {
      console.log('✅ 频率限制正常工作');
      this.testResults.push({ test: '频率限制', result: 'PASS' });
    } else {
      console.log('❌ 频率限制未生效');
      this.testResults.push({ test: '频率限制', result: 'FAIL' });
    }
  }

  // 测试敏感词过滤
  async testSensitiveWords() {
    console.log('🚫 测试敏感词过滤...');
    
    const sensitiveComments = [
      '这个游戏真垃圾！',
      '傻逼游戏，浪费时间',
      '骗子游戏，大家别玩'
    ];
    
    let blockedCount = 0;
    
    for (const content of sensitiveComments) {
      const mockReq = {
        body: { content },
        user: { id: 'test_user_sensitive' },
        ip: '192.168.1.102',
        get: () => 'Mozilla/5.0...'
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 429) {
              blockedCount++;
            }
          }
        })
      };

      await this.service.submitComment(mockReq, mockRes);
    }
    
    if (blockedCount >= 2) {
      console.log('✅ 敏感词过滤正常工作');
      this.testResults.push({ test: '敏感词过滤', result: 'PASS' });
    } else {
      console.log('❌ 敏感词过滤未生效');
      this.testResults.push({ test: '敏感词过滤', result: 'FAIL' });
    }
  }

  // 测试重复内容检测
  async testDuplicateContent() {
    console.log('🔄 测试重复内容检测...');
    
    const duplicateContent = '这个游戏很不错，推荐大家玩！';
    
    // 先提交一条正常评论
    const mockReq1 = {
      body: { content: duplicateContent },
      user: { id: 'test_user_duplicate' },
      ip: '192.168.1.103',
      get: () => 'Mozilla/5.0...'
    };
    
    let firstSuccess = false;
    const mockRes1 = {
      status: (code) => ({
        json: (data) => {
          if (code === 200) {
            firstSuccess = true;
          }
        }
      })
    };

    await this.service.submitComment(mockReq1, mockRes1);
    
    // 再提交相同内容
    const mockReq2 = {
      body: { content: duplicateContent },
      user: { id: 'test_user_duplicate' },
      ip: '192.168.1.103',
      get: () => 'Mozilla/5.0...'
    };
    
    let secondBlocked = false;
    const mockRes2 = {
      status: (code) => ({
        json: (data) => {
          if (code === 429) {
            secondBlocked = true;
          }
        }
      })
    };

    await this.service.submitComment(mockReq2, mockRes2);
    
    if (firstSuccess && secondBlocked) {
      console.log('✅ 重复内容检测正常工作');
      this.testResults.push({ test: '重复内容检测', result: 'PASS' });
    } else {
      console.log('❌ 重复内容检测未生效');
      this.testResults.push({ test: '重复内容检测', result: 'FAIL' });
    }
  }

  // 测试垃圾内容检测
  async testSpamContent() {
    console.log('🗑️ 测试垃圾内容检测...');
    
    const spamComments = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '微信加我：1234567890',
      '代练刷分，联系QQ：123456789',
      'http://spam-site.com 免费外挂'
    ];
    
    let blockedCount = 0;
    
    for (const content of spamComments) {
      const mockReq = {
        body: { content },
        user: { id: 'test_user_spam' },
        ip: '192.168.1.104',
        get: () => 'Mozilla/5.0...'
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 429) {
              blockedCount++;
            }
          }
        })
      };

      await this.service.submitComment(mockReq, mockRes);
    }
    
    if (blockedCount >= 2) {
      console.log('✅ 垃圾内容检测正常工作');
      this.testResults.push({ test: '垃圾内容检测', result: 'PASS' });
    } else {
      console.log('❌ 垃圾内容检测未生效');
      this.testResults.push({ test: '垃圾内容检测', result: 'FAIL' });
    }
  }

  // 测试内容质量过滤
  async testQualityFilter() {
    console.log('📊 测试内容质量过滤...');
    
    const lowQualityComments = [
      'a',
      '好',
      '!!!!!!!!!!!!!!!!!!!!',
      '12345678901234567890'
    ];
    
    let blockedCount = 0;
    
    for (const content of lowQualityComments) {
      const mockReq = {
        body: { content },
        user: { id: 'test_user_quality' },
        ip: '192.168.1.105',
        get: () => 'Mozilla/5.0...'
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 429) {
              blockedCount++;
            }
          }
        })
      };

      await this.service.submitComment(mockReq, mockRes);
    }
    
    if (blockedCount >= 2) {
      console.log('✅ 内容质量过滤正常工作');
      this.testResults.push({ test: '内容质量过滤', result: 'PASS' });
    } else {
      console.log('❌ 内容质量过滤未生效');
      this.testResults.push({ test: '内容质量过滤', result: 'FAIL' });
    }
  }

  // 测试用户行为追踪
  async testUserBehaviorTracking() {
    console.log('👤 测试用户行为追踪...');
    
    const userId = 'test_user_behavior';
    
    // 模拟可疑行为
    for (let i = 0; i < 4; i++) {
      const mockReq = {
        body: { content: '垃圾内容测试' },
        user: { id: userId },
        ip: '192.168.1.106',
        get: () => 'Mozilla/5.0...'
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            // 记录响应状态
          }
        })
      };

      await this.service.submitComment(mockReq, mockRes);
    }
    
    // 检查用户行为数据
    const behavior = this.service.userBehavior.get(userId);
    
    if (behavior && behavior.suspiciousActions >= 3) {
      console.log('✅ 用户行为追踪正常工作');
      this.testResults.push({ test: '用户行为追踪', result: 'PASS' });
    } else {
      console.log('❌ 用户行为追踪未生效');
      this.testResults.push({ test: '用户行为追踪', result: 'FAIL' });
    }
  }

  // 测试黑名单功能
  async testBlacklist() {
    console.log('🚫 测试黑名单功能...');
    
    const blockedUserId = 'blocked_user_test';
    
    // 添加到黑名单
    this.service.blacklist.add(blockedUserId);
    
    const mockReq = {
      body: { content: '正常评论内容' },
      user: { id: blockedUserId },
      ip: '192.168.1.107',
      get: () => 'Mozilla/5.0...'
    };
    
    let blocked = false;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 403) {
            blocked = true;
          }
        }
      })
    };

    await this.service.submitComment(mockReq, mockRes);
    
    if (blocked) {
      console.log('✅ 黑名单功能正常工作');
      this.testResults.push({ test: '黑名单功能', result: 'PASS' });
    } else {
      console.log('❌ 黑名单功能未生效');
      this.testResults.push({ test: '黑名单功能', result: 'FAIL' });
    }
  }

  // 打印测试结果
  printTestResults() {
    console.log('\n📋 测试结果汇总:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.result === 'PASS').length;
    const failed = this.testResults.filter(r => r.result === 'FAIL').length;
    const errors = this.testResults.filter(r => r.result === 'ERROR').length;
    
    this.testResults.forEach(result => {
      const status = result.result === 'PASS' ? '✅' : 
                    result.result === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.test}: ${result.result}`);
    });
    
    console.log('='.repeat(50));
    console.log(`总计: ${this.testResults.length} 个测试`);
    console.log(`通过: ${passed} 个`);
    console.log(`失败: ${failed} 个`);
    console.log(`错误: ${errors} 个`);
    
    if (failed === 0 && errors === 0) {
      console.log('\n🎉 所有测试通过！防刷机制运行正常。');
    } else {
      console.log('\n⚠️ 部分测试未通过，请检查防刷机制配置。');
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new AntiSpamTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AntiSpamTester;