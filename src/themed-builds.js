import { candidatePool, family, scoreBuild } from "./recommender.js";

const wiki = (name) =>
  `https://deadbydaylight.wiki.gg/wiki/${encodeURIComponent(name.replaceAll(" ", "_"))}`;
const addon = (name, required, note) => ({
  name,
  required,
  note,
  url: wiki(name),
});

// Receitas editoriais inspiradas em arquétipos da comunidade, sem ranking de popularidade.
export const themedBuilds = [
  {
    id: "basement-trapper",
    name: "Basement Trapper",
    killerId: "trapper",
    style: "control",
    category: "Território e resgate",
    tagline:
      "Transforme o porão em uma rota de resgate cheia de decisões difíceis.",
    perkIds: [
      "agitation",
      "iron-grasp",
      "mad-grit",
      "scourge-hook-monstrous-shrine",
    ],
    addons: [],
    addonNote:
      "Nenhum add-on obrigatório. Escolha os que ajudam sua preparação e reposição de armadilhas.",
    plan: [
      "Prepare entradas e rotas próximas ao porão sem abandonar os geradores por muito tempo.",
      "Use Agitation e Iron Grasp para levar um abate próximo ao porão. Mad Grit ajuda contra bloqueios durante o transporte.",
      "Saia para pressionar o mapa e deixe as armadilhas cobrarem tempo dos resgates; reposicione-as quando os sobreviventes descobrirem suas rotas.",
    ],
    cautions: [
      "O porão pode ficar longe dos objetivos. Não force um transporte impossível.",
      "Monstrous Shrine depende das condições de distância do patch; ficar junto ao gancho contraria esse plano. Considere também o sistema antifacecamp.",
    ],
    sources: [
      "https://www.dbdbuilds.com/community-builds/killer/basement-trapper-cd2bfe38",
      wiki("Scourge Hook: Monstrous Shrine"),
    ],
  },
  {
    id: "m1-nurse",
    name: "M1 Nurse",
    killerId: "nurse",
    style: "chase",
    category: "Ataques básicos",
    tagline:
      "A Enfermeira que anda atrás de você: um desafio de perseguição com ataques básicos.",
    perkIds: ["bamboozle", "enduring", "spirit-fury", "surge"],
    addons: [
      addon(
        "Spasmodic Breath",
        true,
        "Após acertar um ataque de Blink, aumenta a velocidade para 4,6 m/s e desativa os Blinks por 60 segundos.",
      ),
      addon(
        '"Bad Man’s" Last Breath',
        false,
        "Opção de furtividade após acertar um ataque de Blink.",
      ),
    ],
    addonNote:
      "Spasmodic Breath é essencial para esta versão. A posse de add-ons não é registrada pelo aplicativo.",
    plan: [
      "Acerte um ataque após Blink para ativar Spasmodic Breath.",
      "Durante a janela sem Blinks, persiga a pé. Bamboozle fecha janelas; Enduring e Spirit Fury ajudam a atravessar a pressão dos pallets.",
      "Derrube com ataques básicos para ativar Surge. Quando o efeito terminar, procure outra oportunidade de ativar o add-on.",
    ],
    cautions: [
      "Ataques de Blink são ataques especiais: não ativam Surge.",
      "Sem o add-on obrigatório, a velocidade normal da Nurse não sustenta este plano. A pontuação genérica não modela essa mudança de poder.",
    ],
    sources: [
      wiki("Spasmodic Breath"),
      wiki("Surge"),
      "https://forums.bhvr.com/dead-by-daylight/discussion/337372/reminder-you-can-play-funny-nurse-builds-to-confuse-survivors",
    ],
  },
  {
    id: "speedblitz-clown",
    name: "Speedblitz Clown",
    killerId: "clown",
    style: "chase",
    category: "Velocidade e perseguição",
    tagline:
      "Combine o antídoto com janelas de aceleração para encurtar as rotas de fuga.",
    perkIds: [
      "rapid-brutality",
      "see-how-they-run",
      "batteries-included",
      "bamboozle",
    ],
    addons: [
      addon(
        "Cheap Gin Bottle",
        true,
        "Reforça a aceleração concedida pelo Afterpiece Antidote.",
      ),
      addon(
        "Sticky Soda Bottle",
        false,
        "Aumenta a quantidade de garrafas disponível para preparar as rotas.",
      ),
    ],
    addonNote:
      "Cheap Gin Bottle define esta variação. Confira os valores e a duração no patch em uso.",
    plan: [
      "Prepare a nuvem amarela no seu trajeto e use o tônico para dificultar o caminho do sobrevivente.",
      "Aproveite as janelas de Rapid Brutality após acertos e de Batteries Included perto dos geradores concluídos.",
      "Guarde fichas de See How They Run quando fizer sentido e use Bamboozle para impedir voltas repetidas pela mesma janela.",
    ],
    cautions: [
      "Rapid Brutality remove Bloodlust. As fontes de aceleração são condicionais, não um bônus permanente.",
      "Ataques consomem fichas da perk de obsessão. Não sacrifique toda a pressão para acumular velocidade. Play with Your Food é o nome legado do mesmo efeito.",
    ],
    sources: [
      wiki("Cheap Gin Bottle"),
      wiki("Rapid Brutality"),
      wiki("Batteries Included"),
      "https://forums.bhvr.com/dead-by-daylight/discussion/410077/play-with-your-food-favors-already-fast-killers-suggestion",
    ],
  },
  {
    id: "backpack-legion",
    name: "Backpack Legion",
    killerId: "legion",
    style: "chase",
    category: "Transporte e bloqueios",
    tagline:
      "Leve um sobrevivente no ombro e puna quem se arrisca para bloquear o gancho.",
    perkIds: ["agitation", "iron-grasp", "mad-grit", "awakened-awareness"],
    addons: [],
    addonNote:
      "Nenhum add-on obrigatório; a combinação funciona durante o transporte.",
    plan: [
      "Use o poder para espalhar ferimentos e escolha uma perseguição que possa converter em abate.",
      "Ao carregar, procure um gancho alcançável. Awakened Awareness ajuda a enxergar possíveis bloqueios.",
      "Agitation e Iron Grasp dão margem no transporte; Mad Grit pune os sobreviventes que tentam bloquear o caminho.",
    ],
    cautions: [
      "Mad Grit reduz a recuperação de ataques errados durante o transporte, não a de acertos.",
      "Você não usa Feral Frenzy carregando um sobrevivente. Se ninguém bloquear, priorize o gancho.",
    ],
    sources: [wiki("Mad Grit"), wiki("Awakened Awareness")],
  },
  {
    id: "skillcheck-doctor",
    name: "Doctor dos testes de perícia",
    killerId: "doctor",
    style: "control",
    category: "Testes de perícia",
    tagline:
      "A clássica ideia de “impossible skillchecks”, com pressão para provocar erros.",
    perkIds: ["distressing", "unnerving", "hex-huntress-lullaby", "overcharge"],
    addons: [],
    addonNote:
      "Nenhum add-on obrigatório. Os de alcance e Loucura podem complementar o plano.",
    plan: [
      "Use a Loucura para atrapalhar a leitura dos testes e Distressing para ampliar sua presença pelo raio de terror.",
      "Acumule ganchos para fortalecer Huntress Lullaby enquanto pressiona sobreviventes trabalhando nos objetivos.",
      "Aplique Overcharge em geradores relevantes e alterne as perseguições para obrigar novos reparos sob pressão.",
    ],
    cautions: [
      "“Impossible skillchecks” é um apelido: bons jogadores ainda podem acertar.",
      "O totem de Huntress Lullaby pode ser purificado. Unnerving Presence não afeta todos os tipos de teste; confira os gatilhos no jogo.",
    ],
    sources: [
      wiki("Unnerving Presence"),
      wiki("Hex: Huntress Lullaby"),
      wiki("Overcharge"),
    ],
  },
  {
    id: "endgame-wraith",
    name: "Wraith de fim de jogo",
    killerId: "wraith",
    style: "balanced",
    category: "Colapso final",
    tagline:
      "Guarde suas ferramentas mais fortes para a disputa pelos portões.",
    perkIds: [
      "no-way-out",
      "blood-warden",
      "remember-me",
      "hex-no-one-escapes-death",
    ],
    addons: [],
    addonNote:
      "Nenhum add-on obrigatório. Mobilidade ajuda a alternar a pressão entre os portões.",
    plan: [
      "Busque ganchos em sobreviventes diferentes durante a partida para preparar No Way Out.",
      "Construa Remember Me conforme seus gatilhos e acompanhe o momento em que o último gerador é concluído.",
      "Alterne os portões com a invisibilidade. Se houver um portão aberto, um gancho pode ativar Blood Warden.",
    ],
    cautions: [
      "As perks têm gatilhos diferentes: concluir geradores, tentar abrir e abrir um portão não são o mesmo evento.",
      "NOED depende de um totem disponível e pode ser removido. A build abre mão de controle durante boa parte da partida.",
    ],
    sources: [
      wiki("No Way Out"),
      wiki("Blood Warden"),
      wiki("Hex: No One Escapes Death"),
    ],
  },
].map((p) => ({ ...p, reviewedAt: "2026-10-15", edition: 1 }));

export function prepareThemedBuild(preset, input) {
  const { catalog } = input,
    killer = catalog.killers.find((k) => k.id === preset.killerId);
  if (!killer)
    throw Error("O assassino desta build não está disponível no catálogo.");
  const candidates = candidatePool({
    ...input,
    killerId: preset.killerId,
    onlyAvailable: false,
  });
  const perks = preset.perkIds.map((id) => {
    const original = catalog.perks.find((p) => p.id === id);
    const match =
      original && candidates.find((p) => family(p) === family(original));
    if (!match)
      throw Error(`A receita precisa de uma perk ausente do catálogo: ${id}.`);
    return match;
  });
  return {
    ...scoreBuild(
      perks,
      killer,
      preset.style,
      catalog.synergies,
      input.weights || catalog.config.weights,
      catalog.perks,
    ),
    label: preset.name,
    preset,
    modified: false,
  };
}
export function themedStatus(preset, input) {
  try {
    const build = prepareThemedBuild(preset, input);
    return {
      build,
      missing: build.perks.filter((p) => !p.available),
      error: null,
    };
  } catch (error) {
    return { build: null, missing: [], error: error.message };
  }
}
export function themedNotes(build) {
  if (!build?.preset) return build?.savedNotes || "";
  const p = build.preset;
  return [
    `Tema: ${p.name}${build.modified ? " · Adaptada (o plano abaixo descreve a receita original)" : ""}`,
    p.addonNote,
    ...p.addons.map(
      (a) =>
        `${a.required ? "Obrigatório" : "Opcional"}: ${a.name} — ${a.note}`,
    ),
    "Plano:",
    ...p.plan.map((s, i) => `${i + 1}. ${s}`),
    "Atenção:",
    ...p.cautions,
    `Referência: ${p.sources[0]}`,
  ]
    .join("\n")
    .slice(0, 2000);
}
