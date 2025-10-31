# 企业微信群成员信息记录

本文档介绍如何使用 `scripts/wecom_group_recorder.py` 对接企业微信接口，批量获取客户群成员信息并在本地留存。

## 环境准备

- Python 3.8 及以上
- 已安装企业微信「客户联系」或相关应用，获取到有效的 `CorpID` 与应用 `Secret`
- 在项目根目录执行依赖安装：
  ```bash
  pip install -r requirements.txt
  ```

## 基础配置

脚本默认从环境变量读取凭证，也可以通过命令行参数传入。

```bash
export WECOM_CORP_ID=ww1234567890abcdef
export WECOM_CORP_SECRET=abcdefghijklmnopqrstuvwx
```

## 快速开始

### 1. 拉取全部可见客户群

```bash
python3 scripts/wecom_group_recorder.py --all
```

脚本会调用 `externalcontact/groupchat/list` 与 `externalcontact/groupchat/get` 接口，默认将结果写入：

- `data/wecom_group_users.json`
- `data/wecom_group_users.csv`

### 2. 指定群聊或负责人

- 按负责人过滤：
  ```bash
  python3 scripts/wecom_group_recorder.py --all --owner zhangsan --owner lisi
  ```

- 指定 `chat_id`：
  ```bash
  python3 scripts/wecom_group_recorder.py --chat-id wraABCD1234 --chat-id wraEFGH5678
  ```

## 常用参数

- `--corp-id` / `--corp-secret`：显式传入凭证
- `--status-filter`：过滤群状态（0=全部，1=待激活，2=正常，3=已停止）
- `--output-dir`：自定义输出目录，默认 `data`
- `--json-name` / `--csv-name`：自定义文件名
- `--skip-json` / `--skip-csv`：跳过指定格式输出
- `--log-level`：日志级别（DEBUG/INFO/WARNING/...）

执行 `python3 scripts/wecom_group_recorder.py --help` 查看完整参数列表。

## 输出字段说明

- JSON：包含抓取时间 `fetched_at`、命中群总数 `group_count` 以及接口返回的完整群详情
- CSV：按成员展开，每行包括 `chat_id`、`member_id`、`member_type`、`member_join_time_iso` 等字段，可供 Excel/BI 工具分析

## 接口权限与限制

- 需要企业微信后台为应用授予「客户联系」相关接口权限
- 每次请求有频率限制，建议按需设置 `--limit` 并合理规划抓取周期
- 如果出现 `errcode` 提示，脚本会抛出异常并在日志中打印具体信息

## 故障排查

1. **身份校验失败**：确认 `CorpID`、`Secret` 与接口权限配置无误
2. **请求频繁**：根据企业微信风控策略调整抓取频率
3. **返回空列表**：检查应用是否有客户群查看权限，或调整 `--status-filter`、`--owner` 条件

---

如需将数据入库或二次加工，可在脚本基础上增加数据库写入逻辑，或在生成的 CSV/JSON 基础上开发后续流水线。
