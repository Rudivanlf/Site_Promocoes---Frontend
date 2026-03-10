import { useEffect, useState } from "react";
import { Settings, Home, BarChart2, Star } from "lucide-react";

import { fetchProducts } from "./features/produtos/Produtos";
import { getFavorites, addFavorite, removeFavorite, ApiError } from "./shared/utils/favoritesApi";
import { LoginModal } from "./features/login/LoginModal";
import { CadastroModal } from "./features/cadastro/CadastroModal";

import "./App.css";
import { XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  sales: number;
  image: string;
  link?: string;
  category: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchInput, setSearchInput] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [page, setPage] = useState<"home" | "analytics" | "favorites">("home");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [linkInput, setLinkInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    setUserEmail(storedUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.logo-container')) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showMenu]);

  // Load/clear favorites whenever the logged-in user changes
  useEffect(() => {
    if (userEmail) {
      loadFavorites();
    } else {
      setFavorites([]);
      setFavoriteProducts([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  useEffect(() => {
    async function loadInitialProducts() {
      try {
        const data = await fetchProducts("celular");
        if (data && data.length > 0) {
          const sorted = data.sort((a: Product, b: Product) => b.sales - a.sales).slice(0, 8);
          setProducts(sorted);
        }
      } catch (err) {
        console.error("Erro ao carregar produtos iniciais", err);
      }
    }
    loadInitialProducts();
  }, []);

  async function loadFavorites() {
    try {
      const data = await getFavorites();
      setFavorites(data.map(f => f.link));
      setFavoriteProducts(
        data.map(f => ({
          id: f.id ?? 0,
          name: f.name,
          price: f.price,
          description: f.description ?? "",
          sales: f.sales ?? 0,
          image: f.image ?? "",
          link: f.link,
          category: f.category ?? "",
        }))
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleLogout();
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("authToken");
    setUserEmail(null);
    setShowLogout(false);
    setFavorites([]);
    setFavoriteProducts([]);
  }

  async function toggleFavorite(product: Product) {
    if (!product.link) return;

    if (!userEmail) {
      setShowLogin(true);
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

  async function handleSearch(query: string) {
    if (!query) return;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const data = await fetchProducts(query);
      if (data && data.length > 0) {
        setProducts(data);
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
    try {
      const url = new URL(link);
      let slug = "";
      if (url.pathname.includes("/p/")) {
        slug = url.pathname.split("/p/")[0].split("/").pop() || "";
      } else {
        slug = url.pathname.split("/").pop() || "";
      }
      const query = slug.replace(/MLB\d+/i, "").replace(/-/g, " ").trim();

      if (!query) return;

      const data = await fetchProducts(query);
      if (data && data.length > 0) {
        const productMatch = data.find(p => p.link === link);
        const product = productMatch ? productMatch : { ...data[0], link: link };
        setProducts([product]);
        setSelectedId(product.link ?? null);
      }
    } catch (err) {
      setError("Link inválido ou erro ao buscar");
    } finally {
      setLoading(false);
    }
  }

  const categories = ["Todas", ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === "Todas" ? products : products.filter(p => p.category === selectedCategory);

  const CustomTooltip = (props?: any | null) => {
    const { active, payload } = props ?? {};
    if (active && payload && payload.length) {
      const first = payload[0] as { payload?: unknown } | undefined;
      const data = first?.payload as { name?: string; price?: number | string; sales?: number } | undefined;
      return (
        <div className="chart-tooltip">
          <span className="chart-tooltip-name">{data?.name}</span>
          <span className="chart-tooltip-price">
            R$ {typeof data?.price === "number" ? data.price.toFixed(2) : data?.price}
          </span>
          {data?.sales !== undefined && (
            <span className="chart-tooltip-sales">{data.sales} vendas</span>
          )}
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    const link = data?.link as string | undefined;
    if (link) {
      setSelectedId(prev => prev === link ? null : link);
    }
  };

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = products.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(products.length / productsPerPage);

  // === PRODUTO SELECIONADO PARA O PAINEL LATERAL ===
  const selectedProduct = favoriteProducts.find((p) => p.link === selectedId) || products.find((p) => p.link === selectedId);

  return (
    <div className="container">
      <div className="navbar">
        <div className="logo-container">
          <div className="logo-circle" onClick={() => setShowMenu(!showMenu)}>
            <Settings className="w-6 h-6" style={{ color: "#22c55e" }} />
          </div>
          {showMenu && (
            <div className="dropdown-menu show">
              <button onClick={() => { setPage("home"); setShowMenu(false); }} className="menu-item" data-tooltip="Home"><Home className="w-5 h-5" /></button>
              <button onClick={() => { setPage("analytics"); setShowMenu(false); }} className="menu-item" data-tooltip="Analytics"><BarChart2 className="w-5 h-5" /></button>
              <button onClick={() => { setPage("favorites"); setShowMenu(false); }} className="menu-item" data-tooltip="Favoritos"><Star className="w-5 h-5" /></button>
            </div>
          )}
        </div>
        <button className="login-top-button" onClick={() => userEmail ? setShowLogout(true) : setShowLogin(true)}>
          {userEmail ? userEmail.charAt(0).toUpperCase() : "Fazer Login"}
        </button>
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onOpenRegister={() => { setShowLogin(false); setShowRegister(true); }}
          onLoginSuccess={(email: string) => setUserEmail(email)}
        />
      )}
      {showRegister && (
        <CadastroModal
          onClose={() => setShowRegister(false)}
          onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }}
          onLoginSuccess={(email: string) => { setUserEmail(email); setShowRegister(false); }}
        />
      )}
      {showLogout && (
        <div className="login-overlay" onClick={() => setShowLogout(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Deseja sair?</h2>
            <div className="login-buttons">
              <button onClick={handleLogout}>Sair</button>
              <button onClick={() => setShowLogout(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {page === "home" && (
        <div className={`home-layout ${selectedProduct ? "active" : ""}`}>
          <div className="home-left">
            <h1 className="main-title">
              <span className="h1-part-dark">Pesquise um </span>
              <span className="h1-part-green">produto</span>
              <span className="h1-part-dark"> e veja </span>
              <span className="h1-part-green">ofertas</span>
              <span className="h1-part-dark"> com </span>
              <span className="h1-part-green">Project Promo IA</span>
            </h1>

            <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchInput); }}>
              <input
                className="search-input"
                type="text"
                placeholder="Buscar no Mercado Livre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button className="search-button" type="submit" disabled={loading}>
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </form>

            <div className="link-search-container" style={{ display: "none" }}>
              <input
                className="search-input"
                type="text"
                placeholder="Colar link do Mercado Livre..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
              <button className="search-button" onClick={() => handleSearchByLink(linkInput)}>
                Buscar
              </button>
            </div>

            {error && <p className="search-error">{error}</p>}

            <div className="home-products">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="home-card"
                  onClick={() => setSelectedId(product.link ?? null)}
                >
                  <img src={product.image} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p className="price">R$ {product.price}</p>
                  <p className="sales">{product.sales} vendas</p>
                </div>
              ))}
            </div>

            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? "active-page" : ""}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="side-product">
              <div className="side-product-header">
                <button className="buy-button" onClick={() => toggleFavorite(selectedProduct)}>
                  {favorites.includes(selectedProduct.link ?? "") ? "Desfavoritar" : "Favoritar"}
                </button>
                <button className="close-button" onClick={() => setSelectedId(null)}>✕</button>
              </div>
              <div className="image-container" onClick={() => toggleFavorite(selectedProduct)}>
                <img src={selectedProduct.image} alt={selectedProduct.name} className="product-image" />
                <div className="favorite-star">
                  {favorites.includes(selectedProduct.link ?? "") ? "⭐" : "☆"}
                </div>
              </div>
              <h2>{selectedProduct.name}</h2>
              {selectedProduct.link && (
                <p><a href={selectedProduct.link} target="_blank" rel="noreferrer">Ver no Mercado Livre</a></p>
              )}
              <p><strong>Preço:</strong> R$ {selectedProduct.price}</p>
              <p>{selectedProduct.description}</p>
              <p><strong>Vendas:</strong> {selectedProduct.sales}</p>
            </div>
          )}
        </div>
      )}

      {page === "analytics" && (
        <div className="analytics-layout">
          {selectedProduct && (
            <div className="side-product">
              <div className="side-product-header">
                <button className="buy-button" onClick={() => toggleFavorite(selectedProduct)}>
                  {favorites.includes(selectedProduct.link ?? "") ? "Desfavoritar" : "Favoritar"}
                </button>
                <button className="close-button" onClick={() => setSelectedId(null)}>✕</button>
              </div>
              <div className="image-container" onClick={() => toggleFavorite(selectedProduct)}>
                <img src={selectedProduct.image} alt={selectedProduct.name} className="product-image" />
                <div className="favorite-star">
                  {favorites.includes(selectedProduct.link ?? "") ? "⭐" : "☆"}
                </div>
              </div>
              <h2>{selectedProduct.name}</h2>
              {selectedProduct.link && (
                <p><a href={selectedProduct.link} target="_blank" rel="noreferrer">Ver no Mercado Livre</a></p>
              )}
              <p><strong>Preço:</strong> R$ {selectedProduct.price}</p>
              <p>{selectedProduct.description}</p>
              <p><strong>Vendas:</strong> {selectedProduct.sales}</p>
            </div>
          )}

          <div className="chart-column">
            <div className="chart">
              <div className="chart-header">
                <h3 className="chart-title">Análise de Preços</h3>
                <p className={`chart-hint${selectedId ? " has-selection" : ""}`}>
                  {selectedId
                    ? "✓ Produto selecionado — clique novamente para deselecionar"
                    : "Clique em uma barra para ver o produto"}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={filteredProducts}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <Tooltip content={CustomTooltip} />
                  <Bar
                    dataKey="price"
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                    onClick={handleBarClick}
                    activeBar={{ fill: "#fbbf24", stroke: "#f97316", strokeWidth: 2 }}
                  >
                    {filteredProducts.map((product) => (
                      <Cell
                        key={product.id}
                        fill={product.link === selectedId ? "#f97316" : "#22c55e"}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="categories">
              <h3>Categorias</h3>
              {categories.map((category) => (
                <div key={category} className="category-item" onClick={() => setSelectedCategory(category)}>
                  <div className={`category-circle ${selectedCategory === category ? "active" : ""}`}></div>
                  <span>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {page === "favorites" && (
        <div className="analytics-layout">
          {selectedProduct && (
            <div className="side-product">
              <div className="side-product-header">
                <button className="buy-button" onClick={() => toggleFavorite(selectedProduct)}>
                  {favorites.includes(selectedProduct.link ?? "") ? "Desfavoritar" : "Favoritar"}
                </button>
                <button className="close-button" onClick={() => setSelectedId(null)}>✕</button>
              </div>
              <div className="image-container" onClick={() => toggleFavorite(selectedProduct)}>
                <img src={selectedProduct.image} alt={selectedProduct.name} className="product-image" />
                <div className="favorite-star">
                  {favorites.includes(selectedProduct.link ?? "") ? "⭐" : "☆"}
                </div>
              </div>
              <h2>{selectedProduct.name}</h2>
              {selectedProduct.link && (
                <p><a href={selectedProduct.link} target="_blank" rel="noreferrer">Ver no Mercado Livre</a></p>
              )}
              <p><strong>Preço:</strong> R$ {selectedProduct.price}</p>
              <p>{selectedProduct.description}</p>
              <p><strong>Vendas:</strong> {selectedProduct.sales}</p>
            </div>
          )}

          <div className="home-products">
            {favorites.length === 0 && <p>Nenhum produto favoritado ainda</p>}
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="home-card"
                onClick={() => setSelectedId(product.link ?? null)}
              >
                <img src={product.image} alt={product.name} />
                <h3>{product.name}</h3>
                <p className="price">R$ {product.price}</p>
                <p className="sales">{product.sales} vendas</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;