// utils/subscriptionCenter.js
// 企业通知订阅中心：模板配置 + 本地状态持久化

const STORAGE_KEY = 'enterprise_notification_subscription_center_v1';

function getDefaultTemplates() {
  // 注意：tmplId 需要替换为你的小程序「订阅消息」真实模板ID
  return [
    {
      key: 'approval_result',
      title: '审批结果通知',
      desc: '审批通过/驳回/转交等结果提醒',
      tmplId: 'TEMPLATE_ID_APPROVAL_RESULT',
      enabled: true
    },
    {
      key: 'ticket_status',
      title: '工单状态通知',
      desc: '工单创建、处理中、已完成等状态变更提醒',
      tmplId: 'TEMPLATE_ID_TICKET_STATUS',
      enabled: true
    },
    {
      key: 'security_alert',
      title: '安全告警通知',
      desc: '账号异常、风控触发、关键操作等提醒',
      tmplId: 'TEMPLATE_ID_SECURITY_ALERT',
      enabled: false
    },
    {
      key: 'system_announcement',
      title: '系统公告通知',
      desc: '版本更新、维护窗口、重要公告提醒',
      tmplId: 'TEMPLATE_ID_SYSTEM_ANNOUNCEMENT',
      enabled: false
    }
  ];
}

function safeGetStorageSync(key) {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    return null;
  }
}

function safeSetStorageSync(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function loadState() {
  const state = safeGetStorageSync(STORAGE_KEY);
  if (!state || typeof state !== 'object') return null;
  return state;
}

function saveState(state) {
  return safeSetStorageSync(STORAGE_KEY, state);
}

function mergeTemplates(defaultTemplates, state) {
  const byKey = {};
  (defaultTemplates || []).forEach((t) => {
    byKey[t.key] = { ...t };
  });

  const savedItems = state && Array.isArray(state.items) ? state.items : [];
  savedItems.forEach((saved) => {
    if (!saved || !saved.key) return;
    if (!byKey[saved.key]) return;
    byKey[saved.key] = {
      ...byKey[saved.key],
      enabled: typeof saved.enabled === 'boolean' ? saved.enabled : byKey[saved.key].enabled,
      lastStatus: saved.lastStatus || byKey[saved.key].lastStatus,
      lastRequestedAt: saved.lastRequestedAt || byKey[saved.key].lastRequestedAt
    };
  });

  return Object.keys(byKey).map((k) => byKey[k]);
}

module.exports = {
  STORAGE_KEY,
  getDefaultTemplates,
  loadState,
  saveState,
  mergeTemplates
};

