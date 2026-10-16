import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qa = path.resolve(process.argv[2] || path.join(root, "reference-inputs"));
// Forneça JSONs de referência atualizados; nenhum HTML remoto é executado.
const read = async (f) => JSON.parse(await readFile(path.join(qa, f), "utf8"));
const official = await read("official-characters.json"),
  reference = await read("wiki-perks.json"),
  roster = await read("wiki-roster.json");
const legacy = await import("./legacy-catalog.mjs");
const clean = (s) => s?.trim().replace(/\s+/g, " ") || "";
const norm = (s) =>
  clean(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/chilli/g, "chili")
    .replace(/favour/g, "favor")
    .replace(/[^a-z0-9]/g, "");
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const edited = new Map(
  (await readFile(path.join(root, "scripts/editorial-perks.txt"), "utf8"))
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const [name, categories, strength, effect] = l.split("|");
      return [
        norm(name),
        {
          categories: categories.split(","),
          strength: Number(strength),
          effect,
        },
      ];
    }),
);
const traits = {
  trapper: "basic setup territory",
  wraith: "basic stealth mobility injury",
  hillbilly: "mobility special instadown",
  nurse: "mobility special blink",
  shape: "basic stealth instadown",
  hag: "basic setup territory teleport",
  doctor: "basic territory skillchecks",
  huntress: "special ranged locker",
  cannibal: "special instadown",
  nightmare: "basic teleport territory",
  pig: "basic stealth setup",
  clown: "basic chase",
  spirit: "basic mobility stealth",
  legion: "basic injury mobility",
  plague: "infection special snowball",
  "ghost-face": "basic stealth instadown",
  demogorgon: "basic special teleport",
  oni: "special snowball instadown mobility",
  deathslinger: "basic ranged",
  executioner: "special ranged cage",
  blight: "special mobility",
  twins: "special injury snowball",
  trickster: "special ranged locker",
  nemesis: "special ranged",
  cenobite: "basic setup territory",
  artist: "special ranged territory",
  onryo: "basic stealth teleport",
  dredge: "basic teleport stealth",
  mastermind: "special mobility",
  knight: "basic territory",
  "skull-merchant": "basic territory setup",
  singularity: "basic teleport setup",
  xenomorph: "special ranged teleport",
  "good-guy": "special stealth",
  unknown: "special ranged teleport",
  lich: "basic ranged mobility",
  "dark-lord": "special ranged mobility",
  houndmaster: "basic mobility",
  ghoul: "special mobility",
  animatronic: "special ranged teleport",
  krasue: "special mobility",
  first: "special ranged teleport",
  slasher: "special ranged stealth",
  judgment: "special ranged exile",
};
const desc = {
  trapper:
    "Armadilhas controlam rotas; precisa de tempo para preparar o território.",
  wraith: "Invisibilidade permite aproximar, ferir e trocar de alvo.",
  hillbilly: "Motosserra combina deslocamento rápido e quedas imediatas.",
  nurse:
    "Teletransportes atravessam obstáculos; seus golpes após o teleporte são especiais.",
  shape:
    "Persegue furtivamente e usa seus modos de poder para pressionar a equipe.",
  hag: "Armadilhas criam uma rede de teletransportes para defender território.",
  doctor:
    "Choques interrompem ações e a Loucura ajuda a localizar sobreviventes.",
  huntress: "Machadinhas ferem à distância; armários reabastecem sua munição.",
  cannibal: "Varreduras de motosserra ameaçam quedas imediatas e vários alvos.",
  nightmare:
    "O mundo dos sonhos combina ferramentas de perseguição e teletransporte.",
  pig: "Emboscadas furtivas e armadilhas reversas dividem a atenção dos sobreviventes.",
  clown:
    "Frascos desaceleram alvos ou aceleram deslocamentos durante a perseguição.",
  spirit: "O deslocamento em fase exige rastreamento por sons e marcas.",
  legion:
    "A Fúria Bestial espalha ferimentos; ataques básicos finalizam os alvos.",
  plague:
    "Infecção limita a cura; a purificação oferece ataques especiais à distância.",
  "ghost-face": "Furtividade e espreita preparam alvos Expostos.",
  demogorgon:
    "Portais dão mobilidade e o Bote cobre distâncias na perseguição.",
  oni: "Sangue alimenta um modo de investidas rápidas e quedas imediatas.",
  deathslinger: "Arpão prende e puxa sobreviventes para ataques próximos.",
  executioner:
    "Trilhas e ataques à distância aplicam pressão; jaulas não contam como ganchos.",
  blight:
    "Sequências de investidas com colisões permitem travessia rápida e perseguição.",
  twins:
    "Alterna Charlotte e Victor para espalhar ferimentos e pressionar alvos.",
  trickster:
    "Rajadas de lâminas acumulam laceração; armários reabastecem sua munição.",
  nemesis: "Tentáculo e zumbis contaminam e pressionam sobreviventes.",
  cenobite:
    "Correntes e a caixa do enigma dividem objetivos e dificultam perseguições.",
  artist: "Corvos cruzam o mapa, revelam alvos e ameaçam rotas.",
  onryo: "Televisores permitem deslocamento e espalham Condenação.",
  dredge:
    "Armários permitem teletransporte; o Anoitecer dificulta a orientação.",
  mastermind:
    "Investidas agarram e infectam alvos, combinando perseguição e mobilidade.",
  knight: "Guardas patrulham, perseguem e ajudam a controlar rotas.",
  "skull-merchant":
    "Drones fornecem rastreamento e pressão em áreas preparadas.",
  singularity:
    "Biocápsulas rastreiam alvos e permitem aproximações por teletransporte.",
  xenomorph: "Túneis permitem travessia e a cauda atinge alvos à distância.",
  "good-guy":
    "Furtividade e investidas especiais aproveitam o tamanho reduzido.",
  unknown: "Projéteis enfraquecem alvos; alucinações permitem teletransporte.",
  lich: "Alterna feitiços para informação, deslocamento e controle de pallets.",
  "dark-lord":
    "Alterna formas de vampiro, lobo e morcego para perseguir e atravessar o mapa.",
  houndmaster: "Comanda seu cão para rastrear, perseguir e segurar alvos.",
  ghoul: "Saltos de kagune dão mobilidade e pressão na perseguição.",
  animatronic:
    "Projéteis e portas de segurança permitem perseguição e aproximação.",
  krasue:
    "Alterna a forma humana e a cabeça flutuante para perseguir e atacar.",
  first:
    "Usa o Mundo Invertido, ataques no solo e maldições para pressionar alvos.",
  slasher:
    "Invisibilidade e projéteis combinam aproximações furtivas e controle de alvos.",
  judgment:
    "Luz Divina aplica Heresia; o Exílio altera a forma de pressionar sobreviventes.",
};
const ownerID = (s) => slug(s).replace(/^the-/, "");
const idFromOfficial = (c) =>
  ({
    "the-lich-vecna": "lich",
    dracula: "dark-lord",
    "the-good-guy-chucky": "good-guy",
  })[c.slug] || ownerID(c.slug);
const killers = official.map((c) => {
  const id = idFromOfficial(c.en);
  return {
    id,
    name: clean(c.pt?.title || c.en.title).replace(/^o Matador/, "O Matador"),
    name_en: clean(c.en.title),
    tags: traits[id].split(" "),
    description: desc[id],
    power: clean(c.pt?.powerPerks[0]?.title || c.en.powerPerks[0]?.title),
    source_url: `https://deadbydaylight.com/game/characters/${c.en.slug}/`,
    source_pt: `https://deadbydaylight.com/pt-br/jogo/personagens/${c.ptSlug}/`,
    portrait_asset: `killer:${id}`,
    inclusion: c.en.inclusion,
    legacy: false,
  };
});
killers.push(
  ...[
    {
      id: "shape",
      name: "The Shape · Michael Myers",
      name_en: "The Shape",
      power: "Evil Within",
    },
    {
      id: "cenobite",
      name: "The Cenobite · Pinhead",
      name_en: "The Cenobite",
      power: "Summons of Pain",
    },
  ].map((k) => ({
    ...k,
    tags: traits[k.id].split(" "),
    description: desc[k.id],
    source_url: roster.find((r) => norm(r.name) === norm(k.name_en)).url,
    portrait_asset: `killer:${k.id}`,
    inclusion: "franchiseDLC",
    legacy: true,
  })),
);
killers.sort((a, b) => a.id.localeCompare(b.id));
const oldIDs = new Map(legacy.perks.map((p) => [norm(p.name), p.id]));
const familyNames = {
  Deadlock: "No Holds Barred",
  "Dying Light": "Cull the Weak",
  "Play with Your Food": "See How They Run",
  "Save the Best for Last": "Keep Them Waiting",
  "Hex: Plaything": "Hex: Fortune's Fool",
  "Scourge Hook: Gift of Pain": "Scourge Hook: Weeping Wounds",
};
const perkID = (name) => oldIDs.get(norm(name)) || slug(name);
const categoryMain = (c) =>
  ["regression", "block", "pressure", "endgame"].includes(c)
    ? "control"
    : ["stealth", "mobility"].includes(c)
      ? "utility"
      : c;
const issue = [];
const assets = [];
for (const k of killers) {
  const raw = official.find((c) => idFromOfficial(c.en) === k.id);
  const image =
    raw?.en.characterRender?.url ||
    roster.find((r) => norm(r.name) === norm(k.name_en))?.image;
  const approved = false;
  assets.push({
    id: k.portrait_asset,
    kind: "portrait",
    entity_id: k.id,
    source_url: image || "",
    storage_path: approved ? `killers/${k.id}.png` : null,
    status: approved ? "pending_upload" : "license_pending",
    license_url: "https://www.bhvr.com/fan-created-content/",
    license_note: approved
      ? "Arte própria da BHVR: uso pessoal não comercial conforme seção V.E."
      : "Autorização específica para uso em aplicativo pendente.",
    checked_at: null,
  });
}
const perks = reference.map((p) => {
  const name = p.name,
    id = perkID(name),
    owner_id = p.owner === ". All" ? null : ownerID(p.owner),
    family = familyNames[name],
    edit = edited.get(norm(family || name));
  if (!edit) throw Error("Falta resumo editorial: " + name);
  const raw = official.find((c) => idFromOfficial(c.en) === owner_id);
  const lookup = norm(name.replace(/^Scourge Hook: /, ""));
  const index =
    raw?.en.powerPerks.findIndex(
      (x) => norm(x.title) === norm(name) || norm(x.title) === lookup,
    ) ?? -1;
  let pt = index > 0 ? clean(raw.pt?.powerPerks[index]?.title) : null;
  if (name === "Friends 'til the End") pt = "Amigos até o Fim";
  if (name === "Hex: Two Can Play") pt = "Feitiço: Dois Podem Jogar";
  if (!pt)
    issue.push({
      type: "translation",
      id,
      note: "Nome oficial PT-BR ainda não confirmado; exibido em inglês.",
    });
  const category = categoryMain(edit.categories[0]);
  const prior = legacy.perks.find((x) => x.id === id);
  const affinities = { ...(prior?.affinities || {}) };
  if (edit.categories.includes("information")) {
    affinities.mobility ??= 0.8;
    affinities.ranged ??= 0.5;
  }
  if (
    /Basic Attack|basic-attack/.test(p.effect) &&
    !["Hex: The Third Seal"].includes(name)
  ) {
    affinities.basic ??= 1.4;
    affinities.special ??= -1.2;
    affinities.blink ??= -4;
  }
  if (
    [
      "Bamboozle",
      "Superior Anatomy",
      "Dark Arrogance",
      "Enduring",
      "Brutal Strength",
      "Spirit Fury",
      "Coup de Grâce",
      "All-Shaking Thunder",
    ].includes(name)
  ) {
    affinities.basic ??= 1.4;
    affinities.blink = -4;
  }
  if (["Iron Maiden", "Darkness Revealed"].includes(name))
    affinities.locker = 2;
  if (
    [
      "Sloppy Butcher",
      "Coulrophobia",
      "Septic Touch",
      "No Quarter",
      "A Nurse's Calling",
    ].includes(name)
  )
    affinities.infection = -5;
  if (/hook/i.test(p.effect)) {
    affinities.cage = -1.5;
    affinities.exile = -1;
  }
  if (name === "Thanatophobia") {
    affinities.injury = 3;
    affinities.infection = 2;
  }
  const approved = false;
  assets.push({
    id: `perk:${id}`,
    kind: "perk",
    entity_id: id,
    source_url: p.image_source,
    storage_path: approved ? `perks/${id}.png` : null,
    status: approved ? "pending_upload" : "license_pending",
    license_url: "https://www.bhvr.com/fan-created-content/",
    license_note: approved
      ? "Ícone de conteúdo original; uso pessoal não comercial, seção V.E."
      : "Autorização específica para uso em aplicativo pendente.",
    checked_at: null,
  });
  return {
    id,
    name,
    name_pt: pt,
    owner_id,
    category,
    ...edit,
    affinities,
    source_url: p.source_url,
    source_official: raw
      ? `https://deadbydaylight.com/game/characters/${raw.en.slug}/`
      : null,
    icon_asset: `perk:${id}`,
    equivalent_id: perkID(family || name),
    legacy: !!family,
    reviewed_at: "2026-10-15",
  };
});
const synergies = legacy.synergies.map((s) => ({ ...s }));
const add = (a, b, value, reason) =>
  synergies.push({ perk_a: perkID(a), perk_b: perkID(b), value, reason });
add(
  "Hex: Ruin",
  "Hex: Undying",
  4,
  "Imortal pode preservar Ruína quando o totem dela é removido.",
);
add(
  "Hex: Pentimento",
  "Hex: Fortune's Fool",
  3,
  "A limpeza dos totens de Alheio cria oportunidades para reacender totens.",
);
add(
  "Franklin's Demise",
  "Weave Attunement",
  3,
  "Itens derrubados por golpes básicos criam pontos de leitura de auras.",
);
add(
  "Lethal Pursuer",
  "I'm All Ears",
  2,
  "Perseguidor Mortífero prolonga a leitura de aura com duração definida.",
);
add(
  "Lethal Pursuer",
  "Nowhere to Hide",
  2,
  "A extensão de aura ajuda a aproveitar a informação após danificar geradores.",
);
add(
  "Scourge Hook: Jagged Compass",
  "Scourge Hook: Pain Resonance",
  2.5,
  "Converter mais ganchos aumenta as opções para ativar Ressonância da Dor.",
);
add(
  "Enduring",
  "Hubris",
  2,
  "Recuperar rapidamente do atordoamento ajuda a aproveitar Exposto.",
);
add(
  "Hex: Ruin",
  "Pop Goes the Weasel",
  -3,
  "Um gerador já regredindo por Ruína não pode ser danificado até alguém interromper a regressão.",
);
add(
  "Rapid Brutality",
  "Beast of Prey",
  -8,
  "Brutalidade Veloz impede Sede de Sangue, condição de Besta da Caça.",
);
add(
  "Lightborn",
  "Shadowborn",
  -8,
  "Imunidade à cegueira impede o gatilho de Nascido das Sombras.",
);
add(
  "Distressing",
  "Coulrophobia",
  2,
  "Um raio de terror maior amplia a área que dificulta curas.",
);
add(
  "No Way Out",
  "Hex: No One Escapes Death",
  2,
  "Bloquear interruptores dá mais tempo para pressionar alvos Expostos no fim.",
);
add(
  "Secret Project",
  "Grim Embrace",
  2,
  "Os bloqueios de Abraço Sinistro ativam Indetectável de Projeto Secreto.",
);
for (const s of synergies) [s.perk_a, s.perk_b] = [s.perk_a, s.perk_b].sort();
const data = {
  killers,
  perks,
  synergies,
  assets,
  config: {
    id: 1,
    version: "catalog-2026-10-15-v2",
    reviewed_at: "2026-10-15",
    notice:
      killers.length +
      " assassinos e " +
      perks.length +
      " nomes de vantagens. " +
      new Set(perks.map((p) => p.equivalent_id)).size +
      " efeitos distintos. Resumos funcionais e pontuação editorial. Todas as imagens aguardam autorização específica para uso em aplicativo.",
    weights: legacy.defaults,
  },
};
const refs = new Set(reference.map((p) => p.name));
const referenceOwners = new Set(
  reference.filter((p) => p.owner !== ". All").map((p) => ownerID(p.owner)),
);
if (
  killers.length !== referenceOwners.size ||
  killers.some((k) => !referenceOwners.has(k.id)) ||
  perks.some((p) => !refs.has(p.name))
)
  throw Error("Divergência do catálogo com a referência.");
for (const k of killers)
  if (perks.filter((p) => p.owner_id === k.id).length !== 3)
    throw Error("Relação de perks incorreta: " + k.id);
await writeFile(
  path.join(root, "src/catalog-data.json"),
  JSON.stringify(data, null, 2),
);
await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(
  path.join(root, "docs/catalog-audit.json"),
  JSON.stringify(
    {
      date: "2026-10-15",
      reference: "https://deadbydaylight.wiki.gg/wiki/Perks",
      killers: killers.length,
      perks: perks.length,
      effects: new Set(perks.map((p) => p.equivalent_id)).size,
      general: perks.filter((p) => !p.owner_id).length,
      issues: issue,
      license_pending: assets
        .filter((a) => a.status === "license_pending")
        .map((a) => a.id),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    killers: killers.length,
    perks: perks.length,
    assets: assets.length,
    pendingLicenses: assets.filter((a) => a.status === "license_pending")
      .length,
    translationsPending: issue.length,
  }),
);
