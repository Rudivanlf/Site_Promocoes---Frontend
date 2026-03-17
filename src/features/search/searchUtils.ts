export function normalizeSearchValue(value: string): string {
  return value.trim();
}

export function isMercadoLivreLink(value: string): boolean {
  const normalizedValue = normalizeSearchValue(value).toLowerCase();

  return (
    normalizedValue.includes("mercadolivre.com")
    || normalizedValue.includes("mercadolibre.com")
    || normalizedValue.includes("ml.com")
    || normalizedValue.startsWith("http://")
    || normalizedValue.startsWith("https://")
  );
}

export function extractQueryFromMercadoLivreLink(link: string): string | null {
  const normalizedLink = normalizeSearchValue(link);

  if (!normalizedLink) return null;

  try {
    const url = new URL(normalizedLink);
    let slug = "";

    if (url.pathname.includes("/p/")) {
      slug = url.pathname.split("/p/")[0].split("/").pop() || "";
    } else {
      slug = url.pathname.split("/").pop() || "";
    }

    const query = slug.replace(/MLB\d+/i, "").replace(/-/g, " ").trim();
    return query || null;
  } catch {
    return null;
  }
}
