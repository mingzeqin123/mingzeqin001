# Excel 转置工具 / Excel Transpose Tool

这个工具可以将Excel文件的行和列进行互换（转置）。
This tool can transpose Excel files (swap rows and columns).

## 功能 / Features

- ✅ 支持 `.xlsx` 和 `.xls` 格式 / Supports `.xlsx` and `.xls` formats
- ✅ 支持多个工作表 / Supports multiple worksheets  
- ✅ 自动生成输出文件名 / Auto-generates output filename
- ✅ 保持数据完整性 / Maintains data integrity
- ✅ 中英文双语支持 / Bilingual Chinese/English support

## 使用方法 / Usage

### 基本用法 / Basic Usage
```bash
python3 transpose_excel.py input.xlsx
```

### 指定输出文件 / Specify Output File
```bash
python3 transpose_excel.py input.xlsx output.xlsx
```

### 查看帮助 / View Help
```bash
python3 transpose_excel.py
```

## 示例 / Example

原始数据 (Original data):
```
姓名/Name  年龄/Age  城市/City  职业/Job   薪资/Salary
张三       25        北京       工程师     8000
李四       30        上海       医生       12000
王五       35        广州       教师       6000
赵六       28        深圳       设计师     9000
```

转置后 (After transpose):
```
姓名/Name    张三    李四    王五    赵六
年龄/Age     25     30     35     28
城市/City    北京    上海    广州    深圳
职业/Job     工程师  医生    教师    设计师
薪资/Salary  8000   12000  6000   9000
```

## 安装依赖 / Install Dependencies

```bash
pip install pandas openpyxl --break-system-packages
```

## 文件说明 / Files

- `transpose_excel.py` - 主要的转置脚本 / Main transpose script
- `sample_data.xlsx` - 示例输入文件 / Sample input file  
- `sample_data_transposed.xlsx` - 示例输出文件 / Sample output file
- `create_sample_excel.py` - 创建示例文件的脚本 / Script to create sample file
- `verify_transpose.py` - 验证转置结果的脚本 / Script to verify transpose results

## 注意事项 / Notes

- 转置会将原文件的第1行变成新文件的第1列
- 转置会将原文件的第1列变成新文件的第1行  
- 支持包含中文字符的Excel文件
- 如果输入文件有多个工作表，每个工作表都会被转置

- Transpose converts the 1st row of original file to 1st column of new file
- Transpose converts the 1st column of original file to 1st row of new file
- Supports Excel files with Chinese characters
- If input file has multiple worksheets, each worksheet will be transposed