import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {seedCatalog as catalog} from '../src/catalog.js';
import {assetUrl,assetSummary,localAsset} from '../src/asset-source.js';
import manifest from '../src/asset-manifest.json' with {type:'json'};

test('195 imagens locais correspondem ao catálogo e aos hashes publicados',async()=>{
 assert.equal(manifest.assets.length,catalog.assets.length);assert.equal(new Set(manifest.assets.map(a=>a.id)).size,195);
 let bytes=0;
 for(const asset of catalog.assets){
  const record=manifest.assets.find(a=>a.id===asset.id);assert.ok(record);
  const local=localAsset(asset.id);assert.equal(local.path,record.path);assert.equal(local.source_url,record.source_url);assert.equal(local.variant,record.variant);
  const data=await readFile(new URL('../public/'+local.path,import.meta.url));bytes+=data.length;
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.equal(data.length,record.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),record.sha256);
  assert.ok(record.width>0&&record.height>0);
 }
 assert.ok(bytes<5_000_000);assert.deepEqual(assetSummary(catalog),{ready:195,pending:0,legacy:2});
});
test('imagens locais funcionam com banco antigo e fallback só aceita paths seguros',()=>{
 assert.equal(assetUrl(catalog.assets[0],undefined),'./'+localAsset(catalog.assets[0].id).path);
 const a={id:'not-local',status:'ready',storage_path:'perks/new-perk.webp'};
 assert.equal(assetUrl(a,'https://example.supabase.co'),'https://example.supabase.co/storage/v1/object/public/dbc-assets/perks/new-perk.webp');
 for(const base of ['https://example.com','http://example.supabase.co','https://a.supabase.co.evil.test','https://name:password@a.supabase.co','https://a.supabase.co/another'])assert.equal(assetUrl(a,base),null);
 for(const path of ['../file.webp','perks/../../file.webp','https://evil.test/a.png','perks/a.svg'])assert.equal(assetUrl({...a,storage_path:path},'https://example.supabase.co'),null);
});
