import type { Product, ProductCategory, ProductLink } from "../../types/product";

import { getTotalPages, sliceByPage } from "./productUtils";

export function selectProductCategories(products: Product[]): ProductCategory[] {
  return ["Todas", ...Array.from(new Set(products.map((product) => product.category)))];
}

export function selectProductsByCategory(products: Product[], selectedCategory: ProductCategory): Product[] {
  if (selectedCategory === "Todas") {
    return products;
  }

  return products.filter((product) => product.category === selectedCategory);
}

export function selectSelectedProduct(
  products: Product[],
  favoriteProducts: Product[],
  selectedId: ProductLink | null
): Product | undefined {
  if (!selectedId) return undefined;

  return favoriteProducts.find((product) => product.link === selectedId)
    || products.find((product) => product.link === selectedId);
}

export function selectProductsPage(
  products: Product[],
  currentPage: number,
  itemsPerPage: number
): Product[] {
  return sliceByPage(products, currentPage, itemsPerPage);
}

export function selectProductsTotalPages(products: Product[], itemsPerPage: number): number {
  return getTotalPages(products.length, itemsPerPage);
}
