# 发票上传识别与真伪查验指南

本项目新增了一个页面：`pages/invoice/invoice`，用于**上传发票图片 → 自动识别并展示发票信息 →（可选）发票真伪查验**。

由于本仓库未包含后端/云函数，OCR 与查验默认通过**微信服务市场**调用（`wx.serviceMarket.invokeService`），并且**默认关闭**，避免未配置导致报错。

## 功能概览

- ✅ 上传发票图片（相册/相机）
- ✅ OCR识别后自动回填展示（可手动修正）
- ✅ 真伪查验（需开通并配置服务市场接口）
- ✅ 缺少查验必填字段时给出提示

## 如何启用 OCR 与真伪查验

打开配置文件：

- `utils/invoice-service-config.js`

将对应能力开关打开并填写服务信息：

- `ocr.enabled = true`
- `ocr.service = '<你的serviceId>'`
- `ocr.api = '<你的api名称>'`
- `verify.enabled = true`
- `verify.service = '<你的serviceId>'`
- `verify.api = '<你的api名称>'`

如你的服务商需要额外固定字段，可在 `extraData` 中补充（会原样透传到 `invokeService` 的 `data`）。

## 查验所需字段（页面可手动填写）

页面查验通常需要（不同服务商略有差异）：

- 发票代码（`invoiceCode` / `fpdm`）
- 发票号码（`invoiceNumber` / `fphm`）
- 开票日期（`invoiceDate` / `kprq`，建议 `YYYY-MM-DD`）
- 价税合计（小写）（`totalAmount` / `jshj`）
- 校验码后6位（由 `checkCode` 自动取后6位，也可直接填后6位）

## 注意事项

- `wx.serviceMarket` 需要较新的基础库；若基础库不支持，会提示无法调用。
- 不同服务商的入参/出参字段不完全一致：
  - 本项目会尽量用“多字段名并发传参 + 宽松解析”的方式兼容
  - 若查验返回了结果但无法自动判定，会显示“已返回结果”，并把原始响应打印到控制台，便于你按服务商文档做精确解析

