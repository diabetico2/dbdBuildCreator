import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCloud} from '../src/cloud.js';
const env={VITE_SUPABASE_URL:'https://dbc-test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_fixture'};
test('armazenamento indisponível falha explicitamente, sem login temporário disfarçado',()=>{
  assert.throws(()=>createCloud(env,null),/Armazenamento/);
  assert.throws(()=>createCloud(env,{setItem(){throw Error('denied');}}),/salvar a sessão/);
  assert.throws(()=>createCloud({...env,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_example'},{}),/chave pública/);
});
test('Tauri mantém perfil persistente, identidade do aplicativo e CSP restritiva',async()=>{
  const config=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
  assert.equal(config.identifier,'com.dbdcompanion.desktop');
  assert.equal(config.app.windows[0].incognito,false);
  assert.deepEqual(config.app.security.capabilities,[]);
  assert.match(config.app.security.csp,/script-src 'self';/);
  assert.doesNotMatch(config.app.security.csp,/unsafe-inline|unsafe-eval/);
  assert.match(config.app.security.csp,/connect-src 'self' https:\/\/\*\.supabase\.co;/);
});
