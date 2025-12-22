import { HBaseRestClient } from "./hbaseRestClient.js";

function argFlag(name) {
  return process.argv.includes(name);
}

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

async function main() {
  const table = process.env.HBASE_TABLE ?? "node_demo";
  const cf = process.env.HBASE_CF ?? "cf";
  const rowKey = process.env.HBASE_ROWKEY ?? `user#${Date.now()}`;

  const client = new HBaseRestClient({
    baseUrl: process.env.HBASE_REST_URL,
    timeoutMs: process.env.HBASE_REST_TIMEOUT_MS
  });

  console.log(`[config] HBASE_REST_URL=${client.baseUrl}`);
  console.log(`[config] table=${table} cf=${cf} rowKey=${rowKey}`);

  console.log("\n[1/5] create table if not exists...");
  await client.createTableIfNotExists(table, [cf]);
  console.log("ok");

  console.log("\n[2/5] put row...");
  await client.putRow(table, rowKey, [
    { column: `${cf}:name`, value: "alice" },
    { column: `${cf}:age`, value: 18 },
    { column: `${cf}:updated_at`, value: new Date().toISOString() }
  ]);
  console.log("ok");

  console.log("\n[3/5] get row...");
  const got = await client.getRow(table, rowKey);
  console.log(JSON.stringify(got, null, 2));

  if (argFlag("--scan")) {
    const prefix = argValue("--prefix", "user#");
    const limit = Number(argValue("--limit", "5"));
    console.log(`\n[4/5] scan (prefix=${prefix}, limit=${limit})...`);
    const rows = await client.scan(table, { prefix, limit });
    console.log(JSON.stringify(rows, null, 2));
  } else {
    console.log("\n[4/5] scan skipped (use --scan)");
  }

  if (argFlag("--no-delete")) {
    console.log("\n[5/5] delete skipped (use without --no-delete)");
  } else {
    console.log("\n[5/5] delete row...");
    await client.deleteRow(table, rowKey);
    console.log("ok");
  }
}

main().catch((err) => {
  console.error("\n[error]", err?.message ?? err);
  process.exitCode = 1;
});

