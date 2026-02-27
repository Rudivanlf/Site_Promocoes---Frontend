import { mockProducts } from "../../mocks/products";
import type { Product } from "../../mocks/products";

export async function fetchProducts(): Promise<Product[]> {
  // Simula delay de API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockProducts);
    }, 800);
  });
}