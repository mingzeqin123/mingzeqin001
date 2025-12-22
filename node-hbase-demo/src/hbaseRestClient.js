function toBase64(input) {
  return Buffer.from(String(input), "utf8").toString("base64");
}

function fromBase64(input) {
  return Buffer.from(String(input), "base64").toString("utf8");
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return "http://localhost:8080";
  return String(baseUrl).replace(/\/+$/, "");
}

export class HBaseRestClient {
  /**
   * @param {{ baseUrl?: string, timeoutMs?: number }} opts
   */
  constructor(opts = {}) {
    this.baseUrl = normalizeBaseUrl(opts.baseUrl ?? process.env.HBASE_REST_URL);
    this.timeoutMs = Number(opts.timeoutMs ?? process.env.HBASE_REST_TIMEOUT_MS ?? 15000);
  }

  async request(path, { method = "GET", headers = {}, body, okStatuses } = {}) {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let res;
      try {
        res = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal
        });
      } catch (e) {
        const err = new Error(`HBase REST fetch failed: ${method} ${url}\n${e?.message ?? e}`);
        err.cause = e;
        err.url = url;
        throw err;
      }

      const ok = Array.isArray(okStatuses) ? okStatuses.includes(res.status) : res.ok;
      if (!ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(
          `HBase REST request failed: ${method} ${url} -> ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`
        );
        err.status = res.status;
        err.statusText = res.statusText;
        err.url = url;
        throw err;
      }

      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async tableExists(table) {
    try {
      await this.request(`/${encodeURIComponent(table)}/schema`, {
        method: "GET",
        headers: { Accept: "application/json" },
        okStatuses: [200]
      });
      return true;
    } catch (e) {
      if (e && e.status === 404) return false;
      throw e;
    }
  }

  async createTable(table, columnFamilies = ["cf"]) {
    const body = JSON.stringify({
      name: table,
      ColumnSchema: columnFamilies.map((name) => ({ name }))
    });

    // Stargate: PUT /<table>/schema
    await this.request(`/${encodeURIComponent(table)}/schema`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body,
      okStatuses: [200, 201]
    });
  }

  async createTableIfNotExists(table, columnFamilies = ["cf"]) {
    const exists = await this.tableExists(table);
    if (!exists) await this.createTable(table, columnFamilies);
  }

  /**
   * Put one row with one or more cells.
   * @param {string} table
   * @param {string} rowKey
   * @param {{ column: string, value: string|number|boolean, timestamp?: number }[]} cells
   */
  async putRow(table, rowKey, cells) {
    const payload = {
      Row: [
        {
          key: toBase64(rowKey),
          Cell: cells.map((c) => ({
            column: toBase64(c.column),
            ...(c.timestamp ? { timestamp: c.timestamp } : {}),
            $: toBase64(c.value)
          }))
        }
      ]
    };

    await this.request(`/${encodeURIComponent(table)}/${encodeURIComponent(rowKey)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload),
      okStatuses: [200, 201]
    });
  }

  /**
   * Get one row; returns decoded cells.
   * @param {string} table
   * @param {string} rowKey
   * @returns {Promise<{ rowKey: string, cells: { column: string, value: string, timestamp?: number }[] } | null>}
   */
  async getRow(table, rowKey) {
    try {
      const res = await this.request(`/${encodeURIComponent(table)}/${encodeURIComponent(rowKey)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        okStatuses: [200]
      });
      const json = await res.json();
      const row = json?.Row?.[0];
      if (!row) return null;

      return {
        rowKey: fromBase64(row.key),
        cells: (row.Cell ?? []).map((c) => ({
          column: fromBase64(c.column),
          value: fromBase64(c.$),
          ...(c.timestamp ? { timestamp: c.timestamp } : {})
        }))
      };
    } catch (e) {
      if (e && e.status === 404) return null;
      throw e;
    }
  }

  async deleteRow(table, rowKey) {
    await this.request(`/${encodeURIComponent(table)}/${encodeURIComponent(rowKey)}`, {
      method: "DELETE",
      okStatuses: [200, 202]
    });
  }

  /**
   * Scan rows using scanner endpoint.
   * - If your HBase REST doesn't support scanner/filter, you can skip using this.
   * @param {string} table
   * @param {{ prefix?: string, limit?: number }} opts
   * @returns {Promise<Array<{ rowKey: string, cells: { column: string, value: string, timestamp?: number }[] }>>}
   */
  async scan(table, opts = {}) {
    const limit = Number(opts.limit ?? 10);
    const prefix = opts.prefix ? String(opts.prefix) : "";

    // Use XML scanner since filter syntax is easier to express here.
    // HBase filter language examples:
    // - PrefixFilter ('user#')
    const filterXml = prefix ? `<filter>PrefixFilter ('${escapeXml(prefix)}')</filter>` : "";
    const body = `<Scanner batch="${limit}">${filterXml}</Scanner>`;

    const createRes = await this.request(`/${encodeURIComponent(table)}/scanner`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        Accept: "application/json"
      },
      body,
      okStatuses: [201]
    });

    const location = createRes.headers.get("location");
    if (!location) return [];

    // Location may be absolute; accept both absolute and relative.
    const scannerPath = location.startsWith("http") ? new URL(location).pathname : location;

    try {
      const res = await this.request(scannerPath, {
        method: "GET",
        headers: { Accept: "application/json" },
        okStatuses: [200]
      });

      const json = await res.json();
      const rows = json?.Row ?? [];
      return rows.map((r) => ({
        rowKey: fromBase64(r.key),
        cells: (r.Cell ?? []).map((c) => ({
          column: fromBase64(c.column),
          value: fromBase64(c.$),
          ...(c.timestamp ? { timestamp: c.timestamp } : {})
        }))
      }));
    } finally {
      // clean up scanner
      await this.request(scannerPath, { method: "DELETE", okStatuses: [200, 202] }).catch(() => {});
    }
  }
}

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

