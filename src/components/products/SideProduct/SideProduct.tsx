import styles from "./SideProduct.module.css";
import type { Product } from "../../../types/product";

interface SideProductProps {
  product: Product;
  favorites: string[];
  onToggleFavorite: (product: Product) => void;
  onClose: () => void;
}

export function SideProduct({ product, favorites, onToggleFavorite, onClose }: SideProductProps) {
  const isFavorite = favorites.includes(product.link ?? "");
  return (
    <div className={styles["side-product-overlay"]} onClick={onClose}>
      <div className={`${styles["side-product"]} side-product`} onClick={(e) => e.stopPropagation()}>
        <div className={styles["side-product-header"]}>
          <button className={styles["buy-button"]} onClick={() => onToggleFavorite(product)}>
            {isFavorite ? "Desfavoritar" : "Favoritar"}
          </button>
          <button className={styles["close-button"]} onClick={onClose}>✕</button>
        </div>

        <div className={styles["image-container"]} onClick={() => onToggleFavorite(product)}>
          <img src={product.image} alt={product.name} className={styles["product-image"]} />
          <div className={styles["favorite-star"]}>{isFavorite ? "⭐" : "☆"}</div>
        </div>

        <h2>{product.name}</h2>
        {product.link && (
          <p>
            <a href={product.link} target="_blank" rel="noreferrer">
              Ver pagina do produto
            </a>
          </p>
        )}
        <p>
          <strong>Preço:</strong> R$ {product.price}
        </p>
        <p>{product.description}</p>
      </div>
    </div>
  );
}
