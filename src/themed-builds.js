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
  ...[
    {
      id: "knight-guard-switch",
      name: "Cavaleiro dos guardas",
      killerId: "knight",
      style: "control",
      category: "Guardas e pressão",
      tagline:
        "Guardas espalhados pelo mapa e perks de pressão para manter os geradores sob vigilância.",
      perkIds: [
        "dead-mans-switch",
        "dragons-grip",
        "barbecue-chilli",
        "pop",
      ],
      addons: [
        addon("Call to Arms", false, "Add-on citado pela comunidade para esta receita."),
        addon("Torch", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Os add-ons vêm da lista da comunidade e são opcionais. Confira os nomes e efeitos no patch em uso.",
      plan: [
        "Deixe guardas em geradores importantes. Dragon's Grip pune quem interage com um gerador que você danificou.",
        "Após cada gancho, Dead Man's Switch, Pop Goes the Weasel e Barbecue & Chilli trabalham juntos: bloqueio, regressão extra e informação distante.",
        "Mantenha os guardas vigiando enquanto você segue uma perseguição; a pressão vem do mapa inteiro.",
      ],
      cautions: [
        "Três perks dependem de ganchos. Sem abates iniciais, a receita demora para render.",
        "Os valores dos guardas e dos add-ons mudam entre patches. Confirme antes de depender deles.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Dead Man's Switch"),
      ],
    },
    {
      id: "lich-furtive-spells",
      name: "Lich dos feitiços",
      killerId: "lich",
      style: "information",
      category: "Informação e regressão",
      tagline:
        "Muita informação ao pendurar e perseguições trocadas no momento certo.",
      perkIds: ["thrilling-tremors", "pop", "eruption", "furtive-chase"],
      addons: [
        addon("Vorpal Sword", false, "Add-on citado pela comunidade para esta receita."),
        addon("Staff of Withering", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Os add-ons são sugestões opcionais da comunidade. A pontuação do app não modela efeitos de add-ons.",
      plan: [
        "Ao pegar um sobrevivente, Thrilling Tremors bloqueia os geradores sem reparo e destaca os bloqueados, mostrando onde há atividade.",
        "Danifique geradores e use Pop Goes the Weasel após o gancho. Eruption provoca regressão nos geradores marcados quando você derruba alguém.",
        "Enganchar a Obsessão com Furtive Chase concede Indetectável e aceleração para sair rápido e surpreender quem foi resgatá-la.",
      ],
      cautions: [
        "Furtive Chase só ativa ao enganchar a Obsessão, e o resgatador vira a nova Obsessão.",
        "A receita depende de ganchos e de danificar geradores. Sem pressão inicial, ela rende pouco.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Furtive Chase"),
      ],
    },
    {
      id: "singularity-awareness",
      name: "Singularidade atenta",
      killerId: "singularity",
      style: "information",
      category: "Informação e alvo",
      tagline:
        "Revele quem está perto e puna quem se acha invisível com a obsessão.",
      perkIds: [
        "dark-devotion",
        "unforeseen",
        "darkness-revealed",
        "furtive-chase",
      ],
      addons: [
        addon("Hyperawareness Spray", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Add-ons opcionais, citados pela comunidade. Eles não alteram a pontuação de referência.",
      plan: [
        "Danifique um gerador com Unforeseen: o raio de terror vai para ele e você fica Indetectável por um tempo para flanquear.",
        "Dark Devotion faz o mesmo quando a Obsessão se fere. Darkness Revealed mostra quem está perto de armários.",
        "Enganchar a Obsessão com Furtive Chase dá Indetectável e aceleração para o próximo ataque.",
      ],
      cautions: [
        "Três perks dependem da Obsessão ou de danificar geradores; trocar de alvo reinicia as vantagens.",
        "Darkness Revealed só funciona com armários, e tem intervalo entre ativações.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Darkness Revealed"),
      ],
    },
    {
      id: "deathslinger-bounty",
      name: "Mercenário caçador de recompensas",
      killerId: "deathslinger",
      style: "chase",
      category: "Obsessão",
      tagline:
        "Foque em um alvo marcado e pegue quem se meter no caminho.",
      perkIds: [
        "rancor",
        "furtive-chase",
        "friends-til-the-end",
        "make-your-choice",
      ],
      addons: [
        addon("Iridescent Coin", false, "Add-on de recarga citado pela comunidade."),
      ],
      addonNote:
        "A comunidade cita add-ons de recarga como complemento. A posse deles não é registrada pelo app.",
      plan: [
        "Ganchos fora da Obsessão ativam Friends 'til the End: ela é revelada e fica Exposta. Rancor expõe a Obsessão no fim e permite executá-la.",
        "Enganchar a Obsessão transfere o alvo e dá Indetectável e aceleração com Furtive Chase.",
        "Make Your Choice pune resgates feitos longe de você. Use o arpão para fechar perseguições antes de o alvo chegar a um gerador importante.",
      ],
      cautions: [
        "Rancor, Furtive Chase e Friends 'til the End dependem da Obsessão. Ao trocar de alvo, as vantagens mudam.",
        "É uma receita de tema, não de força: um bom time ainda pode ignorar a Obsessão.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        "https://forums.bhvr.com/dead-by-daylight/discussion/345692/meme-builds-please",
      ],
    },
    {
      id: "oni-weapon-reveal",
      name: "Oni da arma suprema",
      killerId: "oni",
      style: "chase",
      category: "Fúria e informação",
      tagline:
        "Ganhe a arma suprema nas perseguições e use a informação para seguir o próximo alvo.",
      perkIds: [
        "unforeseen",
        "ultimate-weapon",
        "pop",
        "darkness-revealed",
      ],
      addons: [
        addon("Splintered Hull", false, "Add-on citado pela comunidade para esta receita."),
        addon("Bloody Glove", false, "Alternativa citada pela comunidade."),
      ],
      addonNote:
        "Os add-ons são opcionais e vêm da lista da comunidade. Confira os efeitos atuais.",
      plan: [
        "Revistar um armário com Ultimate Weapon provoca gritos e Cegueira em sobreviventes próximos; Darkness Revealed mostra quem está perto de outros armários.",
        "Danifique geradores com Unforeseen para flanquear sem raio de terror, e use Pop Goes the Weasel após ganchos para extra regressão.",
        "Use o sangue acumulado em ferimentos para a Fúria e feche as perseguições que a informação indicou.",
      ],
      cautions: [
        "As duas perks de armário têm intervalo entre ativações e dependem de armários próximos.",
        "O Oni depende do sangue obtido ao ferir sobreviventes; sem perseguições o poder demora a aparecer.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Ultimate Weapon"),
      ],
    },
    {
      id: "demogorgon-portal-pressure",
      name: "Demogorgon dos portais",
      killerId: "demogorgon",
      style: "balanced",
      category: "Mobilidade e pressão",
      tagline:
        "Use portais, informação e regressão para estar onde o gerador está.",
      perkIds: [
        "trail-of-torment",
        "dead-mans-switch",
        "barbecue-chilli",
        "furtive-chase",
      ],
      addons: [
        addon("Deer Lung", false, "Add-on citado pela comunidade para esta receita."),
        addon("Mews' Guts", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Add-ons opcionais, sugeridos pela comunidade. A pontuação de referência não os modela.",
      plan: [
        "Danifique um gerador com Trail of Torment para ficar Indetectável enquanto ele regride, usando portais para chegar rápido ao próximo.",
        "Após cada gancho, Dead Man's Switch bloqueia o primeiro gerador interrompido e Barbecue & Chilli revela auras distantes.",
        "Furtive Chase dá Indetectável e aceleração ao enganchar a Obsessão, para sair logo da área.",
      ],
      cautions: [
        "Trail of Torment destaca o gerador danificado para os sobreviventes: use isso a seu favor, mas saiba que eles verão onde você mexeu.",
        "Portais precisam de preparo; em partidas curtas o investimento pode não valer.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Trail of Torment"),
      ],
    },
    {
      id: "ghost-face-security",
      name: "Ghost Face da vigilância",
      killerId: "ghost-face",
      style: "chase",
      category: "Furtividade e velocidade",
      tagline:
        "Aparecer de surpresa, acelerar depois do acerto e deixar o gerador em dúvida.",
      perkIds: [
        "rapid-brutality",
        "forced-hesitation",
        "friends-til-the-end",
        "dead-mans-switch",
      ],
      addons: [
        addon("Security Camera", false, "Add-on citado pela comunidade para esta receita."),
        addon("Drop-leg Knife Sheath", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Add-ons opcionais, citados pela comunidade. A forma de uso depende do patch.",
      plan: [
        "Aproxime-se sem ser visto e use Rapid Brutality: um ataque básico acertado dá aceleração temporária.",
        "Quando alguém cair, Forced Hesitation desacelera outros sobreviventes próximos. Friends 'til the End revela e expõe a Obsessão quando você pendura outro alvo.",
        "Após o gancho, Dead Man's Switch bloqueia o primeiro gerador cujo reparo for interrompido.",
      ],
      cautions: [
        "Rapid Brutality remove a possibilidade de ganhar Sede de Sangue. Não conte com ela para todas as perseguições.",
        "Forced Hesitation tem intervalo entre ativações: não é uma ferramenta para todos os ganchos.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Forced Hesitation"),
      ],
    },
    {
      id: "dracula-hex-ultimate",
      name: "Drácula dos hexes",
      killerId: "dark-lord",
      style: "control",
      category: "Hexes e totens",
      tagline:
        "Plante hexes e use Ultimate Weapon para ficar à frente dos sobreviventes.",
      perkIds: [
        "ultimate-weapon",
        "starstruck",
        "hex-plaything",
        "dragons-grip",
      ],
      addons: [
        addon("Warg Fang", false, "Add-on citado pela comunidade para esta receita."),
        addon("Killer Doll", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Os add-ons são sugestões da comunidade e podem não existir exatamente com esses nomes. Confirme na loja.",
      plan: [
        "O primeiro gancho de cada sobrevivente pode acender o totem de Hex: Plaything, que deixa o alvo Alheio.",
        "Dragon's Grip pune quem interage com um gerador que você danificou. Starstruck expõe sobreviventes no raio de terror enquanto você carrega alguém.",
        "Revistar um armário com Ultimate Weapon provoca gritos e Cegueira em sobreviventes próximos.",
      ],
      cautions: [
        "Hexes podem ser limpos; o totem de Plaything tem proteção inicial, mas perde o efeito se for destruído.",
        "Ultimate Weapon tem intervalo entre ativações e depende de armários.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Hex: Plaything"),
      ],
    },
    {
      id: "dredge-lockers",
      name: "Draga dos armários",
      killerId: "dredge",
      style: "control",
      category: "Pressão com informação",
      tagline:
        "Sem add-ons: deixe as informações e os atrasos trabalharem nas sombras.",
      perkIds: [
        "darkness-revealed",
        "dead-mans-switch",
        "make-your-choice",
        "friends-til-the-end",
      ],
      addons: [],
      addonNote:
        "Nenhum add-on sugerido pela fonte. Escolha os que ajudam suas teleportações.",
      plan: [
        "Teleporte entre armários e revistar um deles com Darkness Revealed revela sobreviventes próximos de outros armários.",
        "Make Your Choice pune resgates feitos longe de você; Dead Man's Switch bloqueia o primeiro gerador interrompido após um gancho.",
        "Friends 'til the End revela e expõe a Obsessão quando você pendura outro alvo, ajudando a manter a rotação de alvos.",
      ],
      cautions: [
        "Darkness Revealed tem intervalo entre ativações e depende de armários.",
        "Make Your Choice só pune resgates feitos longe de você; resgates próximos não ativam o efeito.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Make Your Choice"),
      ],
    },
    {
      id: "springtrap-thrilling-grim",
      name: "Animatrônico dos hexes e ganchos",
      killerId: "animatronic",
      style: "control",
      category: "Ganchos e regressão",
      tagline:
        "Use informações ao pendurar, regressão e Grim Embrace para dominar o fim do jogo.",
      perkIds: ["thrilling-tremors", "grim", "eruption", "pop"],
      addons: [
        addon("Bonnie's Guitar", false, "Add-on citado pela comunidade para esta receita."),
        addon("Iridescent Remnant", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Os add-ons são sugestões opcionais. Os nomes exatos podem variar conforme o patch.",
      plan: [
        "Pegar alguém com Thrilling Tremors bloqueia os geradores sem reparo e destaca os bloqueados, mostrando quem está ativo.",
        "Pop Goes the Weasel adiciona regressão após o gancho. Eruption provoca regressão nos geradores marcados quando você derruba alguém.",
        "Grim Embrace bloqueia geradores quando você se afasta de ganchos em sobreviventes diferentes; o quarto gancho amplia o efeito.",
      ],
      cautions: [
        "Todas as perks dependem de ganchos ou de pegar sobreviventes; sem abates a receita fica lenta.",
        "Os ganchos precisam ser em sobreviventes diferentes para ativar Grim Embrace.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Grim Embrace"),
      ],
    },
    {
      id: "doctor-discipline-leverage",
      name: "Doctor anti-cura",
      killerId: "doctor",
      style: "control",
      category: "Loucura e regressão",
      tagline:
        "Atrapalhe curas e reparos com uma combinação de pressão e vigilância.",
      perkIds: ["leverage", "coulrophobia", "gearhead", "dark-devotion"],
      addons: [
        addon("Iridescent King", false, "Alternativa citada pela comunidade aos add-ons de Disciplina."),
      ],
      addonNote:
        "A comunidade cita os dois add-ons de Disciplina ou Iridescent King. Confira os nomes e efeitos no patch em uso.",
      plan: [
        "Coulrophobia dificulta a cura dentro do raio de terror e acelera o ponteiro dos testes de cura.",
        "Leverage reduz temporariamente a velocidade de cura de quem faz um resgate. Com isso, a cura é lenta para toda a equipe.",
        "Gearhead revela quem acerta testes em geradores após uma perda de vida, e Dark Devotion transfere o raio de terror para a Obsessão ferida.",
      ],
      cautions: [
        "Coulrophobia depende do raio de terror; sobreviventes distantes não são afetados.",
        "É uma combinação de tema. O Doctor perde força contra times que repartem bem as tarefas.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Coulrophobia"),
      ],
    },
    {
      id: "legion-two-can-play",
      name: "Legião do Mixtape",
      killerId: "legion",
      style: "chase",
      category: "Fúria e totens",
      tagline:
        "Ataque contra pallets e totens para sufocar a rota dos sobreviventes.",
      perkIds: [
        "enduring",
        "pentimento",
        "hex-two-can-play",
        "spirit-fury",
      ],
      addons: [
        addon("Iridescent Button", false, "Add-on citado pela comunidade para esta receita."),
        addon("Julie's Mix Tape", false, "Add-on citado pela comunidade para esta receita."),
      ],
      addonNote:
        "Add-ons opcionais, citados pela comunidade. A pontuação de referência não os modela.",
      plan: [
        "Enduring reduz atordoamentos de pallets. Spirit Fury destrói o próximo pallet que atordoar você após quebrar pallets suficientes.",
        "Hex: Two Can Play cega quem voltar a cegar ou atordoar você. Pentimento permite reacender totens limpos para reduzir cura e reparo.",
        "Use a Fúria Mortal para forçar erros e converter os acertos em ganchos.",
      ],
      cautions: [
        "Hex: Two Can Play e Pentimento dependem de totens. Se o totem for limpo cedo, o valor se perde.",
        "Spirit Fury só rende quando os sobreviventes usam pallets; não é eficaz sem eles.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/447095/fun-killer-builds-i-use-and-recommend-for-others",
        wiki("Spirit Fury"),
      ],
    },
    {
      id: "pig-rigged-game",
      name: "Porca: jogo manipulado da Amanda",
      killerId: "pig",
      style: "control",
      category: "Hexes e roleplay",
      tagline:
        "Quatro hexes e uma regra: se todos forem destruídos, o jogo acabou.",
      perkIds: ["haunted", "hex-retribution", "hex-undying", "hex-devour-hope"],
      addons: [
        addon("Rule Set No. 2", false, "Add-on citado pela comunidade como parte do tema."),
        addon("Face Mask", false, "Add-on citado pela comunidade como parte do tema."),
      ],
      addonNote:
        "Receita de roleplay: o desafio é seguir a regra de parar quando todos os hexes e armadilhas forem removidos.",
      plan: [
        "Hex: Devour Hope acumula cargas com resgates distantes (aceleração, Exposto e execução). Retribution deixa Alheio quem limpa ou abençoa um feitiço.",
        "Haunted Grounds forma uma armadilha com dois totens: limpar ou abençoar um deles expõe todos temporariamente. Undying revela auras junto a totens comuns.",
        "Se todos os hexes forem limpos e todas as armadilhas removidas, encerre as hostilidades. Essa regra faz parte do tema.",
      ],
      cautions: [
        "Hexes podem ser limpos rapidamente. A receita é de tema, não de força, e a regra de parada é opcional.",
        "Hex: Undying é consumido no lugar de um feitiço destruído; quando os totens caem, a receita perde o efeito.",
      ],
      sources: [
        "https://forums.bhvr.com/dead-by-daylight/discussion/345692/meme-builds-please",
        wiki("Hex: Devour Hope"),
      ],
    },
  ],
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
