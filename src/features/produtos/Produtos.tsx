import type { Product } from "../../types/product";

const API_BASE_URL = (import.meta.env.VITE_BASE_API_URL as string | undefined)?.trim() || "";

interface MLProduto {
  titulo: string;
  preco: string | null;
  preco_original: string | null;
  desconto: string | null;
  imagem: string | null;
  link: string | null;
  nota: string | null;
  quantidade_avaliacoes: string | null;
}

interface MLResponse {
  query: string;
  pagina: number;
  total: number;
  produtos: MLProduto[];
}

function mapMLProdutoToProduct(produto: MLProduto, index: number): Product {
  const price = produto.preco ? parseFloat(produto.preco) : 0;

  const sales = produto.quantidade_avaliacoes
    ? parseInt(produto.quantidade_avaliacoes.replace(/\D/g, ""), 10) || 0
    : 0;

  const descriptionParts: string[] = [];
  if (produto.preco_original) descriptionParts.push(`De: R$ ${produto.preco_original}`);
  if (produto.desconto) descriptionParts.push(`Desconto: ${produto.desconto}`);
  if (produto.nota) descriptionParts.push(`Avaliação: ${produto.nota}`);

  return {
    id: index + 1,
    name: produto.titulo,
    price,
    description: descriptionParts.join(" | ") || "Produto do Mercado Livre",
    sales,
    image: produto.imagem || "",
    link: produto.link || "",
    category: "Mercado Livre",
  };
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

export async function fetchProducts(
  query: string,
  pagina: number = 1
): Promise<Product[]> {
  const params = new URLSearchParams({ q: query, pagina: String(pagina) });

  const response = await fetch(buildApiUrl(`/api/scraper/mercadolivre/?${params}`));
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.erro || `Erro ${response.status}`);
  }

  const data: MLResponse = await response.json();
  return data.produtos.map(mapMLProdutoToProduct);
}