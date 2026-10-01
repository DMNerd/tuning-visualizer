// Moves favourite options to the front, keeping list order within both parts.
// `favoriteCount` tells grouped lists where the favourites section ends.
export function liftFavorites(options, isFavorite) {
  if (!Array.isArray(options)) return { options: [], favoriteCount: 0 };
  const favorites = [];
  const rest = [];
  for (const option of options) {
    (isFavorite(option) ? favorites : rest).push(option);
  }
  if (!favorites.length) return { options, favoriteCount: 0 };
  return { options: [...favorites, ...rest], favoriteCount: favorites.length };
}
