// Options de tri du catalogue, partagées entre la page et le panneau de filtres
export const SORT_OPTIONS = [
  { value: 'default', label: 'Par défaut' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
];

// Le tri « par date » n'a pas le même sens selon le catalogue
export function sortOptionsFor(type) {
  return [...SORT_OPTIONS, { value: 'date', label: type === 'TRIP' ? 'Prochain départ' : 'Nouveautés' }];
}
