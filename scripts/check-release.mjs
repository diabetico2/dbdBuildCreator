import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const json=file=>JSON.parse(readFileSync(file,'utf8'));
const version=json('package.json').version;
assert.equal(json('package-lock.json').version,version);
assert.equal(json('package-lock.json').packages[''].version,version);
assert.equal(json('src-tauri/tauri.conf.json').version,version);
assert.equal(readFileSync('src-tauri/Cargo.toml','utf8').match(/^version = "([^"]+)"/m)?.[1],version);
assert.equal(readFileSync('src-tauri/Cargo.lock','utf8').match(/name = "dbd-build-companion"\r?\nversion = "([^"]+)"/)?.[1],version);
if(process.env.GITHUB_REF_TYPE==='tag')assert.equal(process.env.GITHUB_REF_NAME,`v${version}`,'A tag deve corresponder à versão compilada.');
if(process.argv.includes('--production')) {
  assert.match(process.env.VITE_SUPABASE_URL||'',/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/,'Configure a URL pública do Supabase nas variáveis do Actions.');
  assert.ok((process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'').startsWith('sb_publishable_'),'Configure a chave publishable nas variáveis do Actions.');
  assert.ok(!/dbc-test|SEU_PROJETO/.test(process.env.VITE_SUPABASE_URL),'A release não pode usar o projeto fictício de testes.');
  assert.ok(!/test_fixture|SUBSTITUA/.test(process.env.VITE_SUPABASE_PUBLISHABLE_KEY),'A release não pode usar a chave fictícia de testes.');
}
console.log(`Versões consistentes: ${version}.`);
