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

function buildEndpointVariants(basePath: string, params: URLSearchParams): string[] {
  const normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const withoutSlash = normalized.replace(/\/+$/, "");
  const withSlash = `${withoutSlash}/`;
  return [buildApiUrl(`${withSlash}?${params}`), buildApiUrl(`${withoutSlash}?${params}`)];
}

async function fetchSourceProducts(
  endpointBasePath: string,
  sourceName: string,
  initialIndex: number,
  params: URLSearchParams
): Promise<Product[]> {
  const endpointVariants = buildEndpointVariants(endpointBasePath, params);

  for (let i = 0; i < endpointVariants.length; i += 1) {
    try {
      const response = await fetch(endpointVariants[i]);
      if (!response.ok) {
        // If strict routing differs between environments, try the alternate slash variant.
        if (response.status === 404 && i < endpointVariants.length - 1) {
          continue;
        }
        return [];
      }

      const data = (await response.json()) as ScraperResponse;
      return data.produtos.map((product, idx) => mapScraperProdutoToProduct(product, initialIndex + idx, sourceName));
    } catch {
      if (i === endpointVariants.length - 1) {
        return [];
      }
    }
  }

  return [];
}

export async function fetchProducts(
  query: string,
  pagina: number = 1
): Promise<Product[]> {
  const params = new URLSearchParams({ q: query, pagina: String(pagina), detalhes: "false" });

  const mlPromise = fetchSourceProducts("/api/scraper/mercadolivre", "Mercado Livre", 0, params);
  const amPromise = fetchSourceProducts("/api/scraper/amazon", "Amazon", 100000, params);
  const kbPromise = fetchSourceProducts("/api/scraper/kabum", "Kabum", 200000, params);

  const [mlProducts, amProducts, kbProducts] = await Promise.all([mlPromise, amPromise, kbPromise]);

  const combined = [...mlProducts, ...amProducts, ...kbProducts];

  if (combined.length === 0) {
    // If both failed (or returned empty), try to surface a helpful error
    throw new Error("Erro ao buscar produtos nas APIs de scraping");
  }

  return combined;
}