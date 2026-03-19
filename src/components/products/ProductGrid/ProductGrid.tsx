import { ProductCard } from "../ProductCard/ProductCard";
import type { Product } from "../../../types/product";
import { getProductPricing } from "../../../features/products/productPricing";

import "./ProductGrid.css";

interface ProductGridProps {
  products: Product[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectProduct: (productLink: string | null) => void;
  favorites?: string[];
  onToggleFavorite?: (product: Product) => void;
}

export function ProductGrid({
  products,
  totalPages,
  currentPage,
  onPageChange,
  onSelectProduct,
  favorites = [],
  onToggleFavorite,
}: ProductGridProps) {
  

  return (
    <>
      <div className="home-products">
        {products.map((product) => {
          const pricing = getProductPricing(product);

          return (
            <ProductCard
              key={product.id}
              product={product}
              pricing={pricing}
              onSelect={onSelectProduct}
              isFavorite={favorites.includes(product.link ?? "")}
              onToggleFavorite={onToggleFavorite}
            />
          );
        })}
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={currentPage === i + 1 ? "active-page" : ""}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </>
  );
}
