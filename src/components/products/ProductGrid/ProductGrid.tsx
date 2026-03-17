import { ProductCard } from "../ProductCard/ProductCard";
import type { Product } from "../../../types/product";
import { getBestDealProductId, getCardBadgeLabel, getProductPricing } from "../../../features/products/productPricing";

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
  const bestDealProductId = getBestDealProductId(products);
  const lowestPrice = products.reduce((min, product) => Math.min(min, product.price || 0), Number.POSITIVE_INFINITY);

  return (
    <>
      <div className="home-products">
        {products.map((product) => {
          const pricing = getProductPricing(product);
          const badgeLabel = getCardBadgeLabel(product, pricing, bestDealProductId, lowestPrice);

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
