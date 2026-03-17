import type { FavoriteProduct } from "../../shared/utils/favoritesApi";
import type { Product, ProductLink } from "../../types/product";

export function extractFavoriteLinks(favorites: FavoriteProduct[]): ProductLink[] {
  return favorites.map((favorite) => favorite.link);
}

export function mapFavoriteProducts(favorites: FavoriteProduct[]): Product[] {
  return favorites.map((favorite) => ({
    id: favorite.id ?? 0,
    name: favorite.name,
    price: favorite.price,
    description: favorite.description ?? "",
    sales: favorite.sales ?? 0,
    image: favorite.image ?? "",
    link: favorite.link,
    category: favorite.category ?? "",
  }));
}
