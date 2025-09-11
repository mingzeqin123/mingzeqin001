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