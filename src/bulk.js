import { availablePerks } from './recommender.js';

function validIds(ids, catalog) {
  const allowed = new Set(catalog.map(item => item.id));
  const unique = [...new Set(ids)];
  if (unique.some(id => !allowed.has(id))) throw Error('Seleção inválida. Recarregue o catálogo.');
  return unique;
}

// Existing killers are never upserted with P0: their prestige must survive.
export function newKillers(catalog, collection, ids) {
  const owned = new Set(collection.map(row => row.killer_id));
  return validIds(ids, catalog.killers).filter(id => !owned.has(id))
    .map(killer_id => ({ killer_id, prestige: 0 }));
}

export function perkUnlocks(catalog, collection, overrides, killerId, ids, tier) {
  if (!collection.some(row => row.killer_id === killerId))
    throw Error('Adicione o assassino selecionado à coleção primeiro.');
  if (!Number.isInteger(tier) || tier < 0 || tier > 3) throw Error('Nível inválido.');
  const available = new Map(availablePerks(catalog, collection, overrides, killerId).map(p => [p.id, p.tier]));
  return validIds(ids, catalog.perks).map(perk_id => ({
    killer_id: killerId, perk_id,
    tier: tier === 0 ? 0 : Math.max(tier, available.get(perk_id) || 0),
  }));
}
