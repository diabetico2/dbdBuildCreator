import data from './catalog-data.json' with {type:'json'};
export const seedCatalog=data;
export const {killers,perks,synergies}=data;
export const defaults=data.config.weights;
export const styles={balanced:'Equilibrado',chase:'Perseguição',control:'Controle de geradores',information:'Informação'};
export const categories={chase:'Perseguição',information:'Informação',control:'Controle',utility:'Utilidade',regression:'Regressão',block:'Bloqueio',mobility:'Mobilidade',stealth:'Furtividade',pressure:'Pressão',endgame:'Fim de jogo'};
export const perkName=p=>p?.name_pt||p?.name||'Vantagem removida';
export const normalize=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR');

