// pages/subscriptionCenter/subscriptionCenter.js
const SubscriptionCenter = require('../../utils/subscriptionCenter.js');

function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Page({
  data: {
    items: [],
    requesting: false,
    lastSavedAt: '',
    statusText: {
      accept: '已同意',
      reject: '已拒绝',
      ban: '被限制/关闭',
      '': ''
    }
  },

  onLoad() {
    this.refreshFromStorage();
  },

  onShow() {
    // 防止其它页面改动状态后，这里不刷新
    this.refreshFromStorage();
  },

  refreshFromStorage() {
    const defaults = SubscriptionCenter.getDefaultTemplates();
    const state = SubscriptionCenter.loadState();
    const merged = SubscriptionCenter.mergeTemplates(defaults, state || {});
    this.setData({
      items: merged,
      lastSavedAt: state && state.lastSavedAt ? formatDateTime(state.lastSavedAt) : ''
    });
  },

  persist(items) {
    const next = {
      version: 1,
      items,
      lastSavedAt: Date.now()
    };
    SubscriptionCenter.saveState(next);
    this.setData({
      lastSavedAt: formatDateTime(next.lastSavedAt)
    });
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key;
    const enabled = !!(e.detail && e.detail.value);

    const items = (this.data.items || []).map((it) => {
      if (it.key !== key) return it;
      return { ...it, enabled };
    });

    this.setData({ items });
    this.persist(items);
  },

  selectAll() {
    const items = (this.data.items || []).map((it) => ({ ...it, enabled: true }));
    this.setData({ items });
    this.persist(items);
  },

  clearAll() {
    const items = (this.data.items || []).map((it) => ({ ...it, enabled: false }));
    this.setData({ items });
    this.persist(items);
  },

  resetState() {
    const defaults = SubscriptionCenter.getDefaultTemplates();
    const items = defaults.map((it) => ({ ...it }));
    this.setData({ items, lastSavedAt: '' });
    SubscriptionCenter.saveState({
      version: 1,
      items,
      lastSavedAt: Date.now()
    });
    wx.showToast({ title: '已清空', icon: 'success' });
  },

  requestSubscribe() {
    if (this.data.requesting) return;

    const selected = (this.data.items || []).filter((it) => it.enabled);
    const tmplIds = selected
      .map((it) => it.tmplId)
      .filter((id) => typeof id === 'string' && id.trim().length > 0);

    if (tmplIds.length === 0) {
      wx.showToast({ title: '请先选择通知类型', icon: 'none' });
      return;
    }

    // 避免占位符误请求
    const hasPlaceholder = tmplIds.some((id) => id.startsWith('TEMPLATE_ID_'));
    if (hasPlaceholder) {
      wx.showModal({
        title: '需要配置模板ID',
        content: '当前使用的是占位模板ID（TEMPLATE_ID_xxx）。请先替换为你的小程序订阅消息真实模板ID，再发起订阅。',
        showCancel: false
      });
      return;
    }

    this.setData({ requesting: true });

    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        const now = Date.now();
        const items = (this.data.items || []).map((it) => {
          if (!it.enabled) return it;
          const status = res && it.tmplId ? res[it.tmplId] : '';
          if (!status) return it;
          return {
            ...it,
            lastStatus: status,
            lastRequestedAt: formatDateTime(now)
          };
        });

        this.setData({ items });
        this.persist(items);

        wx.showToast({ title: '已提交订阅请求', icon: 'success' });
      },
      fail: (err) => {
        console.error('requestSubscribeMessage failed', err);
        wx.showToast({ title: '订阅失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ requesting: false });
      }
    });
  }
});

