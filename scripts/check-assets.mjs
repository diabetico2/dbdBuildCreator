import {readFile,writeFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile(new URL('../src/catalog-data.json',import.meta.url),'utf8'));
const env=await readFile(new URL('../.env',import.meta.url),'utf8').catch(()=> '');
const base=process.env.VITE_SUPABASE_URL||env.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1].trim();
const checkSources=process.argv.includes('--sources'),results=[];
// Sem --sources verifica apenas arquivos publicados. Não baixa nem copia imagens.
for(const a of catalog.assets){
 const url=checkSources?a.source_url:a.status==='ready'&&a.storage_path&&base?`${base}/storage/v1/object/public/dbc-assets/${a.storage_path}`:null;
 if(!url){results.push({id:a.id,status:a.status,checked:false,reason:a.license_note});continue;}
 try{const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(10000)});results.push({id:a.id,status:r.ok?'reachable':'broken',checked:true,http:r.status});}
 catch(e){results.push({id:a.id,status:'unverified',checked:false,error:e.cause?.code||e.message});if(e.cause?.code==='ENOTFOUND'){results.push({status:'stopped',reason:'DNS indisponível; repetir em ambiente com acesso à rede.'});break;}}
}
await writeFile(new URL('../docs/assets-check.json',import.meta.url),JSON.stringify({checked_at:new Date().toISOString(),results},null,2));
console.log(JSON.stringify({assets:catalog.assets.length,checked:results.filter(r=>r.checked).length,license_pending:results.filter(r=>r.status==='license_pending').length,broken:results.filter(r=>r.status==='broken').length}));
