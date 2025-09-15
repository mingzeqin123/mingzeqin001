# 多阶段构建Dockerfile
# 用于构建和运行整个项目

# 第一阶段：构建环境
FROM ubuntu:22.04 AS builder

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    # 基础工具
    curl \
    wget \
    git \
    unzip \
    tar \
    rsync \
    # Java环境
    openjdk-21-jdk \
    maven \
    # Python环境
    python3 \
    python3-pip \
    python3-venv \
    # Node.js (用于小程序工具)
    nodejs \
    npm \
    # 其他工具
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 创建构建脚本目录
RUN mkdir -p /app/scripts

# 复制并执行构建脚本
COPY scripts/build-all.sh /app/scripts/
RUN chmod +x /app/scripts/build-all.sh

# 执行构建
RUN /app/scripts/build-all.sh

# 第二阶段：运行时环境
FROM ubuntu:22.04 AS runtime

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    # Java运行时
    openjdk-21-jre \
    # Python运行时
    python3 \
    python3-pip \
    # 基础工具
    curl \
    wget \
    tar \
    cron \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN useradd -m -s /bin/bash appuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/build /app/build

# 复制部署脚本
COPY scripts/deploy.sh /app/scripts/
COPY scripts/update-service.sh /app/scripts/
RUN chmod +x /app/scripts/*.sh

# 创建日志目录
RUN mkdir -p /var/log/app && chown appuser:appuser /var/log/app

# 复制supervisor配置
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 复制cron配置
COPY docker/crontab /etc/cron.d/app-cron
RUN chmod 0644 /etc/cron.d/app-cron
RUN crontab /etc/cron.d/app-cron

# 设置权限
RUN chown -R appuser:appuser /app

# 切换到应用用户
USER appuser

# 暴露端口（如果需要）
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 启动命令
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]