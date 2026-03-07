interface FavoriteProduct {
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
  image: string;
  description: string;
  sales: number;
  category: string;
  id: number;
}

const API_BASE_URL = (import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
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

export async function addFavorite(product: FavoritePayload): Promise<FavoriteProduct> {
  const response = await fetch(buildUrl(FAVORITES_ENDPOINT), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    
    const errorMessage = typeof data === "object" && data.error 
      ? data.error 
      : typeof data === "string" 
        ? data 
        : "Erro ao adicionar favorito";
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function removeFavorite(productLink: string): Promise<void> {
  const response = await fetch(buildUrl(FAVORITES_ENDPOINT), {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ link: productLink })
  });

  if (!response.ok && response.status !== 204) {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    
    const errorMessage = typeof data === "object" && data.error 
      ? data.error 
      : typeof data === "string" 
        ? data 
        : "Erro ao remover favorito";
    
    throw new Error(errorMessage);
  }
}

export async function getFavorites(): Promise<FavoriteProduct[]> {
  const response = await fetch(buildUrl(FAVORITES_ENDPOINT), {
    method: "GET",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    
    const errorMessage = typeof data === "object" && data.error 
      ? data.error 
      : typeof data === "string" 
        ? data 
        : "Erro ao carregar favoritos";
    
    throw new Error(errorMessage);
  }

  return response.json();
}
