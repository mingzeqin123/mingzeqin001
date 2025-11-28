# Excel行列转置工具

这个工具可以将Excel文件的行列进行转置（行列互换）。

## 功能特点

- 支持读取Excel文件（.xlsx格式）
- 自动进行行列转置
- 保持数据完整性
- 自动生成转置后的文件名
- 支持自定义输出文件名

## 安装依赖

```bash
pip install --break-system-packages pandas openpyxl
```

## 使用方法

### 基本用法

```bash
python3 excel_transpose.py <输入文件> [输出文件]
```

### 示例

1. **自动生成输出文件名**：
   ```bash
   python3 excel_transpose.py sample_data.xlsx
   ```
   输出文件将自动命名为 `sample_data_transposed.xlsx`

2. **指定输出文件名**：
   ```bash
   python3 excel_transpose.py sample_data.xlsx output.xlsx
   ```

## 转置示例

### 原始数据
```
   姓名  年龄  城市     工资   部门
0  张三  25  北京   8000  技术部
1  李四  30  上海  12000  销售部
2  王五  35  广州  15000  市场部
3  赵六  28  深圳  10000  人事部
```

### 转置后数据
```
  Unnamed: 0     0      1      2      3
0         姓名    张三     李四     王五     赵六
1         年龄    25     30     35     28
2         城市    北京     上海     广州     深圳
3         工资  8000  12000  15000  10000
4         部门   技术部    销售部    市场部    人事部
```

## 文件说明

- `excel_transpose.py` - 主要的转置脚本
- `create_sample_excel.py` - 创建示例Excel文件
- `final_verify.py` - 验证转置结果的脚本
- `requirements.txt` - 依赖包列表

## 注意事项

1. 输入文件必须是Excel格式（.xlsx）
2. 转置后的文件会包含索引列
3. 原始数据的行数会变成转置后数据的列数（减1，因为包含索引）
4. 原始数据的列数会变成转置后数据的行数

## 错误处理

脚本包含完整的错误处理机制：
- 检查输入文件是否存在
- 处理文件读取错误
- 提供详细的错误信息

## 测试

运行测试脚本验证转置功能：

```bash
python3 create_sample_excel.py  # 创建示例文件
python3 excel_transpose.py sample_data.xlsx  # 执行转置
python3 final_verify.py  # 验证结果
```

---

## 订单批量导入与校验工具

`order_import.py` 提供了一个可落地的「订单批量导入与校验」方案，适合对接 ERP、OMS 或电商后台的批量录单需求。

### 功能亮点
- 支持 `.xlsx/.xls/.csv` 多来源，一条命令完成清洗 + 校验
- 内置列名别名映射（如 `订单号`、`order_id`、`Order ID` 自动识别）
- 校验项涵盖：必填字段、号码格式、日期合法性、金额一致性、重复订单、状态合法性等
- 结果自动拆分为可落库的 `*_valid.json` 与附带错误说明的 `*_invalid.csv`
- `--strict` 模式可在检测到异常记录时返回非零退出码，方便接入调度/CI

### 快速开始

```bash
# 安装依赖
pip install --break-system-packages pandas openpyxl

# 基础用法（自动生成 orders_valid.json / orders_invalid.csv）
python3 order_import.py orders.xlsx

# 指定工作表、输出路径与严格模式
python3 order_import.py orders.xlsx \
  --sheet 待导入订单 \
  --valid-output ./dist/orders.json \
  --invalid-output ./dist/orders_errors.xlsx \
  --strict
```

### 输入字段要求（列名支持同义词）

| 字段 | 说明 | 是否必填 | 示例 |
| --- | --- | --- | --- |
| 订单号 (`order_id`, `订单编号`) | 字母/数字/_/-，长度 4-32 | ✅ | `SO20250101-001` |
| 客户名称 (`customer_name`, `收货人`) | 任意非空文本 | ✅ | `张三` |
| 手机号 (`phone`, `联系电话`) | 支持 11 位手机号或国际号码 | ✅ | `13888888888` |
| 商品名称 (`product_name`) | 任意非空文本 | ✅ | `定制周边礼包` |
| 数量 (`quantity`) | 正整数 | ✅ | `10` |
| 单价 (`unit_price`) | 正数，最多两位小数 | ✅ | `199.00` |
| 订单金额 (`total_amount`) | 可选，若提供需与数量*单价一致 | ⭕️ | `1990.00` |
| 币种 (`currency`) | ISO 4217，缺省为 `CNY` | ⭕️ | `USD` |
| 下单时间 (`order_date`) | 支持 `YYYY-MM-DD`、`YYYY/MM/DD HH:MM:SS`、`YYYYMMDD` 等 | ✅ | `2025-01-01 10:30:00` |
| 状态 (`status`, `订单状态`) | `pending/paid/shipped/completed/canceled/refunded` 及中文别名 | ✅ | `已支付` |
| 备注 (`remark`) | 自由文本 | ⭕️ | `春节活动订单` |

### 输出说明
- `*_valid.json`：数组结构，金额保留 2 位小数、状态标准化、日期统一为 `YYYY-MM-DD HH:MM:SS`
- `*_invalid.csv` / `*_invalid.xlsx`：保留原始列并新增 `row_number`、`error_messages`，方便业务快速定位并修复

借助该脚本可以把“导出 Excel → 人工检查 → 手工导入”的流程，收敛为“上传 → 一次校验 → 结果拆分”，显著降低批量导单成本。