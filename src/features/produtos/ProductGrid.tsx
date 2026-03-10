import ProductCard from "./ProductCard";

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  sales: number;
  image: string;
  link?: string;
  category: string;
}

interface ProductGridProps {
  products: Product[];
  favorites: string[];
  toggleFavorite: (product: Product) => void;
  onSelectProduct: (link: string) => void; // <--- Adicionamos isso
}

export default function ProductGrid({ products, favorites, toggleFavorite, onSelectProduct }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="transition-all duration-200 hover:-translate-y-1 cursor-pointer"
          onClick={() => onSelectProduct(product.link ?? "")} // <--- E o clique aqui!
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