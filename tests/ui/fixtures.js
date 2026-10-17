import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {expect} from '@playwright/test';
import {seedCatalog} from '../../src/catalog.js';

export const user={id:'00000000-0000-4000-8000-000000000001',email:'test@example.com',aud:'authenticated',role:'authenticated'};
export function session(expiresIn=3600, refresh='test-refresh') {
  const expires_at=Math.floor(Date.now()/1000)+expiresIn;
  const access_token=[{alg:'HS256',typ:'JWT'},{sub:user.id,role:'authenticated',aud:'authenticated',exp:expires_at},'test'].map((x,i)=>i===2?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  return {access_token,token_type:'bearer',expires_in:expiresIn,expires_at,refresh_token:refresh,user};
}
export async function serveBuild(context) {
  if(!process.env.DBC_STATIC_TEST)return;
  const root=path.resolve('dist');
  await context.route('http://dbc.test/**',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep))return route.abort();
    try { await route.fulfill({body:await readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html'}); }
    catch { await route.fulfill({status:404,body:'Not found'}); }
  });
}
export function mockCloud() {
  const tables={dbc_killers:seedCatalog.killers,dbc_perks:seedCatalog.perks,dbc_synergies:seedCatalog.synergies,dbc_config:[seedCatalog.config],dbc_assets:seedCatalog.assets,dbc_collection:[],dbc_perk_unlocks:[],dbc_preferences:[],dbc_favorites:[]};
  const api={tables,requests:[],failWrite:false,failRead:false,expired:false,failLogout:false};
  api.route=async context=>{
    await context.route('https://*.supabase.co/**',async route=>{
      const req=route.request(),url=new URL(req.url()),method=req.method();
      api.requests.push({url,method,body:req.postData()&&req.postDataJSON()});
      let body={},status=200;
      if(url.pathname.includes('/auth/v1/token')) {
        if(api.expired&&url.searchParams.get('grant_type')==='refresh_token') {status=400;body={code:'refresh_token_not_found',msg:'Refresh Token Not Found'};}
        else body=session(3600,url.searchParams.get('grant_type')==='refresh_token'?'rotated-refresh':'test-refresh');
      } else if(url.pathname.includes('/auth/v1/logout')) {
        if(api.failLogout){status=503;body={message:'unavailable'};}
      } else if(url.pathname.includes('/rest/v1/')) {
        const t=url.pathname.split('/').at(-1);
        const matches=row=>[...url.searchParams].every(([key,value])=>{
          if(value.startsWith('eq.'))return String(row[key])===value.slice(3);
          if(value.startsWith('in.('))return value.slice(4,-1).split(',').includes(row[key]);
          return true;
        });
        if((method==='GET'&&api.failRead)||(method!=='GET'&&api.failWrite)) {status=503;body={message:'Falha simulada'};}
        else if(method==='POST') {
          const payload=req.postDataJSON(),rows=Array.isArray(payload)?payload:[payload],saved=[];
          const keys=t==='dbc_collection'?['user_id','killer_id']:t==='dbc_perk_unlocks'?['user_id','killer_id','perk_id']:t==='dbc_preferences'?['user_id']:['id'];
          for(const row of rows) {
            const index=tables[t].findIndex(x=>keys.every(k=>x[k]===row[k]));
            if(index>=0&&req.headers().prefer?.includes('ignore-duplicates'))continue;
            const next={...row};
            if(index>=0)tables[t][index]=next;else tables[t].push(next);
            saved.push(next);
          }
          body=Array.isArray(payload)?saved:saved[0];
        } else if(method==='DELETE') {
          body=tables[t].filter(matches);tables[t]=tables[t].filter(x=>!matches(x));
          if(t==='dbc_collection')for(const dependent of ['dbc_perk_unlocks','dbc_favorites'])tables[dependent]=tables[dependent].filter(x=>!body.some(row=>row.user_id===x.user_id&&row.killer_id===x.killer_id));
        } else {
          const rows=tables[t].filter(matches);
          body=req.headers().accept?.includes('vnd.pgrst.object')?(rows[0]||null):rows;
        }
      }
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    });
  };
  return api;
}
export const nav=(page,id)=>page.locator(`nav [data-nav="${id}"]`).click();
export async function login(page) {
  await page.getByLabel('E-mail',{exact:true}).fill(user.email);
  await page.getByLabel('Senha',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.locator('.stats')).toBeVisible();
}
