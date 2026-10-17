import {test,expect,chromium} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {serveBuild,mockCloud,user,session,nav,login} from './fixtures.js';

test.beforeEach(async({context})=>serveBuild(context));
const selectMode=page=>page.getByRole('button',{name:'Selecionar vários'}).click();
const select= (page,id)=>page.locator(`[data-select-item="${id}"]`).check();
const all=page=>page.getByRole('button',{name:/Selecionar todos/}).click();
const mark=page=>page.getByRole('button',{name:'Marcar como adquirido',exact:true}).click();

test('seleção de killers inclui páginas ocultas, respeita filtros, preserva prestígio e confirma remoção',async({page})=>{
  const api=mockCloud();api.tables.dbc_collection=[{user_id:user.id,killer_id:'legion',prestige:7}];
  await api.route(page.context());await page.goto('/');await login(page);await nav(page,'collection');
  await selectMode(page);
  const first=page.locator('[data-select-item]').first();
  await first.check();await expect(page.locator('.bulk-toolbar [role=status]')).toHaveText('1 selecionados');
  await first.uncheck();await all(page);
  await expect(page.locator('.bulk-toolbar [role=status]')).toHaveText('44 selecionados');
  await expect(page.locator('[data-select-item]')).toHaveCount(24);
  await mark(page);await expect(page.locator('#notice')).toContainText('43 registros');
  expect(api.tables.dbc_collection).toHaveLength(44);
  expect(api.tables.dbc_collection.find(x=>x.killer_id==='legion').prestige).toBe(7);
  const writes=api.requests.filter(x=>x.method==='POST'&&x.url.pathname.endsWith('dbc_collection'));
  expect(writes).toHaveLength(1);expect(writes[0].body).toHaveLength(43);
  await page.setViewportSize({width:680,height:520});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByLabel('Pesquisar nesta página').fill('legion');await all(page);
  await expect(page.locator('.bulk-toolbar [role=status]')).toHaveText('1 selecionados');
  await page.getByLabel('Pesquisar nesta página').fill('nurse');
  await expect(page.locator('.bulk-toolbar [role=status]')).toHaveText('0 selecionados');
  await all(page);await page.getByRole('button',{name:'Desmarcar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Desmarcar 1 assassinos?'})).toBeVisible();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();expect(api.tables.dbc_collection).toHaveLength(44);
  await page.getByRole('button',{name:'Desmarcar',exact:true}).click();await page.getByRole('button',{name:'Confirmar remoção'}).click();
  await expect(page.locator('#notice')).toContainText('1 registros');expect(api.tables.dbc_collection).toHaveLength(43);
  const deletion=api.requests.find(x=>x.method==='DELETE');
  expect(deletion.url.searchParams.get('user_id')).toBe('eq.'+user.id);
  expect(deletion.url.searchParams.get('killer_id')).toBe('in.(nurse)');
  await page.locator('.killer-card').first().scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.killer-card img').first().evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.screenshot({path:'test-results/bulk-killers-compact.png'});
});

test('perks em lote são por killer; falhas mantêm seleção, níveis e dados anteriores',async({page})=>{
  const api=mockCloud();
  api.tables.dbc_collection=[{user_id:user.id,killer_id:'legion',prestige:0},{user_id:user.id,killer_id:'hillbilly',prestige:3}];
  api.tables.dbc_perk_unlocks=[{user_id:user.id,killer_id:'hillbilly',perk_id:'corrupt',tier:3}];
  await api.route(page.context());await page.goto('/');await login(page);await nav(page,'perks');await selectMode(page);
  await page.getByRole('combobox',{name:'Origem',exact:true}).selectOption('hillbilly');await all(page);
  await expect(page.locator('.bulk-toolbar [role=status]')).toContainText('3 selecionados');
  api.failWrite=true;await mark(page);await expect(page.locator('#notice')).toContainText('Falha simulada');
  await expect(page.locator('.bulk-toolbar [role=status]')).toContainText('3 selecionados');
  expect(api.tables.dbc_perk_unlocks).toHaveLength(1);
  api.failWrite=false;await mark(page);await expect(page.locator('#notice')).toContainText('3 registros');
  expect(api.tables.dbc_perk_unlocks.filter(x=>x.killer_id==='legion').map(x=>x.tier)).toEqual([3,3,3]);
  await all(page);await page.getByRole('button',{name:'Desmarcar',exact:true}).click();
  await expect(page.locator('#notice')).toContainText('3 registros');
  await expect(page.locator('.catalog-perk .pill.positive')).toHaveCount(0);
  expect(api.tables.dbc_perk_unlocks.find(x=>x.killer_id==='hillbilly').tier).toBe(3);
  await all(page);await page.getByRole('button',{name:'Voltar ao automático'}).click();
  await expect(page.locator('.catalog-perk .pill.positive')).toHaveCount(3);
  expect(api.tables.dbc_perk_unlocks).toHaveLength(1);
  await all(page);await page.getByLabel('Assassino selecionado').selectOption('nurse');
  await selectMode(page);await all(page);await expect(page.getByRole('button',{name:'Marcar como adquirido'})).toBeDisabled();
  await expect(page.locator('.bulk-toolbar')).toContainText('Adicione o assassino');
  await page.getByLabel('Assassino selecionado').selectOption('legion');await selectMode(page);
  await page.getByRole('combobox',{name:'Origem',exact:true}).selectOption('general');await all(page);await page.getByLabel('Nível mínimo').selectOption('2');await mark(page);
  await expect(page.locator('#notice')).toContainText('19 registros');
  await page.reload();await expect(page.locator('.stats')).toBeVisible();await nav(page,'perks');
  await page.getByRole('combobox',{name:'Origem',exact:true}).selectOption('general');
  await expect(page.locator('.catalog-perk .pill.positive')).toHaveCount(19);
  await selectMode(page);await all(page);await page.getByRole('button',{name:'Limpar seleção'}).click();
  await expect(page.locator('.bulk-toolbar [role=status]')).toContainText('0 selecionados');
  await page.setViewportSize({width:680,height:520});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.catalog-perk').first().scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.catalog-perk img').first().evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.screenshot({path:'test-results/bulk-perks-compact.png'});
});

test('sessão sobrevive ao encerramento do navegador, renova token vencido e logout remove sessão',async({},testInfo)=>{
  const profile=await mkdtemp(path.join(os.tmpdir(),'dbc-auth-test-'));
  const api=mockCloud();api.tables.dbc_collection=[{user_id:user.id,killer_id:'legion',prestige:4}];
  let context;
  const launch=async()=>{
    context=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.DBC_BROWSER?{executablePath:process.env.DBC_BROWSER}:{channel:'msedge'})});
    await serveBuild(context);await api.route(context);
    const page=await context.newPage();await page.goto(testInfo.project.use.baseURL);return page;
  };
  try {
    let page=await launch();await login(page);
    const key=await page.evaluate(()=>Object.keys(localStorage).find(k=>k.endsWith('-auth-token')));
    expect(key).toBeTruthy();
    expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('test-password');
    await context.close();
    page=await launch();await expect(page.locator('.stats article').first()).toContainText('1 / 44');
    expect(api.requests.filter(x=>x.url.pathname.includes('/token'))).toHaveLength(1);
    await page.evaluate(({key,expired})=>localStorage.setItem(key,JSON.stringify(expired)),{key,expired:session(-60)});
    await context.close();
    page=await launch();await expect(page.locator('.stats article').first()).toContainText('1 / 44');
    const refresh=api.requests.filter(x=>x.url.searchParams.get('grant_type')==='refresh_token');
    expect(refresh).toHaveLength(1);expect(refresh[0].body.refresh_token).toBe('test-refresh');
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).refresh_token,key)).toBe('rotated-refresh');
    await nav(page,'settings');await page.getByRole('button',{name:'Sair da conta'}).click();
    await expect(page.getByRole('heading',{name:'Sua coleção começa aqui'})).toBeVisible();
    expect(await page.evaluate(()=>localStorage.length)).toBe(0);
    await context.close();page=await launch();
    await expect(page.getByRole('heading',{name:'Sua coleção começa aqui'})).toBeVisible();
  } finally {
    await context?.close();
    if (!path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep+'dbc-auth-test-')) throw Error('Unexpected test profile path');
    await rm(profile,{recursive:true,force:true});
  }
});

test('refresh revogado volta ao login e limpa o token inválido',async({page})=>{
  const api=mockCloud();await api.route(page.context());await page.goto('/');await login(page);
  await page.evaluate(expired=>{const key=Object.keys(localStorage).find(k=>k.endsWith('-auth-token'));localStorage.setItem(key,JSON.stringify(expired));},session(-60));
  api.expired=true;await page.reload();
  await expect(page.getByRole('heading',{name:'Sua coleção começa aqui'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.length)).toBe(0);
});

test('falha de leitura não encerra sessão; repetir restaura dados sem novo login',async({page})=>{
  const api=mockCloud();await api.route(page.context());await page.goto('/');await login(page);
  api.failRead=true;await page.reload();
  await expect(page.getByRole('heading',{name:'Sua conta está conectada'})).toBeVisible({timeout:20000});
  expect(await page.evaluate(()=>localStorage.length)).toBe(1);
  api.failRead=false;await page.getByRole('button',{name:'Tentar novamente'}).click();
  await expect(page.locator('.stats')).toBeVisible();
  expect(api.requests.filter(x=>x.url.searchParams.get('grant_type')==='password')).toHaveLength(1);
});

test('falha no logout remoto ainda remove sessão local e informa a limitação',async({page})=>{
  const api=mockCloud();await api.route(page.context());await page.goto('/');await login(page);
  api.failLogout=true;await nav(page,'settings');await page.getByRole('button',{name:'Sair da conta'}).click();
  await expect(page.locator('#notice')).toContainText('Sessão removida deste dispositivo');
  expect(await page.evaluate(()=>localStorage.length)).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Sua coleção começa aqui'})).toBeVisible();
});
