const API_BASE = "/api";

const els = {
  loginForm: document.getElementById("login-form"),
  registerForm: document.getElementById("register-form"),
  uploadSection: document.getElementById("upload-section"),
  historySection: document.getElementById("history-section"),
  authSection: document.getElementById("auth-section"),
  uploadForm: document.getElementById("upload-form"),
  historyBody: document.getElementById("history-body"),
  currentUser: document.getElementById("current-user"),
  logoutBtn: document.getElementById("logout-btn"),
  refreshHistory: document.getElementById("refresh-history"),
  toast: document.getElementById("toast"),
};

const state = {
  token: localStorage.getItem("restoration_token") || "",
  username: localStorage.getItem("restoration_username") || "",
  pollingTimer: null,
};

const showToast = (message, duration = 2600) => {
  els.toast.textContent = message;
  els.toast.hidden = false;
  setTimeout(() => (els.toast.hidden = true), duration);
};

const authHeaders = () =>
  state.token
    ? {
        Authorization: `Bearer ${state.token}`,
      }
    : {};

const apiRequest = async (path, options = {}) => {
  const opts = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...authHeaders(),
    },
  };

  if (options.body instanceof FormData) {
    delete opts.headers["Content-Type"];
    opts.body = options.body;
  }

  const response = await fetch(`${API_BASE}${path}`, opts);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "请求失败");
  }
  if (response.status === 204) return null;
  return response.json();
};

const setLoggedIn = (username, token) => {
  state.username = username;
  state.token = token;
  localStorage.setItem("restoration_username", username);
  localStorage.setItem("restoration_token", token);

  els.currentUser.textContent = `您好，${username}`;
  els.logoutBtn.hidden = false;
  els.authSection.hidden = true;
  els.uploadSection.hidden = false;
  els.historySection.hidden = false;

  startPolling();
};

const clearSession = () => {
  state.username = "";
  state.token = "";
  localStorage.removeItem("restoration_username");
  localStorage.removeItem("restoration_token");

  els.currentUser.textContent = "未登录";
  els.logoutBtn.hidden = true;
  els.authSection.hidden = false;
  els.uploadSection.hidden = true;
  els.historySection.hidden = true;

  stopPolling();
};

const renderJobs = (jobs) => {
  if (!jobs.length) {
    els.historyBody.innerHTML =
      '<tr><td colspan="6">暂无任务，上传照片即可开始修复。</td></tr>';
    return;
  }

  els.historyBody.innerHTML = jobs
    .map((job) => {
      const statusClass = `status-chip ${job.status}`;
      const progressValue = Math.round(job.progress || 0);
      const downloadBtn =
        job.status === "completed"
          ? `<button data-job="${job.id}" class="download-btn">下载结果</button>`
          : "";
      const deleteBtn =
        job.status !== "processing"
          ? `<button data-delete="${job.id}" class="ghost danger">删除</button>`
          : "";
      return `
        <tr>
          <td>#${job.id}</td>
          <td>${job.original_filename}</td>
          <td>
            <span class="${statusClass}">${job.status}</span>
            ${job.error_message ? `<div class="error-message">${job.error_message}</div>` : ""}
          </td>
          <td>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${progressValue}%"></div>
            </div>
            <small>${progressValue}%</small>
          </td>
          <td>${new Date(job.created_at).toLocaleString()}</td>
          <td class="actions">${downloadBtn} ${deleteBtn}</td>
        </tr>
      `;
    })
    .join("");
};

const fetchHistory = async () => {
  if (!state.token) return;
  try {
    const jobs = await apiRequest("/photos/history?limit=50", { method: "GET" });
    renderJobs(jobs);
  } catch (error) {
    console.error(error);
  }
};

const startPolling = () => {
  fetchHistory();
  if (state.pollingTimer) return;
  state.pollingTimer = setInterval(fetchHistory, 5000);
};

const stopPolling = () => {
  if (state.pollingTimer) {
    clearInterval(state.pollingTimer);
    state.pollingTimer = null;
  }
};

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  try {
    const data = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    showToast("登录成功");
    setLoggedIn(data.username, data.access_token);
  } catch (error) {
    showToast(error.message);
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  try {
    const data = await apiRequest("/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    showToast("账号创建完成并自动登录");
    setLoggedIn(data.username, data.access_token);
  } catch (error) {
    showToast(error.message);
  }
});

els.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const filesInput = event.currentTarget.elements.files;
  if (!filesInput.files.length) {
    showToast("请选择至少一张图片");
    return;
  }

  const formData = new FormData();
  Array.from(filesInput.files).forEach((file) => formData.append("files", file));

  try {
    await apiRequest("/photos/upload", {
      method: "POST",
      body: formData,
      headers: authHeaders(),
    });
    filesInput.value = "";
    showToast("任务已进入队列");
    fetchHistory();
  } catch (error) {
    showToast(error.message);
  }
});

els.logoutBtn.addEventListener("click", () => {
  clearSession();
  showToast("已退出");
});

els.refreshHistory.addEventListener("click", fetchHistory);

els.historyBody.addEventListener("click", async (event) => {
  const downloadId = event.target.dataset.job;
  const deleteId = event.target.dataset.delete;

  if (downloadId) {
    try {
      const response = await fetch(`${API_BASE}/photos/${downloadId}/result`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `restored_${downloadId}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(error.message);
    }
  }

  if (deleteId) {
    try {
      await apiRequest(`/photos/${deleteId}`, { method: "DELETE" });
      showToast("任务已删除");
      fetchHistory();
    } catch (error) {
      showToast(error.message);
    }
  }
});

// Restore session on load
if (state.token && state.username) {
  setLoggedIn(state.username, state.token);
} else {
  clearSession();
}
