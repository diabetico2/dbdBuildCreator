// Catálogo editorial inicial. Textos resumidos; os pesos são hipóteses ajustáveis,
// não estatísticas de vitória nem uma declaração sobre o meta atual.
const source = id => `https://deadbydaylight.com/game/characters/the-${id}/`;
const killer = (id, name, tags, description) => ({id,name,tags,description,source_url:source(id)});
export const killers = [
  killer('trapper','O Caçador',['basic','setup','territory'],'Prepara armadilhas para controlar rotas e áreas.'),
  killer('hillbilly','O Caipira',['mobility','special','instadown'],'A motosserra permite cruzar o mapa e derrubar sobreviventes.'),
  killer('nurse','A Enfermeira',['mobility','special','blink'],'Teletransportes atravessam obstáculos durante a perseguição.'),
  killer('clown','O Palhaço',['basic','chase'],'Frascos alteram o ritmo da perseguição.'),
  killer('spirit','O Espírito',['basic','mobility','stealth'],'Usa deslocamento em fase para surpreender e encurtar distâncias.'),
  killer('legion','A Legião',['basic','injury','mobility'],'Espalha ferimentos com o Frenesi e finaliza em perseguições comuns.'),
  killer('plague','A Praga',['infection','special','snowball'],'Infecta sobreviventes e ganha ataques à distância com a purificação.'),
  killer('artist','A Artista',['special','ranged','territory'],'Corvos pressionam rotas e fornecem informação à distância.')
];
// id, nome canônico, categoria, força editorial 0..10, efeito, afinidades.
const rows = {
  trapper: [
    ['unnerving','Unnerving Presence','control',4,'Dificulta testes de perícia de cura e reparo dentro do raio de terror.',{territory:1}],
    ['brutal','Brutal Strength','chase',6.5,'Acelera a quebra de pallets e paredes e o dano a geradores.',{basic:1.8,blink:-3}],
    ['agitation','Agitation','utility',6.5,'Aumenta a velocidade e o raio de terror ao carregar sobreviventes.',{territory:1}]
  ],
  hillbilly: [
    ['enduring','Enduring','chase',7,'Reduz a duração de atordoamentos causados por pallets.',{basic:1.5,blink:-4}],
    ['lightborn','Lightborn','utility',4,'Protege contra cegueira e pode revelar quem tentou cegar você.',{}],
    ['tinkerer','Tinkerer','information',7,'Avisa quando um gerador atinge seu limiar de progresso e concede Indetectável.',{mobility:2}]
  ],
  nurse: [
    ['stridor','Stridor','information',4,'Amplifica sons de respiração e de dor dos sobreviventes.',{stealth:1}],
    ['thanatophobia','Thanatophobia','control',5.5,'Ferimentos, quedas e ganchos prejudicam ações; ferir todos amplia o efeito.',{injury:3,infection:2}],
    ['nurses','A Nurse\'s Calling','information',6.5,'Revela auras de sobreviventes curando ou sendo curados por perto.',{stealth:2,infection:-5}]
  ],
  clown: [
    ['bamboozle','Bamboozle','chase',7,'Acelera saltos e bloqueia temporariamente a janela atravessada.',{basic:2,blink:-5}],
    ['coulrophobia','Coulrophobia','control',5,'Prejudica a cura e torna seus testes mais difíceis no raio de terror.',{injury:1,infection:-4}],
    ['pop','Pop Goes the Weasel','control',8,'Após um gancho, permite regressão adicional ao danificar um gerador.',{mobility:1.5}]
  ],
  spirit: [
    ['spirit-fury','Spirit Fury','chase',6.5,'Depois de quebrar pallets suficientes, a Entidade quebra o próximo que atordoar você.',{basic:2,blink:-4}],
    ['haunted','Hex: Haunted Ground','chase',5,'Totens amaldiçoados funcionam como armadilha: sua limpeza causa Exposto temporário.',{basic:1,special:-1}],
    ['rancor','Rancor','information',5,'Conclusões de geradores revelam localizações; a Obsessão fica vulnerável no final.',{basic:1}]
  ],
  legion: [
    ['discordance','Discordance','information',8,'Sinaliza geradores dentro do alcance reparados por dois ou mais sobreviventes.',{injury:2,mobility:1}],
    ['mad-grit','Mad Grit','utility',4,'Melhora ataques ao carregar alguém e interrompe a luta quando outro sobrevivente é atingido.',{}],
    ['iron-maiden','Iron Maiden','utility',4,'Acelera buscas em armários e pune sobreviventes que saem deles.',{}]
  ],
  plague: [
    ['corrupt','Corrupt Intervention','control',8.5,'Bloqueia geradores distantes no começo; termina por tempo ou após uma primeira queda.',{setup:3,territory:1}],
    ['infectious','Infectious Fright','information',7,'Uma queda faz outros sobreviventes no raio de terror gritarem.',{snowball:3,instadown:1.5}],
    ['dark-devotion','Dark Devotion','utility',5,'Transfere temporariamente seu raio de terror à Obsessão sob a condição de ativação.',{stealth:1}]
  ],
  artist: [
    ['grim','Grim Embrace','control',8,'Ganchos em sobreviventes diferentes ativam bloqueios temporários de geradores.',{}],
    ['pentimento','Hex: Pentimento','control',6,'Reacende totens destruídos; os totens reacendidos aplicam penalidades às ações.',{}],
    ['pain-resonance','Scourge Hook: Pain Resonance','control',8.5,'Ganchos do flagelo causam regressão no gerador mais avançado, com ativações limitadas.',{}]
  ]
};
export const perks = Object.entries(rows).flatMap(([owner_id,items]) => items.map(([id,name,category,strength,effect,affinities])=>({id,name,owner_id,category,strength,effect,affinities,source_url:source(owner_id)})));
export const synergies = [
  {perk_a:'enduring',perk_b:'spirit-fury',value:4,reason:'Enduring reduz o atordoamento enquanto Spirit Fury remove o pallet.'},
  {perk_a:'agitation',perk_b:'pain-resonance',value:2.5,reason:'O transporte mais rápido facilita alcançar ganchos do flagelo.'},
  {perk_a:'agitation',perk_b:'mad-grit',value:2,reason:'Ambas ajudam no transporte quando há tentativas de bloquear o gancho.'},
  {perk_a:'discordance',perk_b:'tinkerer',value:-1.5,reason:'Duas fontes de informação sobre geradores podem disputar espaço na build.'},
  {perk_a:'brutal',perk_b:'spirit-fury',value:1,reason:'Quebrar pallets mais rápido ajuda a preparar Spirit Fury.'},
  {perk_a:'thanatophobia',perk_b:'nurses',value:1,reason:'A pressão por cura pode criar oportunidades para leitura de auras.'},
  {perk_a:'corrupt',perk_b:'infectious',value:-1,reason:'A primeira queda encerra Corrupt, enquanto Infectious favorece pressão por quedas cedo.'},
  {perk_a:'haunted',perk_b:'pentimento',value:2,reason:'Totens destruídos após a armadilha podem abrir espaço para reacender totens.'}
];
export const defaults = {strength:1,compatibility:1,synergy:1,style:1.6,diversity:2,redundancy:1};
export const seedCatalog = {killers,perks,synergies,config:{id:1,version:'mvp-editorial-1',reviewed_at:'2026-10-14',notice:'Catálogo inicial: 8 assassinos e 24 vantagens. Efeitos resumidos; pesos editoriais, sem validação do meta ou de todos os patches atuais.',weights:defaults}};
export const styles = {balanced:'Equilibrada',chase:'Perseguição',information:'Informação',control:'Controle'};
export const categories = {chase:'Perseguição',information:'Informação',control:'Controle',utility:'Utilidade'};
