# AI 老照片修复平台部署指南（阿里云 Linux）

本文档说明如何在一台阿里云 ECS（Ubuntu 20.04+/CentOS 8+）上部署 `restoration_webapp` 提供的 Python + HTML 一键修复平台。

## 1. 前置条件
- 已创建具备公网 IP 的 ECS，并开放 80/443/8000 端口。
- 已安装 Git、Python 3.10+、pip、iptables/ufw（或使用安全组）。
- 可选：准备好自定义域名与 SSL 证书。

## 2. 克隆与依赖
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv git
cd /var/www
sudo git clone https://your.repo.url.git jump-game-suite
cd jump-game-suite
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 3. 环境变量（可选）
```bash
export RESTORATION_DATABASE_URL="sqlite:////var/www/jump-game-suite/restoration_webapp/restoration.db"
export RESTORATION_SECRET_KEY="请改成随机强密钥"
export RESTORATION_MAX_UPLOAD_MB=20
```

可写入 `~/.bashrc` 或 `/etc/environment` 以便持久化。

## 4. 首次启动
```bash
cd /var/www/jump-game-suite
source .venv/bin/activate
uvicorn restoration_webapp.app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

访问 `http://ECS公网IP:8000` 测试页面登录/上传/修复流程。

## 5. systemd 服务
创建 `/etc/systemd/system/photo-restore.service`：
```
[Unit]
Description=AI Photo Restoration Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/jump-game-suite
Environment="RESTORATION_SECRET_KEY=替换成强口令"
ExecStart=/var/www/jump-game-suite/.venv/bin/uvicorn restoration_webapp.app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```
然后执行：
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now photo-restore
sudo systemctl status photo-restore
```

## 6. Nginx 反向代理（可选）
```
server {
    listen 80;
    server_name restore.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /static/ {
        alias /var/www/jump-game-suite/restoration_webapp/frontend/static/;
    }
}
```
申请并配置 SSL 后把 `listen 80` 改为 `listen 443 ssl;`，同时引入证书路径。

## 7. 数据与文件
- SQLite 文件：`restoration_webapp/restoration.db`
- 原始上传：`restoration_webapp/storage/uploads`
- 修复结果：`restoration_webapp/storage/results`

建议定期备份数据库与结果目录，可结合 OSS/对象存储。

## 8. 扩展与升级
- 更换 AI 模型：替换 `app/image_service.py` 内的 `apply_restoration_pipeline` 为调用自建 GPU 推理服务或第三方 API。
- 批处理/队列：可接入 Celery + Redis 或阿里云消息队列以支撑高并发。
- 观察日志：`journalctl -u photo-restore -f`。

完成以上步骤后，即可在阿里云服务器上以服务化方式运行网页端老照片修复平台。
