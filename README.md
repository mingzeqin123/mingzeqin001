# API代理程序

一个通用的API代理服务器，支持多种HTTP方法（GET、POST、PUT、DELETE等）的统一API访问。

## 功能特性

- 支持所有HTTP方法（GET、POST、PUT、DELETE、PATCH、OPTIONS等）
- 自动处理请求头和响应头
- 支持CORS跨域请求
- 可配置的超时和连接池设置
- 详细的日志记录
- 健康检查端点
- 两种代理模式：路径代理和查询参数代理

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 启动代理服务器

```bash
python api_proxy.py
```

或者指定配置：

```bash
python api_proxy.py --host 0.0.0.0 --port 8080 --config proxy_config.yaml
```

### 2. 代理模式

#### 模式1：路径代理
将目标URL作为路径的一部分：

```
GET /proxy/http://api.example.com/users
POST /proxy/https://api.example.com/users
PUT /proxy/http://api.example.com/users/123
DELETE /proxy/http://api.example.com/users/123
```

#### 模式2：查询参数代理
通过查询参数指定目标URL：

```
GET /api?url=http://api.example.com/users
POST /api?url=https://api.example.com/users
PUT /api?url=http://api.example.com/users/123
DELETE /api?url=http://api.example.com/users/123
```

### 3. 使用示例

#### 使用curl测试

```bash
# GET请求
curl "http://localhost:8080/proxy/http://httpbin.org/get"

# POST请求
curl -X POST "http://localhost:8080/proxy/http://httpbin.org/post" \
     -H "Content-Type: application/json" \
     -d '{"name": "test", "value": 123}'

# 使用查询参数模式
curl "http://localhost:8080/api?url=http://httpbin.org/get"
```

#### 使用JavaScript

```javascript
// GET请求
fetch('http://localhost:8080/proxy/http://api.example.com/users')
  .then(response => response.json())
  .then(data => console.log(data));

// POST请求
fetch('http://localhost:8080/proxy/http://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 配置说明

代理服务器会自动创建 `proxy_config.yaml` 配置文件，包含以下配置项：

```yaml
server:
  host: "0.0.0.0"          # 服务器监听地址
  port: 8080               # 服务器端口
  timeout: 30              # 服务器超时时间

proxy:
  timeout: 30              # 代理请求超时时间
  max_connections: 100     # 最大连接数
  max_keepalive_connections: 20  # 最大保持连接数
  keepalive_timeout: 30    # 保持连接超时时间

allowed_origins: ["*"]     # 允许的源地址（CORS）

rate_limiting:
  enabled: false           # 是否启用速率限制
  requests_per_minute: 100 # 每分钟请求数限制
```

## API端点

- `GET /health` - 健康检查端点
- `* /proxy/{target_url}` - 路径代理模式
- `* /api?url={target_url}` - 查询参数代理模式

## 日志

代理服务器会记录详细的请求和响应日志到 `proxy.log` 文件和控制台输出。

## 注意事项

1. 确保目标API服务器支持CORS或通过代理访问
2. 某些API可能需要特定的认证头，代理会转发所有请求头
3. 大文件上传/下载时注意超时设置
4. 生产环境建议配置适当的速率限制

## 故障排除

1. **连接超时**：检查目标URL是否可访问，调整timeout配置
2. **CORS错误**：确保代理服务器正确设置了CORS头
3. **认证失败**：检查请求头是否包含必要的认证信息
4. **端口占用**：使用 `--port` 参数指定其他端口