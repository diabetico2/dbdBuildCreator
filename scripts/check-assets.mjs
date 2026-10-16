import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import manifest from "../src/asset-manifest.json" with { type: "json" };
const checkSources = process.argv.includes("--sources"),
  results = [];
for (const a of manifest.assets) {
  const result = {
    id: a.id,
    path: a.path,
    variant: a.variant,
    source_url: a.source_url,
  };
  try {
    if (!/^catalog\/(killers|perks)\/[a-z0-9-]+\.webp$/.test(a.path))
      throw Error("Caminho inválido");
    const data = await readFile(
      new URL("../public/" + a.path, import.meta.url),
    );
    if (
      data.toString("ascii", 0, 4) !== "RIFF" ||
      data.toString("ascii", 8, 12) !== "WEBP"
    )
      throw Error("Formato inválido");
    if (
      data.length !== a.bytes ||
      createHash("sha256").update(data).digest("hex") !== a.sha256
    )
      throw Error("Hash ou tamanho diferente do manifesto");
    Object.assign(result, { status: "ready", bytes: data.length });
  } catch (error) {
    Object.assign(result, { status: "broken", error: error.message });
  }
  if (checkSources) {
    try {
      const r = await fetch(a.source_url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
      });
      result.source_http = r.status;
    } catch (error) {
      result.source_error = error.message;
    }
  }
  results.push(result);
}
const summary = {
  assets: results.length,
  ready: results.filter((r) => r.status === "ready").length,
  broken: results.filter((r) => r.status === "broken").length,
  bytes: results.reduce((sum, r) => sum + (r.bytes || 0), 0),
  legacy_equivalent: results.filter((r) => r.variant === "legacy_equivalent")
    .length,
};
await writeFile(
  new URL("../docs/assets-check.json", import.meta.url),
  JSON.stringify(
    { checked_at: new Date().toISOString(), summary, results },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(summary));
if (summary.broken) process.exitCode = 1;
