# JSON 转 CSV 工具

`json_to_csv.py` 用于把 JSON 数据转换成 CSV（方便用 Excel / Numbers / WPS 直接打开）。

## 功能特点

- 支持 JSON 顶层是数组：`[{...},{...}]`（输出多行）
- 支持 JSON 顶层是对象：`{...}`（输出单行），或用 `--root` 指定对象内部某个字段为数组
- 默认自动扁平化嵌套字段：`{"a":{"b":1}}` → 列 `a.b`
- 默认输出编码为 `utf-8-sig`（带 BOM，Excel 打开不乱码）

## 使用方法

### 基本用法

```bash
python3 json_to_csv.py input.json output.csv
```

如果不写 `output.csv`，默认输出为同名 `input.csv`。

### 指定根路径（对象里嵌一个数组）

例如你的 JSON 是：

```json
{
  "data": {
    "items": [
      { "id": 1, "name": "张三" },
      { "id": 2, "name": "李四" }
    ]
  }
}
```

可以这样转：

```bash
python3 json_to_csv.py input.json output.csv --root data.items
```

### 关闭扁平化（嵌套字段直接转成 JSON 字符串）

```bash
python3 json_to_csv.py input.json output.csv --no-flatten
```

### 列表字段处理策略

- `--list-mode join`（默认）：基础类型列表拼接（默认用 `;`），复杂列表转 JSON 字符串
- `--list-mode json`：列表/对象都转 JSON 字符串
- `--list-mode index`：列表按下标展开为多列：`tags[0]`、`tags[1]`…

示例：

```bash
python3 json_to_csv.py input.json output.csv --list-mode index
```

### 输出到 stdout（便于管道）

```bash
python3 json_to_csv.py input.json - > output.csv
```

### 设置分隔符（逗号 / 制表符）

```bash
python3 json_to_csv.py input.json output.csv --delimiter "\t"
```

## 常见问题

1. **字段不齐怎么办？**  
   脚本会自动合并所有行出现过的字段作为表头；某行缺失字段会留空。

2. **Excel 打开中文乱码？**  
   默认编码是 `utf-8-sig`（带 BOM），一般不会乱码；如需纯 UTF-8，可用：`--encoding utf-8`。

