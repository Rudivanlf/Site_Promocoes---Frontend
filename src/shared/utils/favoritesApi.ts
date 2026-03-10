export interface FavoriteProduct {
  id?: number;
  link: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  sales?: number;
  category?: string;
  data_favoritado?: string;
}

interface FavoritePayload {
  link: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  sales?: number;
  category?: string;
  id?: number | string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE_URL = (import.meta.env.VITE_BASE_API_URL);
const FAVORITES_ENDPOINT = "/api/favoritos/";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseError(response: Response, fallback: string): Promise<ApiError> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();
  const message =
    typeof data === "object" && data !== null && "error" in data
      ? String((data as { error: unknown }).error)
      : typeof data === "string" && data.trim()
      ? data
      : fallback;
  return new ApiError(response.status, message);
}

export async function addFavorite(product: FavoritePayload): Promise<FavoriteProduct> {
  const response = await fetch(buildUrl(FAVORITES_ENDPOINT), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    throw await parseError(response, "Erro ao adicionar favorito");
  }

  return response.json();
}

export async function removeFavorite(productLink: string): Promise<void> {
  const response = await fetch(buildUrl(FAVORITES_ENDPOINT), {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ link: productLink })
  });

  if (!response.ok) {
    throw await parseError(response, "Erro ao remover favorito");
  }
}

export async function getFavorites(): Promise<FavoriteProduct[]> {
  const response = await fetch(buildUrl(FAVORITES_ENDPOINT), {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw await parseError(response, "Erro ao carregar favoritos");
  }

  return response.json();
}
