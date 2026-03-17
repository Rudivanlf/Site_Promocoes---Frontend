import type { Product } from "../../types/product";

export interface ProductPricingInfo {
  originalPrice: number;
  currentPrice: number;
  hasDiscount: boolean;
  discountValue: number;
  discountPercent: number;
}

function parseBrlNumber(rawValue: string): number {
  const normalized = rawValue
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function extractOriginalPrice(product: Product): number {
  const originalMatch = product.description.match(/de:\s*r\$\s*([\d.,]+)/i);
  if (!originalMatch) return product.price;

  const parsed = parseBrlNumber(originalMatch[1]);
  return parsed > 0 ? parsed : product.price;
}

export function extractRating(product: Product): number {
  const ratingMatch = product.description.match(/avalia(?:cao|ção):\s*([\d.,]+)/i);
  if (!ratingMatch) return 0;

  const parsed = Number(ratingMatch[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveStore(product: Product): string {
  const text = `${product.name} ${product.link ?? ""} ${product.category}`.toLowerCase();

  if (text.includes("amazon")) return "Amazon";
  if (text.includes("magazineluiza") || text.includes("magazine luiza") || text.includes("magalu")) return "Magazine Luiza";
  if (text.includes("casasbahia") || text.includes("casas bahia")) return "Casas Bahia";
  if (text.includes("americanas")) return "Americanas";
  if (text.includes("fastshop") || text.includes("fast shop")) return "Fast Shop";
  if (text.includes("pontofrio") || text.includes("ponto frio")) return "Ponto Frio";
  if (text.includes("mercadolivre") || text.includes("mercado livre")) return "Mercado Livre";

  return product.category || "Loja";
}

export function getProductPricing(product: Product): ProductPricingInfo {
  const currentPrice = Number(product.price) || 0;
  const originalPrice = extractOriginalPrice(product);

  const hasDiscount = originalPrice > currentPrice && currentPrice > 0;
  const discountValue = hasDiscount ? originalPrice - currentPrice : 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return {
    originalPrice,
    currentPrice,
    hasDiscount,
    discountValue,
    discountPercent,
  };
}

export function getBestDealProductId(products: Product[]): number | null {
  let bestId: number | null = null;
  let bestPercent = -1;
  let bestValue = -1;

  products.forEach((product) => {
    const pricing = getProductPricing(product);
    if (!pricing.hasDiscount) return;

    if (
      pricing.discountPercent > bestPercent ||
      (pricing.discountPercent === bestPercent && pricing.discountValue > bestValue)
    ) {
      bestId = product.id;
      bestPercent = pricing.discountPercent;
      bestValue = pricing.discountValue;
    }
  });

  return bestId;
}

export function getCardBadgeLabel(
  product: Product,
  pricing: ProductPricingInfo,
  bestDealId: number | null,
  lowestPrice: number
): string | null {
  if (bestDealId !== null && product.id === bestDealId) {
    return "Maior Desconto";
  }

  if (pricing.hasDiscount && pricing.discountPercent >= 30) {
    return "Oferta Relampago";
  }

  if (product.price === lowestPrice) {
    return "Melhor Preco";
  }

  return null;
}
