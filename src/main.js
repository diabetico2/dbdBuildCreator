import "./style.css";
import {
  seedCatalog,
  styles,
  categories,
  perkName,
  normalize,
} from "./catalog.js";
import {
  availablePerks,
  alternatives,
  normalizeWeights,
  scoreBuild,
  family,
} from "./recommender.js";
import { createCloud, loadCloud, upsert, remove, acquireKillers, savePerkUnlocks, removeKillers, resetPerkUnlocks } from "./cloud.js";
import { newKillers, perkUnlocks } from "./bulk.js";
import { emailVerification } from "./email-verification.js";
import { icon } from "./icons.js";
import {
  assetView,
  mountAssets,
  clearAssets,
  assetFailures,
} from "./assets.js";
import { assetCredits, assetSummary } from "./asset-source.js";
import {
  themedBuilds,
  themedStatus,
  prepareThemedBuild,
  themedNotes,
} from "./themed-builds.js";
const app = document.querySelector("#app");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let cloud = null,
  configurationError = "";
try {
  cloud = createCloud();
} catch (e) {
  configurationError = e.message;
}
const initialPreferences = () => ({
  style: "balanced",
  selected_killer: "legion",
  weights: {},
  compact: false,
  only_available: true,
  sidebar_collapsed: false,
});
let state = {
  restoring: !!cloud,
  dataReady: false,
  selection: null,
  bulkTier: 1,
  user: null,
  demo: false,
  route: "home",
  catalog: seedCatalog,
  collection: [],
  overrides: [],
  favorites: [],
  preferences: initialPreferences(),
  result: null,
  buildIndex: 0,
  authMode: "login",
  busy: false,
  loading: false,
  search: "",
  themeKiller: "all",
  themeAvailability: "all",
  collectionFilter: "all",
  prestigeFilter: "all",
  sort: "name",
  perkAvailability: "all",
  owner: "all",
  category: "all",
  limit: 24,
  drawer: null,
  rotation: 0,
  lastConsulted: null,
};
let worker = null,
  job = 0,
  revision = 0,
  noticeTimer,
  drawerReturn;
const cache = new Map();
const weights = () =>
  normalizeWeights({
    ...state.catalog.config.weights,
    ...state.preferences.weights,
  });
const selected = () =>
  state.catalog.killers.find((k) => k.id === state.preferences.selected_killer);
const currentBuild = () => state.result?.builds[state.buildIndex];
const pool = () =>
  availablePerks(
    state.catalog,
    state.collection,
    state.overrides,
    state.preferences.selected_killer,
  );
const owned = (id) => state.collection.find((k) => k.killer_id === id);
const perk = (id) => state.catalog.perks.find((p) => p.id === id);
const killer = (id) => state.catalog.killers.find((k) => k.id === id);
const input = () => ({
  catalog: state.catalog,
  collection: state.collection,
  overrides: state.overrides,
  killerId: selected()?.id,
  style: state.preferences.style,
  weights: weights(),
  onlyAvailable: state.preferences.only_available,
  rotation: state.rotation,
});
const imageFor = (entity, kind = "perk") =>
  assetView(
    state.catalog.assets?.find(
      (a) =>
        a.id ===
        (kind === "portrait" ? entity.portrait_asset : entity.icon_asset),
    ),
    kind === "portrait" ? entity.name : perkName(entity),
    escape,
    kind,
  );
const pname = (p) => escape(perkName(p));
const empty = (title, text, action = "") =>
  `<section class="empty"><h2>${title}</h2><p>${text}</p>${action}</section>`;
function notify(message, error = false) {
  const n = document.querySelector("#notice");
  n.textContent = message;
  n.className = error ? "visible error" : "visible";
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (n.className = ""), 7000);
}
function invalidate() {
  revision++;
  cache.clear();
  state.editingFavoriteId = null;
  state.result = null;
  job++;
  worker?.terminate();
  worker = null;
  state.loading = false;
}
function reset() {
  invalidate();
  clearAssets();
  state = {
    ...state,
    restoring: false,
    dataReady: false,
    selection: null,
    user: null,
    demo: false,
    catalog: seedCatalog,
    collection: [],
    overrides: [],
    favorites: [],
    route: "home",
    busy: false,
    search: "",
    drawer: null,
    preferences: initialPreferences(),
    themeKiller: "all",
    themeAvailability: "all",
    lastConsulted: null,
  };
}
function errorText(e) {
  if (["refresh_token_not_found", "refresh_token_already_used", "session_not_found"].includes(e?.code))
    return "Sua sessão expirou. Entre novamente para acessar sua coleção.";
  if (e?.code === "email_address_not_authorized")
    return "O envio padrão do Supabase atende membros da organização. Use o e-mail da conta Supabase ou configure um SMTP próprio.";
  if (e?.code === "over_email_send_rate_limit")
    return "Limite de e-mails atingido. Aguarde antes de solicitar outro.";
  if (e?.message?.includes("Invalid login"))
    return "E-mail ou senha inválidos.";
  if (e?.message?.includes("Email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (e?.message?.includes("Failed to fetch") || e?.name === "TimeoutError")
    return "Sem resposta da nuvem. A gravação não foi confirmada; recarregue os dados antes de repetir.";
  return e?.message || "Não foi possível concluir.";
}
async function act(task) {
  if (state.busy) return;
  state.busy = true;
  app.setAttribute("aria-busy", "true");
  app
    .querySelectorAll("button,input,select,textarea")
    .forEach((x) => (x.disabled = true));
  try {
    await task();
    state.syncError = false;
  } catch (e) {
    state.syncError = true;
    notify(errorText(e), true);
  } finally {
    state.busy = false;
    app.removeAttribute("aria-busy");
    render();
  }
}
async function hydrate() {
  const id = state.user.id,
    data = await loadCloud(cloud, id);
  if (state.user?.id !== id) throw Error("A sessão terminou.");
  state = {
    ...state,
    ...data,
    dataReady: true,
    preferences: { ...initialPreferences(), ...data.preferences },
  };
  ensureSelected();
  invalidate();
}
function ensureSelected() {
  if (!selected())
    state.preferences.selected_killer =
      state.collection[0]?.killer_id || state.catalog.killers[0]?.id;
}
async function savePreferences(next) {
  const prefs = { ...state.preferences, ...next };
  if (!state.demo)
    await upsert(cloud, "dbc_preferences", {
      ...prefs,
      user_id: state.user.id,
    });
  state.preferences = prefs;
  if (
    ["weights", "style", "selected_killer", "only_available"].some(
      (k) => k in next,
    )
  ) {
    state.rotation = 0;
    invalidate();
  }
  if ("selected_killer" in next) {
    state.selection = null;
    state.lastConsulted = next.selected_killer;
  }
}
function authView() {
  const mode = state.authMode;
  return `<main class="auth"><div class="auth-art"><div class="brand-mark">/ / /</div><span class="eyebrow">SEU PRÓXIMO LOADOUT</span><h1>Entre na Névoa.<br><span>Com um plano.</span></h1><p>Suas vantagens. Seu estilo.<br>Quatro escolhas que fazem sentido.</p><div class="auth-diamonds"><i>◇</i><i>◇</i><i>◇</i><i>◇</i></div><small>Companheiro independente de builds de Dead by Daylight</small></div><section class="auth-panel"><span class="eyebrow">DBD BUILD COMPANION <b>0.4.0</b></span><h2>${{ login: "Sua coleção começa aqui", register: "Criar sua conta", confirm: "Confirmar e-mail", recover: "Recuperar acesso", reset: "Definir nova senha" }[mode]}</h2><p>Seu progresso fica na nuvem. Você permanece conectado neste dispositivo até sair da conta.</p>${!cloud ? `<div class="banner warning">${escape(configurationError || "A conexão com o Supabase ainda não foi configurada. O modo de demonstração permite conhecer o aplicativo.")}</div>` : ""}<form id="auth-form"><label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label>${["login", "register", "reset"].includes(mode) ? `<label>Senha<input name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="${mode === "login" ? 1 : 10}" maxlength="128" required></label>` : ""}${["confirm", "reset"].includes(mode) ? '<label>Link ou código recebido por e-mail<input name="token" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" required maxlength="4096"></label><small class="muted">No e-mail, clique com o botão direito no botão de confirmação e escolha “Copiar endereço do link”. Cole aqui, sem abrir o link. Se recebeu um código, digite-o.</small>' : ""}<button class="primary full" ${!cloud ? "disabled" : ""}>${{ login: "Entrar", register: "Criar conta", confirm: "Confirmar e-mail", recover: "Enviar e-mail de recuperação", reset: "Confirmar e trocar senha" }[mode]}</button></form><div class="auth-links">${mode === "login" ? '<button data-auth="register">Criar conta</button><button data-auth="recover">Esqueci minha senha</button>' : '<button data-auth="login">Voltar para entrar</button>'}${["login", "register"].includes(mode) ? '<button data-auth="confirm">Já recebi a confirmação</button>' : ""}${mode === "recover" ? '<button data-auth="reset">Já recebi a recuperação</button>' : ""}</div><div class="divider">ou conheça primeiro</div><button class="secondary full" data-action="demo">Explorar catálogo →</button><small class="muted">Modo visitante: comece com a coleção vazia. Entre para salvar.</small></section></main>`;
}
const nav = {
  home: ["house", "Início"],
  collection: ["library", "Minha coleção"],
  build: ["wand-sparkles", "Gerador de builds"],
  themes: ["gem", "Builds temáticas"],
  perks: ["gem", "Catálogo de perks"],
  favorites: ["heart", "Builds favoritas"],
  settings: ["settings", "Configurações"],
};
function killerOptions(all = true) {
  return state.catalog.killers
    .filter((k) => all || owned(k.id))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map(
      (k) =>
        `<option value="${escape(k.id)}" ${k.id === selected()?.id ? "selected" : ""}>${escape(k.name)}${owned(k.id) ? ` · P${owned(k.id).prestige}` : ""}</option>`,
    )
    .join("");
}
function title(text, subtitle, extra = "") {
  return `<div class="page-title"><div><span class="eyebrow">SEU COMPANHEIRO NA NÉVOA</span><h1>${text}</h1><p>${subtitle}</p></div>${extra}</div>`;
}
function render() {
  document.body.classList.toggle("compact", state.preferences.compact);
  if (state.restoring) {
    app.innerHTML = empty("Restaurando sua sessão…", "Conectando à sua conta.");
    return;
  }
  if (state.user && !state.dataReady) {
    app.innerHTML = empty("Sua conta está conectada", "Não foi possível carregar seus dados. Verifique a conexão e tente novamente.", '<button class="primary" data-action="sync">Tentar novamente</button><button class="secondary" data-action="logout">Sair da conta</button>');
    return;
  }
  if (!state.user && !state.demo) {
    app.innerHTML = authView();
    return;
  }
  app.innerHTML = `<div class="shell ${state.preferences.sidebar_collapsed ? "collapsed" : ""}"><aside class="sidebar"><button class="brand" data-nav="home"><span class="brand-mark">/ / /</span><strong>BUILD<span>COMPANION</span></strong></button><nav aria-label="Navegação principal">${Object.entries(
    nav,
  )
    .map(
      ([id, [ico, label]]) =>
        `<button data-nav="${id}" title="${label}" class="${state.route === id ? "active" : ""}" ${state.route === id ? 'aria-current="page"' : ""}>${icon(ico)}<span>${label}</span>${id === "favorites" ? `<em>${state.favorites.length}</em>` : ""}</button>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-foot"><span class="version">DBD COMPANION · 0.4.0</span><button data-action="collapse" title="Recolher ou expandir menu" aria-label="Recolher ou expandir menu">${icon("panel-left-close")}<span>Recolher menu</span></button></div></aside><div class="workspace"><header><div class="header-brand">DBD Build Companion</div><label class="searchbox">${icon("search")}<input id="context-search" type="search" aria-label="Pesquisar nesta página" placeholder="Pesquisar ${state.route === "collection" ? "assassino" : state.route === "perks" ? "vantagem" : "nesta página"}…" value="${escape(state.search)}"></label><span class="sync ${!navigator.onLine ? "offline" : ""}"><i></i>${state.demo ? "Visitante" : navigator.onLine ? "Supabase conectado" : "Sem conexão"}<small>${state.demo ? "Alterações temporárias" : state.syncError ? "Sincronização pendente" : navigator.onLine ? "Dados sincronizados" : "Dados em memória"}</small></span><button data-action="sync" aria-label="Sincronizar dados" title="Sincronizar dados" ${state.demo ? "disabled" : ""}>${icon("refresh-cw")}</button><button data-action="profile" aria-label="Abrir perfil" title="Perfil">${icon("user")}</button></header>${state.demo ? '<div class="session-strip">MODO VISITANTE · Coleção vazia por padrão. Entre na sua conta para salvar as alterações.</div>' : ""}${!navigator.onLine ? '<div class="banner warning">Sem internet. Consultas já carregadas continuam disponíveis; salvamentos exigem conexão.</div>' : ""}<main id="content"></main><footer>Projeto pessoal independente · Sem afiliação à Behaviour Interactive<span>Catálogo ${escape(state.catalog.config.reviewed_at)}</span></footer></div></div>`;
  renderContent();
  renderDrawer();
  if (state.route === "build" && !state.result && !state.loading && selected())
    calculate();
}
function renderContent() {
  const content = document.querySelector("#content");
  if (!content) return;
  content.innerHTML = {
    home: homeView,
    collection: collectionView,
    build: buildView,
    themes: themesView,
    perks: perksView,
    favorites: favoritesView,
    settings: settingsView,
  }[state.route]();
  mountAssets(app, state.catalog);
}
function homeView() {
  const recent = killer(state.lastConsulted || selected()?.id);
  return (
    title(
      "Sua próxima caçada começa aqui.",
      "Organize sua coleção e encontre quatro vantagens que funcionam juntas.",
      `<button class="primary" data-nav="build">${icon("wand-sparkles")}Gerar build</button>`,
    ) +
    `<section class="stats"><article><small>ASSASSINOS ADQUIRIDOS</small><strong>${state.collection.length}<span> / ${state.catalog.killers.length}</span></strong><p>Prestígios definidos por você</p></article><article><small>VANTAGENS NO CATÁLOGO</small><strong>${state.catalog.perks.length}</strong><p>${new Set(state.catalog.perks.map(family)).size} efeitos distintos</p></article><article><small>DISPONÍVEIS PARA ${escape(selected()?.name || "O ASSASSINO")}</small><strong>${pool().length}</strong><p>Conforme seus desbloqueios</p></article><article><small>BUILDS FAVORITAS</small><strong>${state.favorites.length}</strong><p>Prontas para consultar</p></article></section><div class="home-grid"><section class="panel resume"><span class="eyebrow">${state.lastConsulted ? "ÚLTIMO ASSASSINO CONSULTADO" : "COMECE POR UM ASSASSINO"}</span>${recent ? `<div class="resume-body">${imageFor(recent, "portrait")}<div><h2>${escape(recent.name)}</h2><p>${escape(recent.description)}</p><button class="primary" data-generate="${recent.id}">Montar build</button><button class="secondary" data-killer="${recent.id}">Minha coleção</button></div></div>` : ""}</section><section class="panel"><span class="eyebrow">SEU ROTEIRO</span><h2>Três passos para começar</h2><ol class="steps"><li>Marque os assassinos que você possui.</li><li>Informe os prestígios e desbloqueios individuais.</li><li>Gere uma build e guarde suas favoritas.</li></ol><button class="secondary" data-nav="collection">Abrir coleção ${icon("chevron-right")}</button></section></div><section class="section-heading"><h2>Suas favoritas</h2><button class="text-button" data-nav="favorites">Ver todas</button></section>${state.favorites.length ? favoritesCards(state.favorites.slice(0, 3)) : empty("Ainda sem favoritas", "As builds que você salvar aparecem aqui.")}<div class="catalog-note">${escape(catalogNotice())}</div>`
  );
}
function selectionButton() {
  return `<button class="secondary" data-action="select-mode" aria-pressed="${!!state.selection}">${state.selection ? "Concluir seleção" : "Selecionar vários"}</button>`;
}
function selectionCheckbox(id, name) {
  if (!state.selection) return "";
  return `<label class="checkbox item-selection"><input type="checkbox" data-select-item="${escape(id)}" aria-label="Selecionar ${escape(name)}" ${state.selection.has(id) ? "checked" : ""}>Selecionar</label>`;
}
function selectionToolbar(list) {
  if (!state.selection) return "";
  const perks = state.route === "perks";
  const disabled = !state.selection.size || (perks && !owned(selected()?.id));
  return `<section class="bulk-toolbar" aria-label="Ações da seleção"><p role="status">${state.selection.size} selecionados${perks ? ` · Para ${escape(selected()?.name)}` : ""}</p><div class="button-row"><button class="secondary" data-action="select-all" ${!list.length ? "disabled" : ""}>Selecionar todos (${list.length})</button><button class="secondary" data-action="select-clear" ${!state.selection.size ? "disabled" : ""}>Limpar seleção</button></div><small>Selecionar todos inclui todos os resultados do filtro, inclusive os ainda não exibidos. Alterar a busca ou os filtros limpa a seleção.</small>${perks ? `<label>Nível mínimo<select id="bulk-tier">${options({1:"Nível 1",2:"Nível 2",3:"Nível 3"}, String(state.bulkTier))}</select></label><small>${owned(selected()?.id) ? "Níveis superiores já disponíveis são preservados. Desmarcar bloqueia a perk; Automático volta às regras de prestígio." : "Adicione o assassino selecionado à coleção antes de registrar desbloqueios."}</small>` : "<small>Novos assassinos entram em P0. Os prestígios existentes são preservados.</small>"}<div class="button-row"><button class="primary" data-action="bulk-acquire" ${disabled ? "disabled" : ""}>Marcar como adquirido</button><button class="secondary" data-action="bulk-unmark" ${disabled ? "disabled" : ""}>Desmarcar</button>${perks ? `<button class="secondary" data-action="bulk-auto" ${disabled ? "disabled" : ""}>Voltar ao automático</button>` : ""}</div></section>`;
}
async function applyBulk(action, ids) {
  const userId = state.user?.id;
  const demo = state.demo;
  const killerId = selected()?.id;
  const assertSession = () => {
    if (state.user?.id !== userId || state.demo !== demo) throw Error("A sessão terminou.");
  };
  notify(demo ? "Atualizando seleção…" : "Salvando seleção na nuvem…");
  let changed = 0;
  if (state.route === "collection") {
    if (action === "bulk-acquire") {
      const rows = newKillers(state.catalog, state.collection, ids);
      const saved = demo ? rows : await acquireKillers(cloud, userId, rows);
      assertSession();
      state.collection = state.collection.concat(saved);
      changed = saved.length;
    } else {
      const removed = demo ? state.collection.filter(x => ids.includes(x.killer_id)) : await removeKillers(cloud, userId, ids);
      assertSession();
      const keys = new Set(removed.map(x => x.killer_id));
      state.collection = state.collection.filter(x => !keys.has(x.killer_id));
      state.overrides = state.overrides.filter(x => !keys.has(x.killer_id));
      state.favorites = state.favorites.filter(x => !keys.has(x.killer_id));
      changed = keys.size;
    }
  } else {
    // Validate ownership even for removing overrides; never affect another killer.
    const rows = perkUnlocks(state.catalog, state.collection, state.overrides, killerId, ids, action === "bulk-unmark" ? 0 : state.bulkTier);
    const saved = action === "bulk-auto"
      ? (demo ? state.overrides.filter(x => x.killer_id === killerId && ids.includes(x.perk_id)) : await resetPerkUnlocks(cloud, userId, killerId, ids))
      : (demo ? rows : await savePerkUnlocks(cloud, userId, rows));
    assertSession();
    const keys = new Set(saved.map(x => x.perk_id));
    state.overrides = state.overrides.filter(x => x.killer_id !== killerId || !keys.has(x.perk_id));
    if (action !== "bulk-auto") state.overrides.push(...saved);
    changed = saved.length;
  }
  state.selection?.clear();
  state.drawer = null;
  invalidate();
  notify(`${changed} registros atualizados${demo ? " nesta sessão." : " na nuvem."}`);
}
function collectionList() {
  let list = state.catalog.killers
    .filter((k) =>
      normalize(`${k.name} ${k.name_en} ${k.description}`).includes(
        normalize(state.search),
      ),
    )
    .filter(
      (k) =>
        state.collectionFilter === "all" ||
        (state.collectionFilter === "owned" ? !!owned(k.id) : !owned(k.id)),
    )
    .filter(
      (k) =>
        state.prestigeFilter === "all" ||
        (state.prestigeFilter === "3+"
          ? (owned(k.id)?.prestige ?? -1) >= 3
          : (owned(k.id)?.prestige ?? -1) === Number(state.prestigeFilter)),
    );
  list.sort((a, b) =>
    state.sort === "prestige"
      ? (owned(b.id)?.prestige ?? -1) - (owned(a.id)?.prestige ?? -1) ||
        a.name.localeCompare(b.name, "pt-BR")
      : a.name.localeCompare(b.name, "pt-BR"),
  );
  return list;
}
function collectionView() {
  const list = collectionList();
  return (
    title(
      "Minha coleção",
      `${state.collection.length} adquiridos de ${state.catalog.killers.length} assassinos. Clique em um card para editar.`,
      selectionButton(),
    ) +
    `<div class="filters"><label>Mostrar<select data-filter="collectionFilter">${options({ all: "Todos os killers", owned: "Apenas adquiridos", missing: "Não adquiridos" }, state.collectionFilter)}</select></label><label>Prestígio<select data-filter="prestigeFilter">${options({ all: "Todos", 0: "P0", 1: "P1", 2: "P2", "3+": "P3 ou superior" }, state.prestigeFilter)}</select></label><label>Ordenar<select data-filter="sort">${options({ name: "Ordem alfabética", prestige: "Maior prestígio" }, state.sort)}</select></label><span class="result-count">${list.length} encontrados</span></div>${selectionToolbar(list)}<div class="collection-grid">${list
      .slice(0, state.limit)
      .map(
        (k) =>
          `<div class="selectable-killer ${state.selection?.has(k.id) ? "bulk-selected" : ""}">${selectionCheckbox(k.id, k.name)}<button class="killer-card ${owned(k.id) ? "owned" : ""} ${selected()?.id === k.id ? "selected" : ""}" data-killer="${k.id}">${imageFor(k, "portrait")}<div class="killer-card-info"><span class="ownership">${owned(k.id) ? `ADQUIRIDO · P${owned(k.id).prestige}` : "NÃO ADQUIRIDO"}</span><h2>${escape(k.name)}</h2><small>${escape(k.name_en)}</small></div></button></div>`,
      )
      .join(
        "",
      )}</div>${!list.length ? empty("Nenhum assassino encontrado", "Tente outro nome ou altere os filtros.") : more(list.length)}`
  );
}
function options(values, selectedValue) {
  return Object.entries(values)
    .map(
      ([v, l]) =>
        `<option value="${escape(v)}" ${v === selectedValue ? "selected" : ""}>${escape(l)}</option>`,
    )
    .join("");
}
function more(total) {
  return total > state.limit
    ? `<button class="secondary load-more" data-action="more">Carregar mais (${total - state.limit} restantes)</button>`
    : "";
}
function perkTile(p, extra = "", selectable = false) {
  const actual = pool().find((x) => x.id === p.id);
  return `<article class="catalog-perk ${selectable && state.selection?.has(p.id) ? "bulk-selected" : ""}">${selectable ? selectionCheckbox(p.id, perkName(p)) : ""}<button class="perk-open" data-perk="${p.id}">${imageFor(p)}<div><h3>${pname(p)}</h3>${p.name_pt ? `<small>${escape(p.name)}</small>` : ""}<span class="origin">${escape(killer(p.owner_id)?.name || "Vantagem geral")}</span><span class="pill ${actual ? "positive" : "muted"}">${actual ? `Disponível · Nível ${actual.tier}` : "Não confirmada / bloqueada"}</span></div></button><div class="tags">${(p.categories || [p.category]).map((c) => `<span>${categories[c]}</span>`).join("")}</div>${extra}</article>`;
}
function perksList() {
  const actual = new Set(pool().map((p) => p.id));
  let list = state.catalog.perks
    .filter((p) =>
      normalize(
        `${p.name} ${p.name_pt || ""} ${p.effect} ${killer(p.owner_id)?.name || ""}`,
      ).includes(normalize(state.search)),
    )
    .filter(
      (p) =>
        state.perkAvailability === "all" ||
        (state.perkAvailability === "available"
          ? actual.has(p.id)
          : !actual.has(p.id)),
    )
    .filter(
      (p) =>
        state.owner === "all" ||
        (state.owner === "general" ? !p.owner_id : p.owner_id === state.owner),
    )
    .filter(
      (p) =>
        state.category === "all" ||
        (p.categories || [p.category]).includes(state.category),
    )
    .sort((a, b) => perkName(a).localeCompare(perkName(b), "pt-BR"));
  return list;
}
function perksView() {
  const list = perksList();
  const actual = new Set(pool().map(p => p.id));
  return (
    title(
      "Catálogo de perks",
      `${state.catalog.perks.length} vantagens carregadas · ${actual.size} disponíveis para ${escape(selected()?.name || "o assassino")}.`,
      selectionButton(),
    ) +
    `<div class="filters"><label>Assassino selecionado<select id="killer-select">${killerOptions()}</select></label><label>Disponibilidade<select data-filter="perkAvailability">${options({ all: "Todas as perks", available: "Disponíveis", locked: "Não confirmadas / bloqueadas" }, state.perkAvailability)}</select></label><label>Origem<select data-filter="owner">${options({ all: "Todos os assassinos", general: "Perks gerais", ...Object.fromEntries(state.catalog.killers.map((k) => [k.id, k.name])) }, state.owner)}</select></label><label>Categoria<select data-filter="category">${options({ all: "Todas", ...categories }, state.category)}</select></label></div><div class="info-strip">Perks gerais precisam de confirmação manual. P1–P3 compartilham as perks pessoais; registre melhorias pela Teia de Sangue ou Santuário no detalhe de cada perk.</div><p class="result-count">${list.length} resultados · Ordem alfabética</p>${selectionToolbar(list)}<div class="catalog-grid">${list
      .slice(0, state.limit)
      .map((p) => perkTile(p, "", true))
      .join(
        "",
      )}</div>${!list.length ? empty("Nenhuma vantagem encontrada", "Tente outro nome ou altere os filtros.") : more(list.length)}`
  );
}
function catalogNotice() {
  const counts = assetSummary(state.catalog);
  return `${state.catalog.killers.length} assassinos · ${state.catalog.perks.length} nomes de perks · ${counts.ready} imagens disponíveis. Catálogo revisado em ${state.catalog.config.reviewed_at}; resumos e pesos editoriais.`;
}
function themesView() {
  const list = themedBuilds
    .filter(
      (p) => state.themeKiller === "all" || p.killerId === state.themeKiller,
    )
    .filter((p) =>
      normalize(
        [
          p.name,
          p.tagline,
          p.category,
          killer(p.killerId)?.name,
          killer(p.killerId)?.name_en,
          ...p.perkIds.map((id) => perkName(perk(id))),
        ].join(" "),
      ).includes(normalize(state.search)),
    )
    .map((p) => ({ preset: p, ...themedStatus(p, input()) }))
    .filter(
      (x) =>
        state.themeAvailability === "all" || (x.build && !x.missing.length),
    );
  return (
    title(
      "Builds temáticas",
      "Explore estratégias da comunidade, confira os requisitos e adapte a combinação ao seu jeito de jogar.",
    ) +
    `<div class="theme-intro"><span class="pill">OFF-META</span><p>Receitas para experimentar outro estilo de jogo. A lista não é um ranking de força; add-ons e condições fazem parte de cada plano.</p></div><div class="filters"><label>Assassino da build<select data-filter="themeKiller">${options({ all: "Todos os assassinos", ...Object.fromEntries(themedBuilds.map((p) => [p.killerId, killer(p.killerId)?.name || p.killerId])) }, state.themeKiller)}</select></label><label>Perks da receita<select data-filter="themeAvailability">${options({ all: "Todas as receitas", available: "Quatro perks disponíveis" }, state.themeAvailability)}</select></label><span class="result-count">${list.length} opções</span></div><div class="themes-grid">${list.map(({ preset: p, build, missing, error }) => `<article class="theme-card panel" data-theme-card="${p.id}"><div class="theme-card-head">${imageFor(killer(p.killerId), "portrait")}<div><span class="eyebrow">${escape(p.category)}</span><h2>${escape(p.name)}</h2><small>${escape(killer(p.killerId)?.name)}</small></div></div><p class="theme-tagline">${escape(p.tagline)}</p><div class="theme-perks">${(build?.perks || []).map((perk) => `<button data-perk="${perk.id}" data-for-killer="${p.killerId}" title="${pname(perk)}">${imageFor(perk)}<span>${pname(perk)}</span></button>`).join("")}</div><div class="theme-requirements"><span class="${missing.length ? "warning-text" : "positive"}">${build ? `${4 - missing.length}/4 perks disponíveis` : escape(error)}</span><small>${p.addons.some((a) => a.required) ? `Add-on obrigatório: ${escape(p.addons.find((a) => a.required).name)}` : "Sem add-on obrigatório"}</small></div><button class="secondary full" data-preset="${p.id}" ${error ? "disabled" : ""}>${missing.length ? "Ver plano e requisitos" : "Abrir build temática"} ${icon("chevron-right")}</button></article>`).join("")}</div>${!list.length ? empty("Nenhuma receita encontrada", "Tente outro nome ou altere os filtros.") : ""}`
  );
}
function themeShortcuts(k) {
  return `<section class="theme-shortcuts"><span class="eyebrow">EXPERIMENTE UM TEMA</span><div>${themedBuilds
    .filter((p) => p.killerId === k.id)
    .map(
      (p) =>
        `<button class="secondary" data-preset="${p.id}">${escape(p.name)}</button>`,
    )
    .join(
      "",
    )}<button class="text-button" data-nav="themes">Ver builds temáticas ${icon("chevron-right")}</button></div></section>`;
}
function themeGuide(b) {
  const p = b.preset;
  return `<section class="theme-guide"><span class="eyebrow">PLANO DA BUILD</span>${b.modified ? '<p class="info-strip">Você adaptou as perks. O plano abaixo descreve a receita original; confira se a nova combinação ainda sustenta o tema.</p>' : ""}<p>${escape(p.tagline)}</p><h3>Add-ons e requisitos</h3><p>${escape(p.addonNote)}</p>${p.addons.map((a) => `<div class="addon-row"><span class="pill ${a.required ? "required" : ""}">${a.required ? "Obrigatório" : "Opcional"}</span><div><strong>${escape(a.name)}</strong><p>${escape(a.note)}</p></div></div>`).join("")}<h3>Como jogar</h3><ol class="theme-steps">${p.plan.map((step) => `<li>${escape(step)}</li>`).join("")}</ol><h3>O que pode dar errado</h3><ul>${p.cautions.map((c) => `<li>${escape(c)}</li>`).join("")}</ul><details><summary>Referências e revisão</summary><p>Variação editorial revisada em ${escape(p.reviewedAt)}. Confira os efeitos e valores no patch em uso.</p>${[...p.sources, ...p.addons.map((a) => a.url)].map((url, i) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">Referência ${i + 1}</a>`).join(" · ")}</details></section>`;
}
function buildView() {
  const k = selected(),
    b = currentBuild();
  return (
    title(
      "Gerador de builds",
      "Quatro vantagens. Uma estratégia para a sua coleção.",
    ) +
    (!k
      ? empty("Escolha um assassino", "Adicione seus assassinos à coleção.")
      : `<div class="builder"><section class="panel killer-profile">${imageFor(k, "portrait")}<span class="eyebrow">SEU ASSASSINO</span><h2>${escape(k.name)}</h2><small>${escape(k.name_en)}</small><span class="pill">${owned(k.id) ? `Adquirido · P${owned(k.id).prestige}` : "Não adquirido"}</span><h3>${escape(k.power || "Poder principal")}</h3><p>${escape(k.description)}</p><label>Trocar de assassino<select id="killer-select">${killerOptions()}</select></label><button class="secondary" data-killer="${k.id}">Editar coleção</button></section><div class="build-center">${themeShortcuts(k)}${state.loading ? empty("Combinando suas vantagens…", "O cálculo roda apenas quando necessário.") : b ? renderBuild(b) : empty("Faltam vantagens para esta build", `Você tem ${pool().length} vantagens confirmadas para este assassino. São necessárias quatro com efeitos diferentes.`, `<button class="primary" data-nav="perks">Registrar desbloqueios</button>`)}${!b?.preset && state.result?.builds.length ? `<section class="other-builds"><h3>Outras recomendações</h3>${state.result.builds.map((build, i) => `<button class="build-choice ${i === state.buildIndex ? "active" : ""}" data-build="${i}"><span><strong>${escape(build.label || "Build personalizada")}</strong><small>${styles[build.style]} · ${build.score.toFixed(1)} pts</small><small>${build.perks.map((p) => pname(p)).join(" · ")}</small></span>${icon("chevron-right")}</button>`).join("")}${state.result.builds.length < 3 ? '<p class="muted">Sua seleção ainda não permite três builds com pelo menos duas perks diferentes entre si.</p>' : ""}</section>` : ""}</div><section class="panel build-options"><span class="eyebrow">PERSONALIZAÇÃO</span><h3>Como você quer jogar?</h3><div class="style-buttons">${Object.entries(
          styles,
        )
          .map(
            ([id, label]) =>
              `<button data-style="${id}" ${b?.preset ? "disabled" : ""} class="${id === state.preferences.style ? "active" : ""}" aria-pressed="${id === state.preferences.style}">${label}</button>`,
          )
          .join(
            "",
          )}</div><label class="checkbox"><input id="only-available" type="checkbox" ${b?.preset ? "disabled" : ""} ${state.preferences.only_available ? "checked" : ""}>Usar apenas perks disponíveis</label>${b?.preset ? "<p>Receita fixa: as perks não confirmadas ficam visíveis para você planejar. As substituições respeitam seu filtro de disponibilidade.</p>" : ""}${!state.preferences.only_available ? '<p class="warning-text">Inclui perks não confirmadas. Níveis desconhecidos são estimados como III somente na pontuação.</p>' : ""}<button class="primary" data-action="reroll" ${state.loading ? "disabled" : ""}>${icon("refresh-cw")}${b?.preset ? "Voltar às recomendações" : "Gerar nova combinação"}</button><button class="secondary" data-action="favorite" ${!b ? "disabled" : ""}>${icon("heart")}Salvar favorita</button><small>Pontuação editorial. Não representa taxa de vitória.</small></section></div>`)
  );
}
function renderBuild(b) {
  const cats = [...new Set(b.perks.map((p) => categories[p.category]))];
  return `<section class="panel recommended"><div class="section-heading"><div><span class="eyebrow">${escape(b.label || "BUILD PERSONALIZADA")}</span><h2>${styles[b.style]}</h2></div>${b.preset ? '<span class="pill theme-badge">OFF-META</span>' : `<span class="score">${b.score.toFixed(1)}<small>pontos</small></span>`}</div><div class="build-perks">${b.perks.map((p, i) => `<article class="perk-card"><button data-perk="${p.id}" aria-label="Detalhes de ${pname(p)}"><span class="slot">0${i + 1}</span><span class="diamond">${imageFor(p)}</span><h3>${pname(p)}</h3><small class="${p.available ? "positive" : "warning-text"}">${p.available ? `Nível ${p.tier} · Disponível` : "Não confirmada"}</small></button><button class="swap" data-replace="${i}">${icon("refresh-cw")}Substituir</button></article>`).join("")}</div>${b.preset ? themeGuide(b) : ""}${b.savedNotes ? `<section class="saved-notes"><h3>Notas da favorita</h3><p>${escape(b.savedNotes)}</p></section>` : ""}<div class="strategy">${!b.preset ? `<h3>Plano de jogo</h3><p>Combine ${cats.map((c) => c.toLowerCase()).join(", ")}. ${b.style === "chase" ? "Use suas ferramentas para encerrar perseguições e converter pressão em ganchos." : b.style === "information" ? "Use a informação para escolher o próximo alvo e reduzir deslocamentos sem objetivo." : b.style === "control" ? "Aproveite os gatilhos de controle enquanto mantém sobreviventes ocupados." : "Alterne perseguições e controle dos objetivos conforme as oportunidades."}</p><h3>Sinergias identificadas</h3>${b.interactions.length ? b.interactions.map((s) => `<p class="${s.value < 0 ? "warning-text" : "positive"}">${s.value > 0 ? "+" : ""}${s.value} · ${escape(s.reason)}</p>`).join("") : "<p>Nenhum bônus específico de par cadastrado. A seleção considera compatibilidade e cobertura de funções.</p>"}<h3>Limitações</h3><p>${!b.perks.some((p) => p.category === "control") ? "Não há uma perk principal de controle de objetivos. " : ""}${!b.perks.some((p) => p.category === "information") ? "Informação depende mais da sua leitura da partida. " : ""}${b.perks.some((p) => p.available === false) ? "Contém vantagens ainda não confirmadas na sua coleção. " : ""}Os pesos são editoriais e os resumos não substituem os valores do patch atual.</p>` : ""}<details><summary>${b.preset ? "Pontuação de referência (sem modelar add-ons)" : "Entender a pontuação"}</summary>${b.details.map((d) => `<p><strong>${pname(perk(d.id))}</strong>: força ${d.strength.toFixed(1)} · compatibilidade ${d.compatibility.toFixed(1)} · estilo ${d.style.toFixed(1)}</p>`).join("")}<p>Diversidade ${b.parts.diversity.toFixed(1)} · Redundância ${b.parts.redundancy.toFixed(1)} · Sinergia ${b.parts.synergy.toFixed(1)}</p><p>${state.result?.method === "shortlist" ? "Busca aproximada nas 48 melhores candidatas por estilo." : state.result?.method === "exact" ? "Busca exaustiva entre as candidatas válidas." : "Combinação escolhida manualmente. A pontuação não modela add-ons nem a execução do tema."} As alternativas exigem pelo menos duas mudanças; cada estilo tem sua própria pontuação.</p></details></div></section>`;
}
function favoritesCards(list) {
  return `<div class="favorites-list">${list
    .map((f) => {
      const k = killer(f.killer_id),
        ids = [f.perk_1, f.perk_2, f.perk_3, f.perk_4],
        actual = new Set(
          availablePerks(
            state.catalog,
            state.collection,
            state.overrides,
            f.killer_id,
          ).map((p) => p.id),
        );
      return `<article class="panel favorite-card">${k ? imageFor(k, "portrait") : ""}<div><span class="eyebrow">${escape(k?.name)} · ${styles[f.style]}</span><h2>${escape(f.name)}</h2><div class="favorite-perks">${ids.map((id) => (perk(id) ? `<button data-perk="${id}" data-for-killer="${f.killer_id}" title="${pname(perk(id))}">${imageFor(perk(id))}<small>${pname(perk(id))}</small></button>` : "")).join("")}</div>${ids.some((id) => !actual.has(id)) ? '<p class="warning-text">Uma ou mais perks não estão confirmadas para este assassino.</p>' : ""}${f.notes ? `<p>${escape(f.notes)}</p>` : ""}<small>${new Date(f.created_at).toLocaleDateString("pt-BR")} · ${escape(f.catalog_version)}${f.catalog_version !== state.catalog.config.version ? " · Catálogo anterior" : ""}</small><div class="button-row"><button class="primary" data-open-favorite="${f.id}">Reabrir</button><button class="secondary" data-edit-favorite="${f.id}">Editar</button><button class="text-button" data-delete-favorite="${f.id}">Excluir</button></div></div></article>`;
    })
    .join("")}</div>`;
}
function favoritesView() {
  const list = state.favorites.filter((f) =>
    normalize(`${f.name} ${f.notes} ${killer(f.killer_id)?.name}`).includes(
      normalize(state.search),
    ),
  );
  return (
    title(
      "Builds favoritas",
      "Suas combinações, prontas para a próxima partida.",
    ) +
    (list.length
      ? favoritesCards(list)
      : empty(
          "Nenhuma favorita encontrada",
          "Salve uma recomendação ou tente outra pesquisa.",
          `<button class="primary" data-nav="build">Gerar build</button>`,
        ))
  );
}
function settingsView() {
  const counts = assetSummary(state.catalog);
  return (
    title(
      "Configurações",
      "Ajuste o recomendador e acompanhe a qualidade do catálogo.",
    ) +
    `<form id="settings-form" class="panel"><h2>Pesos da recomendação</h2><p>De 0 (ignorar) a 5 (maior influência).</p><div class="weight-grid">${Object.entries(
      {
        strength: "Força individual",
        compatibility: "Compatibilidade com o assassino",
        synergy: "Sinergias positivas e negativas",
        style: "Estilo de jogo",
        diversity: "Diversidade funcional",
        redundancy: "Penalidade por redundância",
      },
    )
      .map(
        ([key, label]) =>
          `<label>${label}<input name="${key}" type="number" min="0" max="5" step="0.1" value="${weights()[key]}" required></label>`,
      )
      .join(
        "",
      )}</div><label class="checkbox"><input name="compact" type="checkbox" ${state.preferences.compact ? "checked" : ""}>Interface mais compacta</label><div class="button-row"><button class="primary">Salvar ajustes</button><button type="button" class="secondary" data-action="reset-weights">Restaurar pesos</button></div></form><section class="panel settings-info"><h2>Catálogo e imagens</h2><p>${escape(catalogNotice())}</p><p>${counts.ready} imagens disponíveis · ${counts.pending} imagens pendentes · ${assetFailures().length} falhas de carregamento nesta sessão.</p><p>Retratos e ícones reais incluídos no aplicativo. Duas entradas usam arte do nome legado equivalente, identificada nos créditos. Arte de Behaviour Interactive e respectivos licenciantes.</p><button class="secondary" data-action="asset-report">Ver imagens e créditos</button><h3>Seus dados</h3><p>Coleção, favoritos e configurações ficam no Supabase ao entrar. A sessão de acesso fica salva no perfil deste aplicativo no Windows para reconectar automaticamente. Sua senha não é salva pelo aplicativo. Use “Sair da conta” para remover a sessão deste dispositivo.</p><p>Este aplicativo não acessa o processo, os arquivos ou as partidas do DBD.</p><button class="secondary" data-action="logout">Sair da conta</button></section>`
  );
}
function openDrawer(data) {
  drawerReturn = document.activeElement?.dataset;
  document.querySelector(".search-suggestions")?.remove();
  state.drawer = data;
  renderDrawer();
}
function closeDrawer() {
  state.drawer = null;
  app.querySelector("dialog")?.close();
  app.querySelector("dialog")?.remove();
  document.querySelector("#context-search")?.focus();
}
function renderDrawer() {
  app.querySelector("dialog")?.remove();
  if (!state.drawer) return;
  const d = document.createElement("dialog");
  d.className = "drawer";
  d.innerHTML = `<button class="drawer-close" data-action="close" aria-label="Fechar painel">${icon("x")}</button><div id="drawer-content">${drawerContent()}</div>`;
  app.append(d);
  d.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeDrawer();
  });
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        closeDrawer();
    }
  });
  d.showModal();
  mountAssets(app, state.catalog);
}
function drawerContent() {
  const d = state.drawer;
  if (d.type === "killer") {
    const k = killer(d.id),
      o = owned(d.id);
    return `<span class="eyebrow">SUA COLEÇÃO</span><div class="drawer-portrait">${imageFor(k, "portrait")}</div><h2>${escape(k.name)}</h2><small>${escape(k.name_en)}</small><h3>${escape(k.power)}</h3><p>${escape(k.description)}</p><form data-collection="${k.id}"><label class="checkbox"><input type="checkbox" name="owned" ${o ? "checked" : ""}>Possuo este assassino</label><label>Prestígio<input name="prestige" type="number" min="0" max="100" value="${o?.prestige || 0}" required></label><p class="muted">P0 mantém as perks pessoais. P1, P2 e P3 compartilham níveis I, II e III. Prestígios superiores continuam registrados.</p><button class="primary">Salvar coleção</button></form><button class="secondary" data-generate="${k.id}">Gerar build com este assassino</button><h3>Vantagens pessoais</h3>${state.catalog.perks
      .filter((p) => p.owner_id === k.id)
      .map((p) => perkTile(p))
      .join("")}`;
  }
  if (d.type === "perk") {
    const p = perk(d.id),
      a = pool().find((x) => x.id === p.id),
      manual = state.overrides.find(
        (x) => x.killer_id === selected()?.id && x.perk_id === p.id,
      ),
      detail = currentBuild()?.details.find((x) => x.id === p.id),
      interactions = state.catalog.synergies.filter((s) =>
        [s.perk_a, s.perk_b].some((id) => family(perk(id)) === family(p)),
      );
    return `<span class="eyebrow">DETALHES DA VANTAGEM</span><div class="detail-icon">${imageFor(p)}</div><h2>${pname(p)}</h2><small>${escape(p.name)}</small><p class="origin">${escape(killer(p.owner_id)?.name || "Vantagem geral")}</p><p>${escape(p.effect)}</p><div class="tags">${(p.categories || [p.category]).map((c) => `<span>${categories[c]}</span>`).join("")}</div>${p.legacy ? `<p class="info-strip">Nome legado. Compartilha efeito com ${pname(perk(p.equivalent_id))}; não pode ser equipado junto.</p>` : ""}<h3>Disponibilidade</h3><p>${a ? `Nível ${a.tier} disponível` : "Não confirmada ou bloqueada"} para ${escape(selected()?.name)}.</p><label>Nível confirmado<select data-unlock="${p.id}" ${!owned(selected()?.id) ? "disabled" : ""}>${options({ auto: "Automático", 0: "Indisponível", 1: "Nível 1", 2: "Nível 2", 3: "Nível 3" }, String(manual?.tier ?? "auto"))}</select></label>${!owned(selected()?.id) ? "<p>Adicione o assassino selecionado à coleção antes de registrar desbloqueios.</p>" : ""}<h3>Por que foi recomendada?</h3><p>${detail ? `Força ${detail.strength.toFixed(1)}, compatibilidade ${detail.compatibility.toFixed(1)} e estilo ${detail.style.toFixed(1)} na combinação atual.` : "Esta vantagem não faz parte da build atual. A compatibilidade depende do assassino e das outras três perks."}</p><h3>Sinergias e conflitos cadastrados</h3>${interactions.map((s) => `<p class="${s.value < 0 ? "warning-text" : "positive"}"><strong>${pname(perk(family(perk(s.perk_a)) === family(p) ? s.perk_b : s.perk_a))}</strong>: ${escape(s.reason)}</p>`).join("") || "<p>Nenhum par específico registrado.</p>"}<small>Resumo funcional revisado em ${escape(p.reviewed_at)}. Consulte os valores de cada nível dentro do jogo.</small>`;
  }
  if (d.type === "replace") {
    const list = alternatives(currentBuild(), d.slot, input())
      .filter((a) =>
        normalize(`${a.perk.name} ${a.perk.name_pt || ""}`).includes(
          normalize(d.search || ""),
        ),
      )
      .filter(
        (a) =>
          !d.category ||
          d.category === "all" ||
          (a.perk.categories || [a.perk.category]).includes(d.category),
      );
    return `<span class="eyebrow">PERSONALIZAR BUILD</span><h2>Substituir ${pname(currentBuild().perks[d.slot])}</h2><label>Pesquisar alternativa<input id="replacement-search" type="search" value="${escape(d.search || "")}"></label><label>Categoria<select id="replacement-category">${options({ all: "Todas", ...categories }, d.category || "all")}</select></label><p>${list.length} alternativas compatíveis · Ordenadas pela pontuação da build.</p><div class="replacement-list">${list.map((a) => `<button data-select-replacement="${a.perk.id}">${imageFor(a.perk)}<span><strong>${pname(a.perk)}</strong><small>${categories[a.perk.category]} · ${a.perk.available ? `Nível ${a.perk.tier}` : "Não confirmada"}</small><small>${a.score.toFixed(1)} pts · ${a.delta >= 0 ? "+" : ""}${a.delta.toFixed(1)} na build</small></span></button>`).join("") || "<p>Nenhuma alternativa compatível. Ajuste os filtros ou os desbloqueios.</p>"}</div>`;
  }
  if (d.type === "favorite") {
    const f = d.id ? state.favorites.find((f) => f.id === d.id) : null;
    return `<span class="eyebrow">BUILD FAVORITA</span><h2>${f ? "Editar favorita" : "Guardar esta combinação"}</h2><form id="favorite-form"><label>Nome da build<input name="name" maxlength="80" value="${escape(f?.name || currentBuild()?.preset?.name || `${selected().name} · ${styles[currentBuild()?.style]}`)}" required></label><label>Notas opcionais<textarea name="notes" maxlength="2000" rows="5">${escape(f?.notes ?? themedNotes(currentBuild()))}</textarea></label><button class="primary">Salvar favorita</button></form>${f ? `<button class="secondary" data-open-favorite="${f.id}">Editar as quatro perks no gerador</button>` : ""}`;
  }
  if (d.type === "confirm-bulk-remove")
    return `<h2>Desmarcar ${d.ids.length} assassinos?</h2><p>Isso também exclui ${state.overrides.filter(x => d.ids.includes(x.killer_id)).length} desbloqueios manuais e ${state.favorites.filter(x => d.ids.includes(x.killer_id)).length} favoritas vinculadas a esses assassinos. Perks compartilhadas por prestígio deixarão de estar disponíveis automaticamente.</p><p>${d.ids.map(id => escape(killer(id).name)).join(", ")}</p><button class="primary" data-action="confirm-bulk-remove">Confirmar remoção</button><button class="secondary" data-action="close">Cancelar</button>`;
  if (d.type === "confirm-remove")
    return `<h2>Remover assassino da coleção?</h2><p>Isso também exclui os desbloqueios manuais e favoritos desse assassino.</p><button class="primary" data-confirm-remove="${d.id}">Remover</button><button class="secondary" data-action="close">Cancelar</button>`;
  if (d.type === "confirm-delete")
    return `<h2>Excluir esta favorita?</h2><p>A coleção e os desbloqueios serão mantidos.</p><button class="primary" data-confirm-delete="${d.id}">Excluir favorita</button><button class="secondary" data-action="close">Cancelar</button>`;
  if (d.type === "assets")
    return `<span class="eyebrow">IMAGENS E CRÉDITOS</span><h2>Imagens do catálogo</h2><p>Arte de Dead by Daylight, Behaviour Interactive e respectivos licenciantes. Aplicativo independente. As fontes públicas abaixo documentam a origem; não representam uma licença livre nem aprovação oficial.</p><p>Os arquivos locais funcionam sem downloads externos durante o uso. Duas entradas conservam a arte do nome legado equivalente.</p><div class="audit-list">${assetCredits(
      state.catalog,
    )
      .map(
        (a) =>
          `<article><strong>${escape(a.kind === "portrait" ? killer(a.entity_id)?.name : perkName(perk(a.entity_id)))}</strong><small>${a.kind === "portrait" ? "Retrato" : "Ícone"} · ${a.local ? "Incluído no aplicativo" : escape(a.status)}${a.variant === "legacy_equivalent" ? " · Arte do nome legado equivalente" : ""}</small><a href="${escape(a.source_url)}" target="_blank" rel="noopener noreferrer">Fonte da imagem</a></article>`,
      )
      .join("")}</div>${
      assetFailures().length
        ? `<h3>Falhas nesta sessão</h3>${assetFailures()
            .map((a) => `<p>${escape(a.id)}: ${escape(a.error)}</p>`)
            .join("")}`
        : ""
    }`;

  return `<span class="eyebrow">PERFIL</span><h2>${state.demo ? "Visitante" : escape(state.user?.email)}</h2><p>${state.demo ? "Os registros desta sessão são temporários. Entre para manter sua coleção na nuvem." : "Sua coleção, suas configurações e seus favoritos são privados e vinculados à sua conta."}</p><button class="primary" data-action="logout">${state.demo ? "Ir para entrar" : "Sair"}</button>`;
}
function calculate() {
  const key = JSON.stringify([
    revision,
    selected()?.id,
    state.preferences.style,
    weights(),
    state.preferences.only_available,
    state.rotation,
  ]);
  if (cache.has(key)) {
    state.result = structuredClone(cache.get(key));
    state.buildIndex = 0;
    renderContent();
    return;
  }
  state.loading = true;
  const id = ++job;
  worker?.terminate();
  worker = new Worker(new URL("./recommend.worker.js", import.meta.url), {
    type: "module",
  });
  worker.onmessage = ({ data }) => {
    if (data.id !== job) return;
    state.loading = false;
    worker.terminate();
    worker = null;
    if (data.error) {
      notify(data.error, true);
      state.result = { builds: [] };
    } else {
      state.result = data.result;
      cache.set(key, structuredClone(data.result));
      if (cache.size > 24) cache.delete(cache.keys().next().value);
    }
    state.buildIndex = 0;
    renderContent();
  };
  worker.onerror = () => {
    state.loading = false;
    state.result = { builds: [] };
    worker?.terminate();
    worker = null;
    notify("Falha no cálculo. Tente gerar novamente.", true);
    renderContent();
  };
  worker.postMessage({ id, input: input() });
  renderContent();
}
app.addEventListener("click", (event) => {
  const el = event.target.closest("button");
  if (!el || el.disabled || state.busy) return;
  if (el.dataset.nav) {
    state.selection = null;
    state.route = el.dataset.nav;
    state.search = "";
    state.limit = 24;
    state.drawer = null;
    render();
    return;
  }
  if (el.dataset.auth) {
    state.authMode = el.dataset.auth;
    render();
    return;
  }
  if (el.dataset.killer) {
    openDrawer({ type: "killer", id: el.dataset.killer });
    return;
  }
  if (
    el.dataset.perk &&
    el.dataset.forKiller &&
    el.dataset.forKiller !== selected()?.id
  ) {
    act(async () => {
      await savePreferences({ selected_killer: el.dataset.forKiller });
      openDrawer({ type: "perk", id: el.dataset.perk });
    });
    return;
  }
  if (el.dataset.perk) {
    openDrawer({ type: "perk", id: el.dataset.perk });
    return;
  }
  if (el.dataset.preset) {
    act(async () => {
      const preset = themedBuilds.find((p) => p.id === el.dataset.preset);
      if (!preset) throw Error("Receita não encontrada.");
      await savePreferences({
        selected_killer: preset.killerId,
        style: preset.style,
      });
      state.result = {
        method: "themed",
        builds: [prepareThemedBuild(preset, input())],
      };
      state.buildIndex = 0;
      state.drawer = null;
      state.route = "build";
      state.search = "";
    });
    return;
  }
  if (el.dataset.generate) {
    act(async () => {
      await savePreferences({ selected_killer: el.dataset.generate });
      state.drawer = null;
      state.route = "build";
      state.search = "";
    });
    return;
  }
  if (el.dataset.style) {
    act(() => savePreferences({ style: el.dataset.style }));
    return;
  }
  if (el.dataset.build !== undefined) {
    state.editingFavoriteId = null;
    state.buildIndex = Number(el.dataset.build);
    renderContent();
    return;
  }
  if (el.dataset.replace !== undefined) {
    openDrawer({ type: "replace", slot: Number(el.dataset.replace) });
    return;
  }
  if (el.dataset.selectReplacement) {
    const old = currentBuild(),
      next = [...old.perks],
      candidate = alternatives(old, state.drawer.slot, input()).find(
        (a) => a.perk.id === el.dataset.selectReplacement,
      );
    if (!candidate) return;
    next[state.drawer.slot] = candidate.perk;
    state.result.builds[state.buildIndex] = {
      ...scoreBuild(
        next,
        selected(),
        old.style,
        state.catalog.synergies,
        weights(),
        state.catalog.perks,
      ),
      preset: old.preset,
      modified: !!old.preset,
      savedNotes: old.savedNotes,
      label: old.preset
        ? `${old.preset.name} · Adaptada`
        : "Build personalizada",
    };
    closeDrawer();
    renderContent();
    notify("Vantagem substituída.");
    return;
  }
  if (el.dataset.editFavorite) {
    openDrawer({ type: "favorite", id: el.dataset.editFavorite });
    return;
  }
  if (el.dataset.openFavorite) {
    act(async () => {
      const f = state.favorites.find((f) => f.id === el.dataset.openFavorite);
      await savePreferences({ selected_killer: f.killer_id, style: f.style });
      const actual = new Map(pool().map((p) => [p.id, p]));
      const perks = [f.perk_1, f.perk_2, f.perk_3, f.perk_4].map(
        (id) => actual.get(id) || { ...perk(id), tier: null, available: false },
      );
      state.result = {
        method: "saved",
        builds: [
          {
            ...scoreBuild(
              perks,
              selected(),
              f.style,
              state.catalog.synergies,
              weights(),
              state.catalog.perks,
            ),
            label: f.name,
            savedNotes: f.notes,
          },
        ],
      };
      state.buildIndex = 0;
      state.editingFavoriteId = f.id;
      state.route = "build";
      state.search = "";
      state.drawer = null;
    });
    return;
  }
  if (el.dataset.deleteFavorite) {
    openDrawer({ type: "confirm-delete", id: el.dataset.deleteFavorite });
    return;
  }
  if (el.dataset.confirmDelete) {
    act(async () => {
      if (!state.demo)
        await remove(cloud, "dbc_favorites", {
          user_id: state.user.id,
          id: el.dataset.confirmDelete,
        });
      state.favorites = state.favorites.filter(
        (f) => f.id !== el.dataset.confirmDelete,
      );
      state.drawer = null;
      notify("Favorita excluída.");
    });
    return;
  }
  if (el.dataset.confirmRemove) {
    act(async () => {
      const id = el.dataset.confirmRemove;
      if (!state.demo)
        await remove(cloud, "dbc_collection", {
          user_id: state.user.id,
          killer_id: id,
        });
      state.collection = state.collection.filter((c) => c.killer_id !== id);
      state.overrides = state.overrides.filter((p) => p.killer_id !== id);
      state.favorites = state.favorites.filter((f) => f.killer_id !== id);
      invalidate();
      state.drawer = null;
      notify("Assassino removido.");
    });
    return;
  }
  switch (el.dataset.action) {
    case "select-mode":
      state.selection = state.selection ? null : new Set();
      renderContent();
      break;
    case "select-all":
      state.selection = new Set((state.route === "collection" ? collectionList() : perksList()).map(x => x.id));
      renderContent();
      break;
    case "select-clear":
      state.selection.clear();
      renderContent();
      break;
    case "bulk-acquire":
    case "bulk-unmark":
    case "bulk-auto": {
      const ids = [...(state.selection || [])];
      if (!ids.length) break;
      if (state.route === "collection" && el.dataset.action === "bulk-unmark") {
        const acquired = ids.filter(id => owned(id));
        if (acquired.length) openDrawer({ type: "confirm-bulk-remove", ids: acquired });
        else notify("Nenhum assassino adquirido na seleção.");
      } else act(() => applyBulk(el.dataset.action, ids));
      break;
    }
    case "confirm-bulk-remove":
      act(() => applyBulk("bulk-unmark", state.drawer.ids));
      break;
    case "demo":
      reset();
      state.demo = true;
      render();
      break;
    case "close":
      closeDrawer();
      break;
    case "collapse":
      act(() =>
        savePreferences({
          sidebar_collapsed: !state.preferences.sidebar_collapsed,
        }),
      );
      break;
    case "profile":
      openDrawer({ type: "profile" });
      break;
    case "asset-report":
      openDrawer({ type: "assets" });
      break;
    case "more":
      state.limit += 24;
      renderContent();
      break;
    case "logout":
      act(async () => {
        if (!state.demo) {
          const { error } = await cloud.auth.signOut({ scope: "local" });
          if (error) {
            if (!state.user) {
              notify("Sessão removida deste dispositivo. Não foi possível confirmar o encerramento na nuvem.", true);
              return;
            }
            throw error;
          }
        }
        reset();
        notify("Sessão encerrada.");
      });
      break;
    case "sync":
      act(async () => {
        await hydrate();
        notify("Dados recarregados da nuvem.");
      });
      break;
    case "reset-weights":
      act(async () => {
        await savePreferences({ weights: {} });
        notify("Pesos restaurados.");
      });
      break;
    case "reroll":
      state.rotation++;
      invalidate();
      calculate();
      break;
    case "favorite":
      if (currentBuild()) {
        if (!owned(selected().id)) {
          notify(
            "Adicione este assassino à sua coleção antes de salvar uma favorita.",
            true,
          );
          return;
        }
        openDrawer({
          type: "favorite",
          id: state.editingFavoriteId,
          fromBuild: true,
        });
      }
      break;
  }
});
app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target,
    data = new FormData(form);
  if (form.id === "auth-form")
    act(async () => {
      if (!cloud) throw Error("Configure o Supabase primeiro.");
      const email = String(data.get("email")).trim(),
        password = String(data.get("password") || ""),
        token = String(data.get("token") || "");
      if (state.authMode === "recover") {
        const { error } = await cloud.auth.resetPasswordForEmail(email);
        if (error) throw error;
        state.authMode = "reset";
        notify(
          "Se o e-mail estiver cadastrado, você receberá instruções de recuperação.",
        );
        return;
      }
      if (state.authMode === "reset") {
        const { error: verifyError } = await cloud.auth.verifyOtp(
          emailVerification(
            token,
            email,
            "recovery",
            import.meta.env.VITE_SUPABASE_URL,
          ),
        );
        if (verifyError) throw verifyError;
        const { error } = await cloud.auth.updateUser({ password });
        if (error) throw error;
        await cloud.auth.signOut({ scope: "local" });
        state.authMode = "login";
        notify("Senha atualizada. Entre com a nova senha.");
        return;
      }
      const result =
        state.authMode === "register"
          ? await cloud.auth.signUp({ email, password })
          : state.authMode === "confirm"
            ? await cloud.auth.verifyOtp(
                emailVerification(
                  token,
                  email,
                  "signup",
                  import.meta.env.VITE_SUPABASE_URL,
                ),
              )
            : await cloud.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (!result.data.session) {
        state.authMode = "confirm";
        notify("Confira seu e-mail para confirmar a conta.");
        return;
      }
      state.user = result.data.user;
      state.demo = false;
      state.dataReady = false;
      await hydrate();
    });

  if (form.dataset.collection) {
    const id = form.dataset.collection;
    if (!data.has("owned")) {
      if (owned(id)) openDrawer({ type: "confirm-remove", id });
      else closeDrawer();
      return;
    }
    act(async () => {
      const prestige = Number(data.get("prestige"));
      if (!Number.isInteger(prestige) || prestige < 0 || prestige > 100)
        throw Error("Prestígio deve ser um inteiro entre 0 e 100.");
      const row = { killer_id: id, prestige };
      if (!state.demo)
        await upsert(cloud, "dbc_collection", {
          ...row,
          user_id: state.user.id,
        });
      state.collection = state.collection
        .filter((x) => x.killer_id !== id)
        .concat(row);
      invalidate();
      notify(
        state.demo
          ? "Coleção atualizada nesta sessão."
          : "Coleção salva na nuvem.",
      );
    });
  }
  if (form.id === "settings-form")
    act(async () => {
      const next = Object.fromEntries(
        Object.keys(weights()).map((key) => [key, Number(data.get(key))]),
      );
      await savePreferences({
        weights: normalizeWeights(next),
        compact: data.has("compact"),
      });
      notify("Ajustes salvos.");
    });
  if (form.id === "favorite-form")
    act(async () => {
      const prior = state.drawer.id
          ? state.favorites.find((f) => f.id === state.drawer.id)
          : null,
        b = currentBuild(),
        name = String(data.get("name")).trim();
      if (!name) throw Error("Digite um nome para a build.");
      const row = prior
        ? {
            ...prior,
            name,
            notes: String(data.get("notes")),
            ...(state.drawer.fromBuild
              ? {
                  style: b.style,
                  perk_1: b.perks[0].id,
                  perk_2: b.perks[1].id,
                  perk_3: b.perks[2].id,
                  perk_4: b.perks[3].id,
                  catalog_version: state.catalog.config.version,
                }
              : {}),
          }
        : {
            killer_id: selected().id,
            name,
            notes: String(data.get("notes")),
            style: b.style,
            perk_1: b.perks[0].id,
            perk_2: b.perks[1].id,
            perk_3: b.perks[2].id,
            perk_4: b.perks[3].id,
            catalog_version: state.catalog.config.version,
          };
      const saved = state.demo
        ? {
            ...row,
            id:
              prior?.id ||
              globalThis.crypto?.randomUUID?.() ||
              "visitante-" +
                Date.now() +
                "-" +
                Math.random().toString(36).slice(2),
            created_at: prior?.created_at || new Date().toISOString(),
          }
        : await upsert(cloud, "dbc_favorites", {
            ...row,
            user_id: state.user.id,
          });
      state.favorites = state.favorites
        .filter((f) => f.id !== saved.id)
        .concat(saved);
      state.drawer = null;
      notify(
        state.demo
          ? "Favorita guardada somente nesta sessão."
          : "Favorita salva na nuvem.",
      );
    });
});
app.addEventListener("change", (event) => {
  const el = event.target;
  if (state.busy) return;
  if (el.dataset.selectItem && state.selection) {
    if (el.checked) state.selection.add(el.dataset.selectItem);
    else state.selection.delete(el.dataset.selectItem);
    const id = el.dataset.selectItem;
    renderContent();
    app.querySelector('[data-select-item="'+id+'"]')?.focus();
    return;
  }
  if (el.id === "bulk-tier") state.bulkTier = Number(el.value);
  if (el.id === "killer-select")
    act(() => savePreferences({ selected_killer: el.value }));
  if (el.id === "only-available")
    act(() => savePreferences({ only_available: el.checked }));
  if (el.dataset.filter) {
    state.selection?.clear();
    state[el.dataset.filter] = el.value;
    state.limit = 24;
    renderContent();
  }
  if (el.id === "replacement-category") {
    state.drawer.category = el.value;
    renderDrawer();
  }
  if (el.dataset.unlock)
    act(async () => {
      const match = { killer_id: selected().id, perk_id: el.dataset.unlock };
      if (el.value === "auto") {
        if (!state.demo)
          await remove(cloud, "dbc_perk_unlocks", {
            ...match,
            user_id: state.user.id,
          });
        state.overrides = state.overrides.filter(
          (x) =>
            !(x.killer_id === match.killer_id && x.perk_id === match.perk_id),
        );
      } else {
        const row = { ...match, tier: Number(el.value) };
        if (!state.demo)
          await upsert(cloud, "dbc_perk_unlocks", {
            ...row,
            user_id: state.user.id,
          });
        state.overrides = state.overrides
          .filter(
            (x) =>
              !(x.killer_id === match.killer_id && x.perk_id === match.perk_id),
          )
          .concat(row);
      }
      invalidate();
      notify("Disponibilidade atualizada.");
    });
});
app.addEventListener("input", (event) => {
  const el = event.target;
  if (el.id === "context-search") {
    state.selection?.clear();
    state.search = el.value;
    state.limit = 24;
    renderContent();
    renderSearch();
  }
  if (el.id === "replacement-search") {
    state.drawer.search = el.value;
    const pos = el.selectionStart;
    document.querySelector("#drawer-content").innerHTML = drawerContent();
    const fresh = document.querySelector("#replacement-search");
    fresh.focus();
    fresh.setSelectionRange(pos, pos);
    mountAssets(app, state.catalog);
  }
});
function renderSearch() {
  document.querySelector(".search-suggestions")?.remove();
  if (
    !["home", "build", "settings"].includes(state.route) ||
    !state.search.trim()
  )
    return;
  const query = normalize(state.search);
  const matches = [
    ...state.catalog.killers
      .filter((k) => normalize(k.name + " " + k.name_en).includes(query))
      .slice(0, 4)
      .map(
        (k) =>
          '<button data-killer="' +
          k.id +
          '">' +
          escape(k.name) +
          "<small>Assassino</small></button>",
      ),
    ...state.catalog.perks
      .filter((p) =>
        normalize(p.name + " " + (p.name_pt || "")).includes(query),
      )
      .slice(0, 5)
      .map(
        (p) =>
          '<button data-perk="' +
          p.id +
          '">' +
          pname(p) +
          "<small>Vantagem</small></button>",
      ),
  ];
  const box = document.createElement("div");
  box.className = "search-suggestions";
  box.innerHTML = matches.join("") || "<p>Nenhum resultado.</p>";
  document.querySelector(".workspace>header").append(box);
}
// Supabase callbacks run under its auth lock: never await another auth call here.
cloud?.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    const hadUser = !!state.user;
    reset();
    render();
    if (hadUser) notify("Sessão encerrada. Entre novamente para acessar sua coleção.");
  } else if (session && state.user?.id === session.user.id) {
    state.user = session.user;
  } else if (session && !state.restoring && !state.busy && !state.demo && ["SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) {
    // A refresh may recover after a temporary network outage; another window may sign in.
    reset();
    state.restoring = true;
    render();
    setTimeout(restoreSession, 0);
  }
});
async function restoreSession() {
  if (!cloud) return;
  try {
    const { data, error } = await cloud.auth.getSession();
    if (error) throw error;
    if (data.session) {
      state.user = data.session.user;
      await hydrate();
    }
  } catch (error) {
    state.syncError = true;
    notify(errorText(error), true);
  } finally {
    state.restoring = false;
    render();
  }
}
window.addEventListener("offline", render);
window.addEventListener("online", render);
window.addEventListener("beforeunload", () => {
  worker?.terminate();
  cache.clear();
  clearAssets();
});
render();

restoreSession();
