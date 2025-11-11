# Excel行列转置与批量转换工具

这个脚本可以导入单个或多个数据文件，支持行列转置，并可转换成 Excel / CSV / JSON 等指定格式。

## 功能特点

- ✅ 支持读取 Excel（.xlsx / .xls / .xlsm）、CSV、JSON 文件
- ✅ 可选的行列转置（默认开启）
- ✅ 批量处理：支持目录扫描、通配符匹配、递归处理
- ✅ 输出格式可选：`xlsx` / `csv` / `json`
- ✅ 自定义输出目录、文件名后缀、是否保留索引/表头
- ✅ 自动生成输出文件名，可选择覆盖或跳过已有文件

## 安装依赖

```bash
pip install --break-system-packages pandas openpyxl
```

## 使用方法

### 基本语法

```bash
python3 excel_transpose.py <输入路径...> [选项]
```

> 提示：`<输入路径...>` 可以是一个或多个文件，也可以是目录。目录模式下可通过 `--pattern` 指定匹配的文件类型。

### 常用示例

1. **单个 Excel 文件（默认转置并输出为新的 Excel）**：
   ```bash
   python3 excel_transpose.py sample_data.xlsx
   ```
   输出文件自动命名为 `sample_data_transposed.xlsx`

2. **单个文件转成 CSV，并禁用转置**：
   ```bash
   python3 excel_transpose.py sample_data.xlsx --output output.csv --format csv --no-transpose
   ```

3. **批量处理目录下所有 Excel 文件**：
   ```bash
   python3 excel_transpose.py ./data --pattern "*.xlsx" --output-dir ./out
   ```

4. **递归扫描子目录，转为 JSON，文件名添加自定义后缀**：
   ```bash
   python3 excel_transpose.py ./data --pattern "*.csv,*.xlsx" --format json \
     --suffix processed --recursive --output-dir ./json_out --no-index
   ```

5. **保留索引与表头**（默认开启，可用 `--no-index` / `--no-header` 关闭）：
   ```bash
   python3 excel_transpose.py sample_data.xlsx --output-dir ./out --include-index --include-header
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

## 常用参数说明

| 参数 | 说明 |
| ---- | ---- |
| `--format {xlsx,csv,json}` | 设置输出格式，默认 `xlsx` |
| `--output <文件路径>` | 指定单文件模式的输出文件名 |
| `--output-dir <目录>` | 批量模式下指定输出目录 |
| `--pattern "*.xlsx,*.csv"` | 目录模式匹配的文件通配符，支持多个（逗号分隔） |
| `--transpose / --no-transpose` | 控制是否进行行列转置，默认转置 |
| `--include-index / --no-index` | 控制输出是否保留索引，默认保留 |
| `--include-header / --no-header` | 控制输出是否保留表头（JSON 始终包含字段名） |
| `--suffix <文本>` | 自定义输出文件名后缀，默认 `_transposed` 或 `_converted` |
| `--overwrite` | 允许覆盖已存在的输出文件 |
| `--recursive` | 扫描目录时递归遍历子目录 |

## 文件说明

- `excel_transpose.py` - 主要的转换脚本
- `create_sample_excel.py` - 创建示例 Excel 文件
- `final_verify.py` - 验证转置结果的脚本
- `requirements.txt` - 依赖包列表

## 注意事项

1. 支持的输入格式：Excel（.xlsx/.xls/.xlsm）、CSV、JSON
2. JSON 输出采用 `records` 结构；若保留索引，会自动转为第一列
3. 转置后行列数量会互换，包含索引的情况下列数会 +1
4. 批量处理大文件时请注意内存占用，可分批处理或关闭转置

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