export type ProductLink = string;
export type ProductCategory = string;

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  sales: number;
  image: string;
  link?: ProductLink;
  category: ProductCategory;
}
