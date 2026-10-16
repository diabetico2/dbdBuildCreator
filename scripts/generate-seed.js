import { writeFile } from "node:fs/promises";
import { seedCatalog } from "../src/catalog.js";
const quote = (v) =>
  v == null
    ? "null"
    : typeof v === "number"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
const encode = (key, v) =>
  key === "tags"
    ? `array[${v.map(quote).join(",")}]::text[]`
    : ["weights", "affinities", "metadata"].includes(key)
      ? `${quote(JSON.stringify(v))}::jsonb`
      : quote(v);
function normalized(row, keys) {
  const data = {},
    metadata = {};
  for (const [k, v] of Object.entries(row))
    (keys.includes(k) ? data : metadata)[k] = v;
  return { ...data, metadata };
}
const killers = seedCatalog.killers.map((k) =>
  normalized(k, ["id", "name", "tags", "description", "source_url"]),
);
const perks = seedCatalog.perks.map((p) =>
  normalized(p, [
    "id",
    "name",
    "owner_id",
    "category",
    "strength",
    "effect",
    "affinities",
    "source_url",
  ]),
);
const rows = (table, data, conflict = ["id"]) =>
  data
    .map((row) => {
      const keys = Object.keys(row);
      return `insert into public.${table} (${keys.join(",")}) values (${keys.map((k) => encode(k, row[k])).join(",")}) on conflict (${conflict.join(",")}) do update set ${keys
        .filter((k) => !conflict.includes(k))
        .map((k) => `${k}=excluded.${k}`)
        .join(",")};`;
    })
    .join("\n");
const sql = [
  "-- Catálogo revisado. Atualiza somente dados editoriais; preserva coleções e favoritos.",
  "begin;",
  rows("dbc_killers", killers),
  rows("dbc_perks", perks),
  rows("dbc_synergies", seedCatalog.synergies, ["perk_a", "perk_b"]),
  rows("dbc_config", [seedCatalog.config]),
  rows("dbc_assets", seedCatalog.assets),
  "commit;",
  "",
].join("\n");
await writeFile(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(
  "Catálogo completo preparado: " +
    killers.length +
    " assassinos, " +
    perks.length +
    " perks, " +
    seedCatalog.assets.length +
    " assets.",
);
