import { ProductGrid } from "../../products/ProductGrid/ProductGrid";
import { SideProduct } from "../../products/SideProduct/SideProduct";
import type { Product } from "../../../types/product";

import "./FavoritesSection.css";

interface FavoritesSectionProps {
  favoriteProducts: Product[];
  favorites: string[];
  selectedProduct: Product | undefined;
  onSelectProduct: (productLink: string | null) => void;
  onToggleFavorite: (product: Product) => void;
  onCloseSideProduct: () => void;
}

export function FavoritesSection({
  favoriteProducts,
  favorites,
  selectedProduct,
  onSelectProduct,
  onToggleFavorite,
  onCloseSideProduct,
}: FavoritesSectionProps) {
  return (
    <div className="analytics-layout favorites-section">
      {selectedProduct && (
        <SideProduct
          product={selectedProduct}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onClose={onCloseSideProduct}
        />
      )}

      <div className="favorites-content">
        {favorites.length === 0 ? (
          <p className="favorites-empty">Nenhum produto favoritado ainda</p>
        ) : (
          <ProductGrid
            products={favoriteProducts}
            totalPages={0}
            currentPage={1}
            onPageChange={() => {}}
            onSelectProduct={onSelectProduct}
          />
        )}
      </div>
    </div>
  );
}
