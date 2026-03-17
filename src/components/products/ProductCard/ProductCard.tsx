import { Heart, ExternalLink } from "lucide-react";
import styles from "./ProductCard.module.css";
import type { Product } from "../../../types/product";
import { formatCurrency, type ProductPricingInfo, resolveStore } from "../../../features/products/productPricing";

interface ProductCardProps {
  product: Product;
  pricing: ProductPricingInfo;
  onSelect: (productLink: string | null) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
}

export function ProductCard({ product, pricing, onSelect, isFavorite = false, onToggleFavorite }: ProductCardProps) {
  const store = resolveStore(product);

  return (
    <article className={styles.productCard} onClick={() => onSelect(product.link ?? null)}>
      <div className={styles.productImageArea}>
        <img src={product.image} alt={product.name} className={styles.productImage} />
      </div>

      <div className={styles.productBody}>
        <p className={styles.storeLabel}>{store}</p>
        <h3 className={styles.productTitle}>{product.name}</h3>
        <p className={styles.currentPrice}>{formatCurrency(pricing.currentPrice)}</p>

        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.offerButton}
            onClick={(e) => {
              e.stopPropagation();
              if (product.link) window.open(product.link, "_blank", "noopener,noreferrer");
              else onSelect(product.link ?? null);
            }}
          >
            <ExternalLink size={17} />
            <span>Ver Oferta</span>
          </button>

          <button
            type="button"
            className={`${styles.alertButton} ${isFavorite ? styles.alertButtonActive : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(product);
            }}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
