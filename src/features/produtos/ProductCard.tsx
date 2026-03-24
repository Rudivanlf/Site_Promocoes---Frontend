import { Heart, ExternalLink, ShoppingCart } from "lucide-react";
import type { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite }: ProductCardProps) {
  return (
    <div className="relative group bg-gray-950 rounded-2xl overflow-hidden border border-white/10 flex flex-col h-full hover:border-[#05C71F]/50 transition-all duration-300">
      <div className="relative h-48 overflow-hidden bg-white/5 flex items-center justify-center p-4">
        <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/80 hover:scale-110 transition-all z-10">
          <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-[#05C71F] text-[#05C71F]" : "text-white"}`} />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-wider">{product.category}</span>
        <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-3 flex-1">{product.name}</h3>
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Melhor preço</p>
          <p className="text-2xl font-black text-[#05C71F]">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <a href={product.link} target="_blank" rel="noopener noreferrer" className="w-full mt-auto h-11 rounded-xl bg-white/5 hover:bg-[#05C71F] border border-white/10 hover:border-[#05C71F] flex items-center justify-center gap-2 font-bold text-white transition-all">
          <ShoppingCart className="w-4 h-4" /> Ir para loja <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
        </a>
      </div>
    </div>
  );
}