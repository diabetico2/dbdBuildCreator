import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {seedCatalog} from '../../src/catalog.js';
const env=await readFile('.env','utf8');const projectURL=env.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1].trim();
test.beforeEach(async({context})=>{
 if(!process.env.DBC_STATIC_TEST)return;
 const root=path.resolve('dist');
 await context.route('http://dbc.test/**',async route=>{
  const pathname=new URL(route.request().url()).pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){await route.abort();return;}
  try{await route.fulfill({status:200,body:await readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html'});}catch{await route.fulfill({status:404,body:'Not found'});}
 });
});
const nav=(page,id)=>page.locator(`nav [data-nav="${id}"]`).click();
async function add(page,id,prestige=1){
 await nav(page,'collection');await page.getByLabel('Pesquisar nesta página').fill(id);await page.locator(`[data-killer="${id}"]`).click();
 await page.getByLabel('Possuo este assassino').check();await page.getByLabel('Prestígio',{exact:true}).fill(String(prestige));await page.getByRole('button',{name:'Salvar coleção',exact:true}).click();
 await expect(page.locator('#notice')).toContainText('Coleção');await page.getByLabel('Fechar painel').click();
}
test('catálogo, coleção, substituição, favoritos e limpeza de sessão',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Explorar catálogo'}).click();
 await expect(page.locator('.stats article').first()).toContainText('0 / 44');
 await add(page,'legion',3);await add(page,'hillbilly');await add(page,'nurse');await add(page,'clown');
 await nav(page,'build');await expect(page.locator('.perk-card')).toHaveCount(4);await expect(page.locator('.build-choice')).toHaveCount(3);
 await page.screenshot({path:'test-results/generator-v2.png',fullPage:true});
 await page.locator('[data-replace="0"]').click();const replacement=await page.locator('[data-select-replacement]').first().getAttribute('data-select-replacement');await page.locator('[data-select-replacement]').first().click();
 await expect(page.locator(`.perk-card [data-perk="${replacement}"]`)).toBeVisible();
 await page.locator('[data-action="favorite"]').click();await page.getByLabel('Nome da build').fill('Minha Legião');await page.getByLabel('Notas opcionais').fill('Teste de estratégia');await page.locator('#favorite-form button').click();
 await nav(page,'favorites');await expect(page.locator('.favorite-card')).toHaveCount(1);await expect(page.locator('.favorite-card')).toContainText('Teste de estratégia');
 await page.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Notas opcionais').fill('Notas atualizadas');await page.locator('#favorite-form button').click();await expect(page.locator('.favorite-card')).toContainText('Notas atualizadas');
 await page.getByRole('button',{name:'Reabrir',exact:true}).click();await expect(page.locator('.perk-card')).toHaveCount(4);await expect(page.locator('.recommended .eyebrow')).toHaveText('Minha Legião');
 await page.locator('[data-replace="1"]').click();const editedId=await page.locator('[data-select-replacement]').first().getAttribute('data-select-replacement');await page.locator('[data-select-replacement]').first().click();await page.locator('[data-action="favorite"]').click();await page.locator('#favorite-form button').click();await nav(page,'favorites');await expect(page.locator('.favorite-card')).toHaveCount(1);await expect(page.locator('.favorite-card [data-perk="'+editedId+'"]')).toHaveCount(1);
 await nav(page,'perks');await page.getByLabel('Pesquisar nesta página').fill('enduring');await expect(page.locator('.catalog-grid .catalog-perk')).toHaveCount(1);await page.locator('.catalog-grid [data-perk="enduring"]').click();await page.getByLabel('Nível confirmado').selectOption('0');await expect(page.getByLabel('Nível confirmado')).toHaveValue('0');await page.getByLabel('Fechar painel').click();
 await nav(page,'settings');await page.getByLabel('Sinergias positivas e negativas').fill('2');await page.getByRole('button',{name:'Salvar ajustes'}).click();await expect(page.getByLabel('Sinergias positivas e negativas')).toHaveValue('2');
 await page.getByRole('button',{name:'Ver imagens e créditos'}).click();await expect(page.locator('.audit-list article')).toHaveCount(195);await page.getByLabel('Fechar painel').click();
 await nav(page,'favorites');await page.getByRole('button',{name:'Excluir',exact:true}).click();await page.getByRole('button',{name:'Excluir favorita',exact:true}).click();await expect(page.locator('.favorite-card')).toHaveCount(0);
 expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
 await nav(page,'settings');await page.getByRole('button',{name:'Sair da conta'}).click();await expect(page.getByRole('heading',{name:'Sua coleção começa aqui'})).toBeVisible();await page.getByRole('button',{name:'Explorar catálogo'}).click();await expect(page.locator('.stats article').first()).toContainText('0 / 44');expect(errors).toEqual([]);
});
test('todas as páginas cabem em 680x520; busca PT/EN e consulta sem rede',async({page})=>{
 await page.setViewportSize({width:680,height:520});await page.goto('/');await page.getByRole('button',{name:'Explorar catálogo'}).click();
 for(const route of ['home','collection','perks','favorites','settings','build','themes']){await nav(page,route);const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,10).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))}));expect(overflow.scroll<=overflow.width).toBe(true);}
 await nav(page,'collection');await page.getByLabel('Pesquisar nesta página').fill('Legião');await expect(page.locator('.killer-card')).toHaveCount(1);await page.getByLabel('Pesquisar nesta página').fill('Legion');await expect(page.locator('.killer-card')).toHaveCount(1);
 await page.getByLabel('Pesquisar nesta página').fill('');await page.getByRole('button',{name:/Carregar mais/}).click();await expect(page.locator('.killer-card')).toHaveCount(44);
 await nav(page,'perks');while(await page.getByRole('button',{name:/Carregar mais/}).count())await page.getByRole('button',{name:/Carregar mais/}).click();await expect(page.locator('.catalog-grid .catalog-perk')).toHaveCount(151);
 await page.context().setOffline(true);await expect(page.getByText(/Sem internet. Consultas/)).toBeVisible();await page.getByLabel('Pesquisar nesta página').fill('Enduring');await expect(page.locator('.catalog-grid .catalog-perk')).toHaveCount(1);await page.context().setOffline(false);
 await nav(page,'build');await page.getByLabel('Usar apenas perks disponíveis').uncheck();await expect(page.locator('.perk-card')).toHaveCount(4);await page.screenshot({path:'test-results/compact-v2.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('confirmação aceita link do projeto e rejeita domínio diferente antes de enviar',async({page})=>{
 const requests=[];await page.route('https://*.supabase.co/**',async route=>{requests.push({url:route.request().url(),body:route.request().postDataJSON()});await route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({code:'otp_expired',msg:'Email link is invalid or has expired'})});});
 await page.goto('/');await page.getByRole('button',{name:'Já recebi a confirmação'}).click();await page.getByLabel('E-mail',{exact:true}).fill('test@example.com');await page.getByLabel('Link ou código recebido por e-mail').fill('https://other-project.supabase.co/auth/v1/verify?type=email&token='+'a'.repeat(64));await page.getByRole('button',{name:'Confirmar e-mail',exact:true}).click();await expect(page.locator('#notice')).toContainText('Use o link original');expect(requests).toHaveLength(0);
 await page.getByLabel('E-mail',{exact:true}).fill('test@example.com');await page.getByLabel('Link ou código recebido por e-mail').fill(projectURL+'/auth/v1/verify?type=signup&token='+'a'.repeat(64));await page.getByRole('button',{name:'Confirmar e-mail',exact:true}).click();await expect(page.locator('#notice')).toContainText('expired');expect(requests).toHaveLength(1);expect(requests[0].body).toMatchObject({type:'email',token_hash:'a'.repeat(64)});
});
test('integração do cliente restaura coleção e favoritos ao entrar novamente (API simulada)',async({page})=>{
 const id='00000000-0000-4000-8000-000000000001',user={id,email:'test@example.com',aud:'authenticated',role:'authenticated'};
 const token=[{alg:'HS256',typ:'JWT'},{sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test'].map((x,i)=>i===2?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const tables={dbc_killers:seedCatalog.killers,dbc_perks:seedCatalog.perks,dbc_synergies:seedCatalog.synergies,dbc_config:[seedCatalog.config],dbc_assets:seedCatalog.assets,dbc_collection:[],dbc_perk_unlocks:[],dbc_preferences:[],dbc_favorites:[]};
 await page.route('https://*.supabase.co/**',async route=>{const req=route.request(),url=new URL(req.url());let body;
  if(url.pathname.includes('/auth/v1/token'))body={access_token:token,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user};
  else if(url.pathname.includes('/auth/v1/logout'))body={};
  else if(url.pathname.includes('/rest/v1/')){const t=url.pathname.split('/').at(-1);if(req.method()==='POST'){const row=req.postDataJSON(),keys=t==='dbc_collection'?['user_id','killer_id']:t==='dbc_perk_unlocks'?['user_id','killer_id','perk_id']:t==='dbc_preferences'?['user_id']:['id'];const saved={...row,...(t==='dbc_favorites'?{id:row.id||'00000000-0000-4000-8000-000000000002',created_at:new Date().toISOString()}: {})};tables[t]=tables[t].filter(x=>!keys.every(k=>x[k]===saved[k])).concat(saved);body=saved;}else body=req.headers().accept?.includes('vnd.pgrst.object')?(tables[t][0]||null):tables[t];}
  else body={};await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 const login=async()=>{await page.getByLabel('E-mail',{exact:true}).fill('test@example.com');await page.getByLabel('Senha',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page.locator('.stats')).toBeVisible();};
 await page.goto('/');await login();await add(page,'legion',3);await add(page,'hillbilly',1);await nav(page,'build');await expect(page.locator('.perk-card')).toHaveCount(4);await page.getByRole('button',{name:'Salvar favorita',exact:true}).click();await page.getByLabel('Nome da build').fill('Favorita persistida');await page.locator('#favorite-form button').click();await expect(page.locator('#notice')).toContainText('salva na nuvem');expect(tables.dbc_favorites).toHaveLength(1);
 await page.reload();await login();await expect(page.locator('.stats article').first()).toContainText('2 / 44');await nav(page,'favorites');await expect(page.locator('.favorite-card')).toContainText('Favorita persistida');expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);
});


test('builds temáticas: busca, requisitos, adaptação e notas preservadas no favorito',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Explorar catálogo'}).click();await nav(page,'themes');
 await expect(page.locator('.theme-card')).toHaveCount(19);
 await page.getByLabel('Perks da receita').selectOption('available');await expect(page.locator('.theme-card')).toHaveCount(0);
 await page.getByLabel('Perks da receita').selectOption('all');
 await page.getByLabel('Pesquisar nesta página').fill('nurse');await expect(page.locator('.theme-card')).toHaveCount(1);
 await page.locator('[data-preset="m1-nurse"]').click();
 await expect(page.locator('.theme-guide')).toContainText('Spasmodic Breath');await expect(page.locator('.perk-card')).toHaveCount(4);
 await expect(page.getByLabel('Usar apenas perks disponíveis')).toBeDisabled();
 await page.getByRole('button',{name:'Salvar favorita',exact:true}).click();await expect(page.locator('#notice')).toContainText('Adicione este assassino');
 await add(page,'nurse');await add(page,'clown');await add(page,'hillbilly');
 await nav(page,'themes');await page.locator('[data-preset="m1-nurse"]').click();
 await page.locator('[data-replace="0"]').click();await page.locator('[data-select-replacement]').first().click();
 await expect(page.locator('.recommended .eyebrow').first()).toContainText('Adaptada');
 await page.getByRole('button',{name:'Salvar favorita',exact:true}).click();
 await expect(page.getByLabel('Nome da build')).toHaveValue('M1 Nurse');
 await expect(page.getByLabel('Notas opcionais')).toContainText('Spasmodic Breath');
 await page.locator('#favorite-form button').click();await nav(page,'favorites');
 await expect(page.locator('.favorite-card')).toContainText('Spasmodic Breath');
 await page.getByRole('button',{name:'Reabrir',exact:true}).click();
 await expect(page.locator('.saved-notes')).toContainText('Spasmodic Breath');
 await nav(page,'themes');await page.locator('[data-preset="speedblitz-clown"]').click();
 await expect(page.locator('.theme-guide')).toContainText('Cheap Gin Bottle');
 await page.getByRole('button',{name:'Voltar às recomendações'}).click();
 await expect(page.locator('.theme-guide')).toHaveCount(0);await expect(page.locator('.perk-card')).toHaveCount(4);
 expect(errors).toEqual([]);
});

test('retratos e ícones locais carregam, layout compacto funciona e falhas têm fallback',async({page})=>{
 const external=[];page.on('request',req=>{if(req.resourceType()==='image'&&/^https?:/.test(req.url())&&!req.url().startsWith('http://dbc.test')&&!req.url().startsWith('http://127.0.0.1'))external.push(req.url());});
 await page.goto('/');await page.getByRole('button',{name:'Explorar catálogo'}).click();await nav(page,'themes');
 for(const card of await page.locator('.theme-card').all()){
  await card.scrollIntoViewIfNeeded();
  await expect.poll(()=>card.locator('img').evaluateAll(imgs=>imgs.length===5&&imgs.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
 }
 await page.screenshot({path:'test-results/themes-v3.png',fullPage:true});
 await page.setViewportSize({width:680,height:520});await page.screenshot({path:'test-results/themes-compact-v3.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await nav(page,'settings');await page.getByRole('button',{name:'Ver imagens e créditos'}).click();await expect(page.locator('.audit-list article')).toHaveCount(195);await expect(page.locator('.audit-list')).toContainText('Arte do nome legado equivalente');
 await page.getByLabel('Fechar painel').click();await page.getByRole('button',{name:'Sair da conta'}).click();
 await page.route('**/catalog/killers/trapper.webp',route=>route.fulfill({status:404,body:'Missing image'}));
 await page.getByRole('button',{name:'Explorar catálogo'}).click();await nav(page,'themes');
 await expect(page.locator('[data-theme-card="basement-trapper"]')).toContainText('Imagem indisponível');
 await page.locator('[data-preset="basement-trapper"]').click();await expect(page.locator('.theme-guide')).toContainText('porão');
 expect(external).toEqual([]);
});
