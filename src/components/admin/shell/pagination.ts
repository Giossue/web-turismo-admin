/**
 * Página a mostrar después de que un elemento sale de la página actual (por
 * ejemplo, al revisarlo): si era el último de una página posterior a la
 * primera, retrocede una página para no quedar en una página vacía.
 */
export function pageAfterRemoval(page: number, itemsOnPage: number): number {
  return page > 0 && itemsOnPage <= 1 ? page - 1 : page;
}
