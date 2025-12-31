/**
 * 发票识别/查验工具
 *
 * 目标：
 * - 兼容“微信服务市场 invokeService”的不同返回结构
 * - 尽可能从结构化字段或全文OCR文本中提取常见发票关键字段
 *
 * 注意：
 * - 具体 OCR/查验接口入参、出参会因服务商不同而不同，本工具尽量做“宽松解析”
 */

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function normalizeText(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function digitsOnly(str) {
  return normalizeText(str).replace(/[^\d]/g, '');
}

function toNumber(str) {
  const s = normalizeText(str).replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

function normalizeDateToYYYYMMDD(dateLike) {
  const s = normalizeText(dateLike);
  if (!s) return '';

  // 2025-12-31 / 2025.12.31 / 2025/12/31
  let m = s.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;

  // 2025年12月31日
  m = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;

  // 20251231
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  return s;
}

/**
 * 从任意对象中（深度优先）找第一个匹配 key（忽略大小写）的值
 */
function deepFindFirstByKeys(root, keysLower, maxNodes = 2000) {
  const stack = [root];
  const visited = new Set();
  let steps = 0;

  while (stack.length) {
    const cur = stack.pop();
    steps++;
    if (steps > maxNodes) break;
    if (!cur || typeof cur !== 'object') continue;
    if (visited.has(cur)) continue;
    visited.add(cur);

    if (Array.isArray(cur)) {
      for (let i = cur.length - 1; i >= 0; i--) stack.push(cur[i]);
      continue;
    }

    for (const k of Object.keys(cur)) {
      const kl = k.toLowerCase();
      if (keysLower.includes(kl)) return cur[k];
      stack.push(cur[k]);
    }
  }

  return undefined;
}

function pickFirstNonEmpty(...vals) {
  for (const v of vals) {
    const s = normalizeText(v);
    if (s) return s;
  }
  return '';
}

function extractTextCandidates(payload) {
  const texts = [];

  // 常见 OCR：TextDetections: [{DetectedText: '...'}]
  const textDetections = deepFindFirstByKeys(payload, ['textdetections', 'detections', 'text_detection', 'ocr_textdetections']);
  if (Array.isArray(textDetections)) {
    for (const item of textDetections) {
      if (isObject(item)) {
        const t = pickFirstNonEmpty(item.DetectedText, item.detectedText, item.text, item.Text);
        if (t) texts.push(t);
      } else {
        const t = normalizeText(item);
        if (t) texts.push(t);
      }
    }
  }

  // 其他：可能直接给 fullText / text
  const fullText = deepFindFirstByKeys(payload, ['fulltext', 'full_text', 'text', 'rawtext']);
  if (typeof fullText === 'string' && fullText.trim()) texts.push(fullText.trim());

  return texts;
}

function extractFromText(text) {
  const t = normalizeText(text);
  if (!t) return {};

  const result = {};

  // 发票代码：通常10/12位
  let m = t.match(/发票代码\s*[:：]?\s*([0-9\s-]{10,20})/);
  if (m) {
    const code = digitsOnly(m[1]);
    if (code.length >= 10) result.invoiceCode = code;
  }

  // 发票号码：通常8位
  m = t.match(/发票号码\s*[:：]?\s*([0-9\s-]{6,12})/);
  if (m) {
    const no = digitsOnly(m[1]);
    if (no.length >= 6) result.invoiceNumber = no;
  }

  // 开票日期
  m = t.match(/开票日期\s*[:：]?\s*([0-9]{4}[年.\-/][0-9]{1,2}[月.\-/][0-9]{1,2}日?|\d{8})/);
  if (m) result.invoiceDate = normalizeDateToYYYYMMDD(m[1]);

  // 校验码（全码可能20位；查验常用后6位）
  m = t.match(/校验码\s*[:：]?\s*([0-9\s]{6,30})/);
  if (m) {
    const cc = digitsOnly(m[1]);
    if (cc.length >= 6) result.checkCode = cc;
  }

  // 合计金额 / 价税合计 / 小写金额
  const amountPatterns = [
    /价税合计\s*[(（]小写[)）]?\s*[:：]?\s*[¥￥]?\s*([0-9,]+\.[0-9]{2})/,
    /合计\s*[:：]?\s*[¥￥]?\s*([0-9,]+\.[0-9]{2})/,
    /小写\s*[:：]?\s*[¥￥]?\s*([0-9,]+\.[0-9]{2})/
  ];
  for (const p of amountPatterns) {
    m = t.match(p);
    if (m) {
      const n = toNumber(m[1]);
      if (n !== null) {
        result.totalAmount = n;
        break;
      }
    }
  }

  return result;
}

/**
 * 统一服务市场响应：不同服务商可能返回 {data}, {result}, {Data} 等
 */
function unwrapInvokeServiceResponse(resp) {
  if (!resp) return resp;
  if (resp.data !== undefined) return resp.data;
  if (resp.result !== undefined) return resp.result;
  if (resp.Data !== undefined) return resp.Data;
  if (resp.Response !== undefined) return resp.Response;
  return resp;
}

/**
 * 尽可能从 OCR 响应中提取发票关键字段
 */
function extractInvoiceFieldsFromOcrResponse(resp) {
  const payload = unwrapInvokeServiceResponse(resp);

  const invoiceCode = digitsOnly(
    deepFindFirstByKeys(payload, ['invoicecode', 'fpdm', 'code', 'invoice_code'])
  );
  const invoiceNumber = digitsOnly(
    deepFindFirstByKeys(payload, ['invoiceno', 'invoicenumber', 'fphm', 'number', 'invoice_no', 'invoice_number'])
  );
  const invoiceDateRaw = pickFirstNonEmpty(
    deepFindFirstByKeys(payload, ['invoicedate', 'date', 'kprq', 'invoice_date']),
    deepFindFirstByKeys(payload, ['billingdate', 'billdate'])
  );
  const checkCode = digitsOnly(
    deepFindFirstByKeys(payload, ['checkcode', 'jym', 'verifycode', 'check_code', 'verificationcode'])
  );

  const totalAmountRaw = pickFirstNonEmpty(
    deepFindFirstByKeys(payload, ['totalamount', 'amount', 'jshj', 'total_amount', 'amounttotal']),
    deepFindFirstByKeys(payload, ['sum', 'total', 'grandtotal'])
  );
  const totalAmount = toNumber(totalAmountRaw);

  // 如果结构化字段不全，尝试用全文OCR兜底
  const textCandidates = extractTextCandidates(payload);
  const textJoin = textCandidates.join('\n');
  const fromText = extractFromText(textJoin);

  const merged = {
    invoiceCode: invoiceCode.length ? invoiceCode : pickFirstNonEmpty(fromText.invoiceCode),
    invoiceNumber: invoiceNumber.length ? invoiceNumber : pickFirstNonEmpty(fromText.invoiceNumber),
    invoiceDate: pickFirstNonEmpty(normalizeDateToYYYYMMDD(invoiceDateRaw), fromText.invoiceDate),
    checkCode: checkCode.length ? checkCode : pickFirstNonEmpty(fromText.checkCode),
    totalAmount: totalAmount !== null ? totalAmount : (fromText.totalAmount ?? null),
    raw: payload
  };

  return merged;
}

function buildVerifyPayload(invoice) {
  const invoiceCode = digitsOnly(invoice.invoiceCode);
  const invoiceNumber = digitsOnly(invoice.invoiceNumber);
  const invoiceDate = normalizeDateToYYYYMMDD(invoice.invoiceDate);
  const checkCode = digitsOnly(invoice.checkCode);
  const checkCodeLast6 = checkCode.length >= 6 ? checkCode.slice(-6) : '';

  // 兼容一些服务商字段命名：同时发送多组 key，服务方会忽略无关字段
  const totalAmount = invoice.totalAmount;
  const totalAmountStr = totalAmount === null || totalAmount === undefined ? '' : String(totalAmount);

  return {
    invoiceCode,
    invoiceNumber,
    invoiceDate,
    totalAmount,
    checkCodeLast6,

    // 常见别名
    fpdm: invoiceCode,
    fphm: invoiceNumber,
    kprq: invoiceDate,
    jshj: totalAmountStr,
    jym6: checkCodeLast6,
    checkCode: checkCode,
    check_code: checkCodeLast6
  };
}

function getMissingVerifyFields(invoice) {
  const missing = [];
  if (!digitsOnly(invoice.invoiceCode)) missing.push('发票代码');
  if (!digitsOnly(invoice.invoiceNumber)) missing.push('发票号码');
  if (!normalizeDateToYYYYMMDD(invoice.invoiceDate)) missing.push('开票日期');
  if (invoice.totalAmount === null || invoice.totalAmount === undefined || invoice.totalAmount === '') missing.push('价税合计(小写)');
  const cc = digitsOnly(invoice.checkCode);
  if (cc.length < 6) missing.push('校验码(后6位)');
  return missing;
}

module.exports = {
  unwrapInvokeServiceResponse,
  extractInvoiceFieldsFromOcrResponse,
  buildVerifyPayload,
  getMissingVerifyFields,
  normalizeDateToYYYYMMDD
};

