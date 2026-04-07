import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { fetchProducts } from "./features/produtos/Produtos";
import { getFavorites, addFavorite, removeFavorite, ApiError } from "./shared/utils/favoritesApi";
import { CadastroModal } from "./features/cadastro/CadastroModal";
import { mapFavoriteProducts, extractFavoriteLinks } from "./features/favorites/favoritesUtils";
import {
  selectProductCategories,
  selectProductsByCategory,
  selectProductsPage,
  selectProductsTotalPages,
  selectSelectedProduct,
} from "./features/products/productSelectors";
import { normalizeSearchValue, isMercadoLivreLink, extractQueryFromMercadoLivreLink } from "./features/search/searchUtils";
import { Navbar } from "./components/Navbar/Navbar";
import { SearchBar } from "./components/SearchBar/SearchBar";
import { Hero } from "./components/home/Hero/Hero";
import { ProductGrid } from "./components/products/ProductGrid/ProductGrid";
import { ProductsFilterSidebar } from "./components/filters/ProductsFilterSidebar";
import { SideProduct } from "./components/products/SideProduct/SideProduct";
import { AnalyticsSection } from "./components/analytics/AnalyticsSection/AnalyticsSection";
import { FavoritesSection } from "./components/favorites/FavoritesSection/FavoritesSection";
import OffersTopbar from "./components/OffersTopbar/OffersTopbar";
import AppModal, { type TabId } from "./components/AppModal/AppModal";
import "./components/OffersTopbar/OffersTopbar.css";
import { AICalendarSection } from "./components/calendar/AICalendarSection";
import type { Product } from "./types/product";
import "./features/login/AuthModals.css";
import "./app.css";

type Theme = "dark" | "light";
type Page = "home" | "results" | "analytics" | "calendar" | "favorites";

const THEME_STORAGE_KEY = "site-theme";
const DEFAULT_RESULTS_QUERY = "celular";
const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  results: "/produtos",
  analytics: "/analytics",
  calendar: "/calendario",
  favorites: "/favoritos",
};

function getPageFromPath(pathname: string): Page {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  if (cleaned === "/produtos") return "results";
  if (cleaned === "/analytics") return "analytics";
  if (cleaned === "/calendario") return "calendar";
  if (cleaned === "/favoritos") return "favorites";
  return "home";
}

export function extractStore(product: Product): string | null {
  const text = `${product.name} ${product.link ?? ""} ${product.category}`.toLowerCase();
  if (text.includes("amazon")) return "Amazon";
  if (text.includes("kabum") || text.includes("ka bu m")) return "Kabum";
  if (text.includes("magazineluiza") || text.includes("magazine luiza") || text.includes("magalu")) return "Magazine Luiza";
  if (text.includes("casasbahia") || text.includes("casas bahia")) return "Casas Bahia";
  if (text.includes("americanas")) return "Americanas";
  if (text.includes("fastshop") || text.includes("fast shop")) return "Fast Shop";
  if (text.includes("pontofrio") || text.includes("ponto frio")) return "Ponto Frio";
  return null;
}

export function extractRating(product: Product): number {
  const ratingMatch = product.description.match(/avalia(?:cao|ção):\s*([\d.,]+)/i);
  if (!ratingMatch) return 0;
  const parsed = Number(ratingMatch[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState<"all" | "mercado_livre" | "amazon" | "kabum">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchInput, setSearchInput] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [page, setPage] = useState<Page>(() => getPageFromPath(window.location.pathname));
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" ? "light" : "dark";
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [appModalTab, setAppModalTab] = useState<TabId>("account");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [isResultsScrolled, setIsResultsScrolled] = useState(false);
  const [hasAttemptedResultsPrefill, setHasAttemptedResultsPrefill] = useState(false);

  const maxAvailablePrice = Math.max(
    10000,
    Math.ceil((products.reduce((max, product) => Math.max(max, product.price || 0), 0) || 0) / 500) * 500
  );

  useEffect(() => {
    setPriceRange((prev) => {
      const nextMin = Math.min(prev[0], maxAvailablePrice);
      const nextMax = Math.max(nextMin, Math.min(prev[1], maxAvailablePrice));
      return [nextMin, nextMax];
    });
  }, [maxAvailablePrice]);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    setUserEmail(storedUser);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => setPage(getPageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (page !== "results") {
      setIsResultsScrolled(false);
      return;
    }
    const handleScroll = () => setIsResultsScrolled(window.scrollY > 90);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page]);

  useEffect(() => {
    if (page !== "results") {
      setHasAttemptedResultsPrefill(false);
      return;
    }
    if (products.length > 0 || loading || hasAttemptedResultsPrefill) return;
    setHasAttemptedResultsPrefill(true);
    void handleSearch(searchInput || DEFAULT_RESULTS_QUERY, { navigateOnSuccess: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, products.length, loading, hasAttemptedResultsPrefill]);

  function navigateTo(nextPage: Page) {
    const nextPath = PAGE_PATHS[nextPage];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPage(nextPage);
  }

  useEffect(() => {
    if (userEmail) {
      loadFavorites();
    } else {
      setFavorites([]);
      setFavoriteProducts([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  async function loadFavorites() {
    try {
      const data = await getFavorites();
      setFavorites(extractFavoriteLinks(data));
      setFavoriteProducts(mapFavoriteProducts(data));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleLogout();
    }
  }

  function handleLogout() {
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("authToken");
    setUserEmail(null);
    setFavorites([]);
    setFavoriteProducts([]);
  }

  async function toggleFavorite(product: Product) {
    if (!product.link) return;
    if (!userEmail) {
      setAppModalTab("account");
      setAppModalOpen(true);
      return;
    }

    const isCurrentlyFavorite = favorites.includes(product.link);

    if (isCurrentlyFavorite) {
      // Optimistic remove
      setFavorites(prev => prev.filter(l => l !== product.link));
      setFavoriteProducts(prev => prev.filter(p => p.link !== product.link));
      try {
        await removeFavorite(product.link);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleLogout();
        } else if (err instanceof ApiError && err.status === 404) {
          // Already removed on backend — state already correct
        } else {
          // Revert on unexpected error
          setFavorites(prev => [...prev, product.link!]);
          setFavoriteProducts(prev => [...prev, product]);
        }
      }
    } else {
      // Optimistic add
      setFavorites(prev => [...prev, product.link!]);
      setFavoriteProducts(prev => [...prev, product]);
      try {
        await addFavorite({
          link: product.link,
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
          sales: product.sales,
          category: product.category,
          id: product.id,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleLogout();
          setFavorites(prev => prev.filter(l => l !== product.link));
          setFavoriteProducts(prev => prev.filter(p => p.link !== product.link));
        } else if (err instanceof ApiError && err.status === 400) {
          // Already a favorite on backend — optimistic state is correct
        } else {
          // Revert on unexpected error
          setFavorites(prev => prev.filter(l => l !== product.link));
          setFavoriteProducts(prev => prev.filter(p => p.link !== product.link));
        }
      }
    }
  }

  async function handleSearch(query: string, options?: { navigateOnSuccess?: boolean }) {
    const cleanedQuery = normalizeSearchValue(query) || DEFAULT_RESULTS_QUERY;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setSelectedId(null);
    setSearchInput(cleanedQuery);
    try {
      const data = await fetchProducts(cleanedQuery);
      if (data && data.length > 0) {
        setProducts(data);
        if (options?.navigateOnSuccess ?? true) navigateTo("results");
      } else {
        setProducts([]);
        setError("Nenhum produto encontrado");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchByLink(link: string) {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    try {
      const query = extractQueryFromMercadoLivreLink(link);
      if (!query) {
        setError("Link inválido ou erro ao buscar");
        return;
      }
      setSearchInput(query);
      const data = await fetchProducts(query);
      if (data && data.length > 0) {
        const productMatch = data.find(p => p.link === link);
        const product = productMatch ? productMatch : { ...data[0], link: link };
        setProducts([product]);
        setSelectedId(product.link ?? null);
        navigateTo("results");
      } else {
        setProducts([]);
        setError("Nenhum produto encontrado");
      }
    } catch (err) {
      setError("Link inválido ou erro ao buscar");
    } finally {
      setLoading(false);
    }
  }

  const handleUnifiedSearch = (value: string) => {
    const cleanedValue = normalizeSearchValue(value);
    if (!cleanedValue) {
      void handleSearch(DEFAULT_RESULTS_QUERY, { navigateOnSuccess: true });
      return;
    }
    if (isMercadoLivreLink(cleanedValue)) {
      handleSearchByLink(cleanedValue);
      return;
    }
    handleSearch(cleanedValue);
  };

  const categories = selectProductCategories(products);
  const filteredProducts = selectProductsByCategory(products, selectedCategory);

  const filteredHomeProducts = products.filter((product) => {
    const numericPrice = Number(product.price) || 0;
    const withinPrice = numericPrice >= priceRange[0] && numericPrice <= priceRange[1];

    if (!withinPrice) return false;
    if (selectedStore === "all") return true;

    const normalizedCategory = (product.category || "").toLowerCase();
    if (selectedStore === "amazon") {
      return normalizedCategory.includes("amazon");
    }

    if (selectedStore === "kabum") {
      return normalizedCategory.includes("kabum") || normalizedCategory.includes("ka bu m");
    }

    return normalizedCategory.includes("mercado livre") || normalizedCategory.includes("mercadolivre");
  });

  const handleBarClick = (data: unknown) => {
    const payload = data as { link?: string } | null;
    const link = payload?.link;
    if (link) setSelectedId(prev => prev === link ? null : link);
  };

  const currentProducts = selectProductsPage(filteredHomeProducts, currentPage, productsPerPage);
  const totalPages = selectProductsTotalPages(filteredHomeProducts, productsPerPage);
  const selectedProduct = selectSelectedProduct(products, favoriteProducts, selectedId);

  return (
    <div className="container">
      <Navbar
        hidden={page === "results"}
        loginOnly={page === "results"}
        hideLoginButton={page === "results"}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        onLoginButtonClick={() => {
          setAppModalTab(userEmail ? "favorites" : "account");
          setAppModalOpen(true);
        }}
        userEmail={userEmail}
      />

      <AppModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        userEmail={userEmail}
        onLoginSuccess={(email: string) => setUserEmail(email)}
        onLogout={() => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("loggedUser");
          setUserEmail(null);
        }}
        initialTab={appModalTab}
        favoriteProducts={favoriteProducts}
        onToggleFavorite={toggleFavorite}
      />

      {showRegister && (
        <CadastroModal
          onClose={() => setShowRegister(false)}
          onOpenLogin={() => { setShowRegister(false); setAppModalTab("account"); setAppModalOpen(true); }}
          onLoginSuccess={(email: string) => { setUserEmail(email); setShowRegister(false); }}
        />
      )}

      {page === "home" && (
        <div className="home-layout">
          <div className="home-left">
            <Hero />
            <SearchBar
              value={searchInput}
              loading={loading}
              error={error}
              onChange={setSearchInput}
              onSubmit={() => handleUnifiedSearch(searchInput)}
            />
          </div>
        </div>
      )}

      {page === "results" && (
        <div className={`products-page ${selectedProduct ? "active" : ""}`}>
          <OffersTopbar
            title={searchInput.trim() || DEFAULT_RESULTS_QUERY}
            totalProducts={filteredHomeProducts.length}
            onBack={() => navigateTo("home")}
            onLogin={() => {
              setAppModalTab(userEmail ? "favorites" : "account");
              setAppModalOpen(true);
            }}
            searchValue={searchInput}
            searchLoading={loading}
            searchError={error}
            onSearchChange={(v) => setSearchInput(v)}
            onSearchSubmit={() => handleUnifiedSearch(searchInput)}
          />

          <main className={`products-page__content home-layout ${selectedProduct ? "active" : ""}`}>
            <div className="home-main">
              {loading && products.length === 0 ? (
                <div className="resultsLoadingState" role="status" aria-live="polite">
                  <p className="resultsLoadingTitle">Carregando ofertas...</p>
                  <p className="resultsLoadingSubtitle">Buscando produtos para: {searchInput || DEFAULT_RESULTS_QUERY}</p>
                </div>
              ) : (
                <>
                  {isResultsScrolled && (
                    <div className="resultsCompactBar">
                      <button
                        type="button"
                        className="resultsBackButton"
                        onClick={() => navigateTo("home")}
                        aria-label="Voltar para Home"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <div className="resultsCompactInfo">
                        <p className="resultsCompactTitle">
                          Ofertas para: <span>{searchInput.trim() || DEFAULT_RESULTS_QUERY}</span>
                        </p>
                        <p className="resultsCompactCount">{filteredHomeProducts.length} produtos encontrados</p>
                      </div>
                    </div>
                  )}

                  <div className="productsPageLayout">
                    <ProductsFilterSidebar
                      minPrice={0}
                      maxPrice={maxAvailablePrice}
                      priceRange={priceRange}
                      selectedStore={selectedStore}
                      onMinPriceChange={(value) => {
                        setPriceRange((prev) => [Math.min(value, prev[1]), prev[1]]);
                        setCurrentPage(1);
                      }}
                      onMaxPriceChange={(value) => {
                        setPriceRange((prev) => [prev[0], Math.max(value, prev[0])]);
                        setCurrentPage(1);
                      }}
                      onStoreChange={(store) => {
                        setSelectedStore(store);
                        setCurrentPage(1);
                      }}
                    />
                    <div className="productsContentArea">
                      <ProductGrid
                        products={currentProducts}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onSelectProduct={setSelectedId}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedProduct && (
              <SideProduct
                product={selectedProduct}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onClose={() => setSelectedId(null)}
              />
            )}
          </main>
        </div>
      )}

      {page === "analytics" && (
        <AnalyticsSection
          products={filteredProducts}
          categories={categories}
          selectedProduct={selectedProduct}
          selectedId={selectedId}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onBarClick={handleBarClick}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          onCloseSideProduct={() => setSelectedId(null)}
        />
      )}

      {page === "calendar" && <AICalendarSection />}

      {page === "favorites" && (
        <FavoritesSection
          favoriteProducts={favoriteProducts}
          favorites={favorites}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedId}
          onToggleFavorite={toggleFavorite}
          onCloseSideProduct={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default App;
