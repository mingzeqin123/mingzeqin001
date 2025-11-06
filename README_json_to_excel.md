# JSON 转 Excel 工具

`json_to_excel.py` 是一个将 JSON 数据快速转换为 Excel (`.xlsx`) 文件的命令行工具，适用于批量数据导出、日志分析和数据清洗等场景。

## ✨ 功能特点
- 支持标准 JSON 与换行分隔 JSON (NDJSON)
- 自动展开嵌套字段，生成扁平化表格
- 支持通过 `--root-key` 指定嵌套数据所在的键路径
- 可选保留嵌套结构（不展开），方便自定义处理
- Sheet 名称、输出路径、缺失值填充值均可配置

## 📦 安装依赖

```bash
pip install --break-system-packages -r requirements.txt
```

`requirements.txt` 已包含 `pandas` 与 `openpyxl`，确保脚本能够读写 Excel 文件。

## 🚀 使用方法

```bash
python3 json_to_excel.py <输入文件> [输出文件] [可选参数]
```

### 常用参数

| 参数 | 说明 | 示例 |
| ---- | ---- | ---- |
| `input` (必填) | 输入 JSON 文件路径 | `data.json` |
| `output` | 输出 Excel 路径，省略时与输入同名后缀改为 `.xlsx` | `out/report.xlsx` |
| `--sheet-name` | Excel 工作表名称 | `--sheet-name 数据报表` |
| `--root-key` | 指定嵌套中的数据列表，使用点号分隔 | `--root-key payload.items` |
| `--keep-nested` | 不展开嵌套字段，保持原结构 | `--keep-nested` |
| `--na-rep` | 将缺失值写入 Excel 时的填充值 | `--na-rep N/A` |

### 示例

1. **最简单的转换**
   ```bash
   python3 json_to_excel.py logs.json
   ```
   输出文件为 `logs.xlsx`，位于同目录下。

2. **指定输出路径与 Sheet 名称**
   ```bash
   python3 json_to_excel.py data/users.json reports/users.xlsx --sheet-name 用户列表
   ```

3. **从嵌套结构中提取数据列表**
   当 JSON 结构如下：

   ```json
   {
     "meta": {"version": "1.0"},
     "payload": {
       "items": [
         {"id": 1, "user": {"name": "Alice", "city": "北京"}},
         {"id": 2, "user": {"name": "Bob", "city": "上海"}}
       ]
     }
   }
   ```

   使用命令：

   ```bash
   python3 json_to_excel.py nested.json --root-key payload.items
   ```
   结果将自动展开 `user.name`、`user.city` 等字段。

4. **保留嵌套结构**
   ```bash
   python3 json_to_excel.py events.ndjson --keep-nested
   ```
   输出的 Excel 中会保留原始嵌套对象（以 JSON 字符串形式显示）。

## ❓ 常见问题

- **Q：脚本提示“未检测到有效的 JSON 数据”怎么办？**
  - A：请确认文件是合法的 JSON 或 NDJSON 格式，并为 UTF-8 编码。

- **Q：如何处理数组里不是对象而是字符串/数字的情况？**
  - A：脚本会自动创建一列 `value` 来存放这些原始值。

- **Q：Sheet 名称有限制吗？**
  - A：Excel Sheet 名称长度不能超过 31 个字符，脚本会在设置失败时给出提示。

## 🧪 测试建议

```bash
python3 json_to_excel.py your-data.json output.xlsx
```

> 将 `your-data.json` 替换为实际 JSON 文件路径，`output.xlsx` 可按需调整。

## 📝 相关文件

- `json_to_excel.py`：主转换脚本
- `requirements.txt`：依赖列表（pandas、openpyxl）

如有改进建议，欢迎提 Issue 或提交 PR！
