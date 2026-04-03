import type { Product } from "../../types/product";

const API_BASE_URL = (import.meta.env.VITE_BASE_API_URL as string | undefined)?.trim() || "";

interface ScraperProduto {
  titulo: string;
  preco: string | null;
  preco_original: string | null;
  desconto: string | null;
  imagem: string | null;
  link: string | null;
  nota: string | null;
  quantidade_avaliacoes: string | null;
}

interface ScraperResponse {
  query: string;
  pagina: number;
  total: number;
  produtos: ScraperProduto[];
}

function mapScraperProdutoToProduct(produto: ScraperProduto, index: number, sourceName = "Produto"): Product {
  const price = produto.preco ? parseFloat(produto.preco.replace(/[^0-9.,-]/g, "").replace(/,/, ".")) : 0;

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
    description: descriptionParts.join(" | ") || `${sourceName} produto`,
    sales,
    image: produto.imagem || "",
    link: produto.link || "",
    category: sourceName,
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

  const mlUrl = buildApiUrl(`/api/scraper/mercadolivre/?${params}`);
  const amUrl = buildApiUrl(`/api/scraper/amazon/?${params}`);

  const [mlRes, amRes] = await Promise.allSettled([fetch(mlUrl), fetch(amUrl)]);

  const mlProducts: Product[] = [];
  const amProducts: Product[] = [];

  if (mlRes.status === "fulfilled") {
    try {
      const resp = mlRes.value;
      if (resp.ok) {
        const data = (await resp.json()) as ScraperResponse;
        const mapped = data.produtos.map((p, i) => mapScraperProdutoToProduct(p, i, "Mercado Livre"));
        mlProducts.push(...mapped);
      }
    } catch (e) {
      // ignore individual source errors
    }
  }

  if (amRes.status === "fulfilled") {
    try {
      const resp = amRes.value;
      if (resp.ok) {
        const data = (await resp.json()) as ScraperResponse;
        const mapped = data.produtos.map((p, i) => mapScraperProdutoToProduct(p, i + mlProducts.length, "Amazon"));
        amProducts.push(...mapped);
      }
    } catch (e) {
      // ignore
    }
  }

  const combined = [...mlProducts, ...amProducts];

  if (combined.length === 0) {
    // If both failed (or returned empty), try to surface a helpful error
    throw new Error("Erro ao buscar produtos nas APIs de scraping");
  }

  return combined;
}