
import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";
import "./ProductGrid.css";

interface ProductGridProps {
  products: Product[];
  favorites: string[];
  toggleFavorite: (product: Product) => void;
  onSelectProduct: (link: string) => void; // <--- Adicionamos isso
}

export default function ProductGrid({ products, favorites, toggleFavorite, onSelectProduct }: ProductGridProps) {
  return (
    <div className="home-products">
      {products.map((product) => (
        <div
          key={product.id}
          className="transition-all duration-200 hover:-translate-y-1 cursor-pointer"
          onClick={() => onSelectProduct(product.link ?? "")}
        >
          <ProductCard
            product={product}
            isFavorite={favorites.includes(product.link ?? "")}
            onToggleFavorite={() => toggleFavorite(product)}
          />
        </div>
      ))}
    </div>
  );
}