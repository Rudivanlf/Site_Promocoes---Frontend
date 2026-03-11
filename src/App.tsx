import { useEffect, useState } from "react";
import { Settings, Home, BarChart2, Star, StarOff } from "lucide-react";

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
  const [sortType, setSortType] = useState("price");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
const [theme, setTheme] = useState<"dark" | "light">("dark");


  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    setUserEmail(storedUser);
  }, []);

  useEffect(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    setTheme("light");
  }
}, []);

useEffect(() => {
  document.body.classList.remove("light-theme");

  if (theme === "light") {
    document.body.classList.add("light-theme");
  }

  localStorage.setItem("theme", theme);
}, [theme]);

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
      // Optimistic add sem duplicar
setFavorites(prev =>
  prev.includes(product.link!) ? prev : [...prev, product.link!]
);

setFavoriteProducts(prev =>
  prev.some(p => p.link === product.link) ? prev : [...prev, product]
);

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
          console.error("Erro ao favoritar:", err);
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
    setHasSearched(true);
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
    setHasSearched(true);
  }

  const categories = ["Todas", ...Array.from(new Set(products.map(p => p.category)))];
let filteredProducts = selectedCategory === "Todas"
  ? products
  : products.filter(p => p.category === selectedCategory);

if (minPrice !== null) {
  filteredProducts = filteredProducts.filter(p => p.price >= minPrice);
}

let sortedProducts = [...filteredProducts];

if (sortType === "price") {
  sortedProducts.sort((a, b) => a.price - b.price);
}

if (sortType === "az") {
  sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
}

if (sortType === "za") {
  sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
}

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
menu-item          {data?.sales !== undefined && (
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
  const currentProducts = sortedProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

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
                        <button
            className="menu-item"
            data-tooltip="Home"
            aria-label="Página inicial"
            title="Home"
              ><Home className="w-5 h-5" /></button>
                        <button
            className="menu-item"
            data-tooltip="Analytics"
            aria-label="Analytics"
            title="Analytics"
          ><BarChart2 className="w-5 h-5" /></button>
                        <button
            className="menu-item"
            data-tooltip="Favoritos"
            aria-label="Favoritos"
            title="Favoritos"
          ><Star className="w-5 h-5" /></button>
            </div>
          )}
        </div>
        <div className="navbar-right">
          
          <button
  className="theme-button"
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  aria-label="Alternar tema"
  title="Alternar tema"
>
  {theme === "dark" ? "🌞" : "🌙"}
</button>

  <button
    className="login-top-button"
    onClick={() => userEmail ? setShowLogout(true) : setShowLogin(true)}
  >
    {userEmail ? userEmail.charAt(0).toUpperCase() : "Fazer Login"}
  </button>

<button
  className="favorites-button"
  onClick={() => setPage("favorites")}
  aria-label="Abrir favoritos"
  title="Favoritos"
>
    <Star size={22} />
  </button>

</div>
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

            <form onSubmit={(e) => {
              e.preventDefault();
              const isLink = searchInput.startsWith("http://") || searchInput.startsWith("https://");
              if (isLink) {
                handleSearchByLink(searchInput);
              } else {
                handleSearch(searchInput);
              }
            }}>
              
              <input
                className="search-input"
                type="text"
                placeholder="Buscar produto ou colar link do Mercado Livre..."
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

            {hasSearched && (
  <div className="filters-bar">

        <select
      className="filter-select"
      value={sortType}
      aria-label="Ordenar produtos"
      title="Ordenar produtos"
    >
      <option value="price">Ordenar por preço</option>
      <option value="az">Nome A → Z</option>
      <option value="za">Nome Z → A</option>
    </select>

    <input
      className="filter-input"
      type="number"
      placeholder="Preço mínimo"
      aria-label="Preço mínimo"
      title="Preço mínimo"
      onChange={(e) =>
        setMinPrice(e.target.value ? Number(e.target.value) : null)
      }
    />

          <select
        className="filter-select"
        value={selectedCategory}
        aria-label="Filtrar categoria"
        title="Filtrar categoria"
      >
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>

  </div>
)}

            <div className="home-products">
              {currentProducts.map((product) => (
                <div
  key={product.id}
  className="home-card"
  onClick={() => setSelectedId(product.link ?? null)}
>
  <div className="card-image-container">

    <img src={product.image} alt={product.name} />

    <div
      className="favorite-star"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(product);
      }}
    >
      {favorites.includes(product.link ?? "") ? (
        <Star size={28} fill="#facc15" color="#facc15" />
      ) : (
        <Star size={28} color="white" />
      )}
    </div>

  </div>

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

        </div>
      )}

      {page === "analytics" && (
        <div className="analytics-layout">

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
                <BarChart data={sortedProducts}>
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
                    {sortedProducts.map((product) => (
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
  

          <div className="home-products">
            {favorites.length === 0 && <p>Nenhum produto favoritado ainda</p>}
            {favoriteProducts.map((product) => (
              <div
  key={product.id}
  className="home-card"
  onClick={() => setSelectedId(product.link ?? null)}
>
<div className="card-image-container">

  <img src={product.image} alt={product.name} />

  <div
    className="favorite-star"
    onClick={(e) => {
      e.stopPropagation();
      toggleFavorite(product);
    }}
  >
    {favorites.includes(product.link ?? "") ? (
      <Star size={28} fill="#facc15" color="#facc15" />
    ) : (
      <Star size={28} color="white" />
    )}
  </div>

</div>
                <h3>{product.name}</h3>
                <p className="price">R$ {product.price}</p>
                <p className="sales">{product.sales} vendas</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedProduct && (
  <div
    className="product-modal-overlay"
    onClick={() => setSelectedId(null)}
  >
    <div
      className="product-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="product-modal-close"
        onClick={() => setSelectedId(null)}
      >
        ✕
      </button>

      <div
  className="card-image-container modal-image"
  onClick={() => toggleFavorite(selectedProduct)}
>
  <img
    src={selectedProduct.image}
    alt={selectedProduct.name}
    className="product-modal-image"
  />

  <div
    className="favorite-star"
    onClick={(e) => {
      e.stopPropagation();
      toggleFavorite(selectedProduct);
    }}
  >
    {favorites.includes(selectedProduct.link ?? "") ? (
      <Star size={28} fill="#facc15" color="#facc15" />
    ) : (
      <Star size={28} color="white" />
    )}
  </div>
</div>

      <h2>{selectedProduct.name}</h2>

      {selectedProduct.link && (
        <p>
          <a href={selectedProduct.link} target="_blank" rel="noreferrer">
            Ver no Mercado Livre
          </a>
        </p>
      )}

      <p><strong>Preço:</strong> R$ {selectedProduct.price}</p>
      <p>{selectedProduct.description}</p>
      <p><strong>Vendas:</strong> {selectedProduct.sales}</p>

      <button
        className="buy-button"
        onClick={() => toggleFavorite(selectedProduct)}
      >
        {favorites.includes(selectedProduct.link ?? "")
          ? "Desfavoritar"
          : "Favoritar"}
      </button>
    </div>
  </div>
)}
    </div>
  );
}

export default App;