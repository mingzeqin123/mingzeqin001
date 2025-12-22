# Node 对接 HBase 写入 Demo（REST / Stargate）

这个 demo 使用 **HBase REST(Stargate)** 接口进行对接，特点是：Node 侧不需要 Thrift/JNI，只有 HTTP 即可（最容易跑通）。

## 前置条件

- Node.js **>= 18**（使用内置 `fetch`）
- HBase 已启动，并开启 REST 服务（Stargate）

## 启动 HBase REST（示例）

不同发行版命令略有差异，以下为常见方式（任选其一）：

### 方式 A：使用 `hbase-daemon.sh`

```bash
hbase-daemon.sh start rest -p 8080
```

### 方式 B：使用 `hbase` 命令

```bash
hbase rest start -p 8080
```

启动后可以用下面命令确认 REST 已可访问（端口按实际修改）：

```bash
curl -i "http://localhost:8080/version"
```

## 运行 demo

进入目录并运行：

```bash
cd node-hbase-demo
npm run demo
```

默认配置：

- `HBASE_REST_URL`: `http://localhost:8080`
- `HBASE_TABLE`: `node_demo`
- `HBASE_CF`: `cf`

你也可以显式指定：

```bash
HBASE_REST_URL="http://hbase-rest-host:8080" HBASE_TABLE="node_demo" HBASE_CF="cf" npm run demo
```

demo 会按顺序执行：

- 建表（不存在则创建）
- 写入一行（put）
- 读取该行（get）
- 删除该行（delete）

## 扫描（可选）

如果你的 HBase REST 支持 `scanner` 接口，可以用：

```bash
npm run demo:scan
```

或自定义前缀与条数：

```bash
node src/demo.js --scan --prefix "user#" --limit 20 --no-delete
```

## 代码结构

- `src/hbaseRestClient.js`: HBase REST 客户端（建表/put/get/delete/scan）
- `src/demo.js`: 演示脚本

## 常见问题

### 1) 报 404 / 501 / 415？

- **404**：通常是表不存在（demo 已自动建表），或 REST 服务没对外暴露正确端口/路径。
- **501**：某些发行版的 REST 组件未启用 scanner/filter；你可以不使用 `--scan`。
- **415**：Content-Type/Accept 不兼容；可以确认 REST 版本是否支持 JSON（`/version` 可看）。

