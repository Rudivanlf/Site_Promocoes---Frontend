import { useEffect, useState } from "react";
import { Settings, Home, BarChart2, Star, ArrowLeft, X } from "lucide-react";

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

  // Função para formatar preços
  const formatPrice = (price: number): string => {
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Função para simplificar o nome do produto para o gráfico
  const simplifyProductName = (name: string) => {
    // Remove palavras comuns e mantém apenas informações essenciais
    let simplified = name
      .replace(/Nintendo|Playstation|Xbox|Console|Standard|Edition|Cor|Com|Para|De|Da|Do|Em|E|C/gi, '')
      .replace(/[\(\)\[\]]/g, '')
      .trim();
    
    // Se ficou muito curto, pega as primeiras palavras
    if (simplified.length < 10) {
      const words = name.split(' ');
      simplified = words.slice(0, 3).join(' ');
    }
    
    // Limita a 25 caracteres
    if (simplified.length > 25) {
      simplified = simplified.substring(0, 22) + '...';
    }
    
    return simplified;
  };


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

  useEffect(() => {
    if (userEmail) {
      loadFavorites();
    } else {
      setFavorites([]);
      setFavoriteProducts([]);
    }
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
      setFavorites(prev => prev.filter(l => l !== product.link));
      setFavoriteProducts(prev => prev.filter(p => p.link !== product.link));
      try {
        await removeFavorite(product.link);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleLogout();
        } else {
          setFavorites(prev => [...prev, product.link!]);
          setFavoriteProducts(prev => [...prev, product]);
        }
      }
    } else {
      setFavorites(prev => prev.includes(product.link!) ? prev : [...prev, product.link!]);
      setFavoriteProducts(prev => prev.some(p => p.link === product.link) ? prev : [...prev, product]);
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
      let slug = url.pathname.includes("/p/") ? url.pathname.split("/p/")[0].split("/").pop() || "" : url.pathname.split("/").pop() || "";
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
  let filteredProducts = selectedCategory === "Todas" ? products : products.filter(p => p.category === selectedCategory);
  if (minPrice !== null) filteredProducts = filteredProducts.filter(p => p.price >= minPrice);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortType === "price") return a.price - b.price;
    if (sortType === "az") return a.name.localeCompare(b.name);
    if (sortType === "za") return b.name.localeCompare(a.name);
    return 0;
  });

  const CustomTooltip = (props?: any | null) => {
    const { active, payload } = props ?? {};
    if (active && payload && payload.length) {
      const first = payload[0] as { payload?: unknown } | undefined;
      const data = first?.payload as { name?: string; price?: number | string; sales?: number } | undefined;
      return (
        <div className="chart-tooltip">
          <span className="chart-tooltip-name">{data?.name}</span>
          <span className="chart-tooltip-price">
            R$ {formatPrice(Number(data?.price))}
          </span>
          {data?.sales !== undefined && (
            <span className="chart-tooltip-sales">{data.sales} vendas</span>
          )}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any) => {
    if (data?.link) setSelectedId(prev => prev === data.link ? null : data.link);
  };

  const currentProducts = sortedProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
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
              <button className="menu-item" title="Home" onClick={() => { setPage("home"); setShowMenu(false); setSelectedId(null); }}><Home className="w-5 h-5" /></button>
              <button className="menu-item" title="Analytics" onClick={() => { setPage("analytics"); setShowMenu(false); setSelectedId(null); }}><BarChart2 className="w-5 h-5" /></button>
              <button className="menu-item" title="Favoritos" onClick={() => { setPage("favorites"); setShowMenu(false); setSelectedId(null); }}><Star className="w-5 h-5" /></button>
            </div>
          )}
        </div>

        <div className="navbar-right">
          {selectedId && page !== "home" && (
            <button className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black px-3 py-2 flex items-center gap-2 shadow-[0_0_14px_rgba(5,199,31,0.6)]" onClick={() => { setSelectedId(null); setPage("home"); }}>
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          <button className="theme-button rounded-2xl px-3 py-2 shadow-[0_0_14px_rgba(5,199,31,0.5)]" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "🌞" : "🌙"}
          </button>
          <button className="login-top-button" onClick={() => (userEmail ? setShowLogout(true) : setShowLogin(true))}>
            {userEmail ? userEmail.charAt(0).toUpperCase() : "Fazer Login"}
          </button>
          <button className="favorites-button" onClick={() => setPage("favorites")}><Star size={22} /></button>
        </div>
      </div>

      {/* Modais de Autenticação */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => { setShowLogin(false); setShowRegister(true); }} onLoginSuccess={(email: string) => setUserEmail(email)} />}
      {showRegister && <CadastroModal onClose={() => setShowRegister(false)} onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }} onLoginSuccess={(email: string) => { setUserEmail(email); setShowRegister(false); }} />}
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
        <div className={`home-layout`}>
          <div className="home-left">
            <h1 className="main-title">
              <span className="h1-part-dark">Pesquise um </span><span className="h1-part-green">produto</span>
              <span className="h1-part-dark"> e veja </span><span className="h1-part-green">ofertas</span>
              <span className="h1-part-dark"> com </span><span className="h1-part-green">Project Promo IA</span>
            </h1>

            <form onSubmit={(e) => { e.preventDefault(); searchInput.startsWith("http") ? handleSearchByLink(searchInput) : handleSearch(searchInput); }}>
              <input className="search-input" type="text" placeholder="Buscar produto ou colar link..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              <button className="search-button" type="submit" disabled={loading}>{loading ? "Buscando..." : "Buscar"}</button>
            </form>

            {error && <p className="search-error">{error}</p>}

            {hasSearched && (
              <div className="filters-bar">
                <select
  className={`filter-select ${sortType !== 'price' ? 'active-filter' : ''}`}
  value={sortType}
  onChange={(e) => setSortType(e.target.value)}
  aria-label="Ordenar produtos"
  title="Ordenar produtos"
>
  <option value="price">Ordenar por preço</option>
  <option value="az">Nome A → Z</option>
  <option value="za">Nome Z → A</option>
</select> 



<input
  className={`filter-input ${minPrice !== null ? 'active-filter' : ''}`}
  type="number"
  placeholder="Preço mínimo"
  aria-label="Preço mínimo"
  title="Preço mínimo"
  value={minPrice || ''}
  onChange={(e) =>
    setMinPrice(e.target.value ? Number(e.target.value) : null)
  }
/>

<select
  className={`filter-select ${selectedCategory !== 'Todas' ? 'active-filter' : ''}`}
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
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
                <div key={product.id} className="home-card" onClick={() => setSelectedId(product.link ?? null)}>
                  <div className="card-image-container">
                    <img src={product.image} alt={product.name} className="object-contain" />
                    <div className="favorite-star" onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}>
                      {favorites.includes(product.link ?? "") ? <Star size={28} fill="#facc15" color="#facc15" /> : <Star size={28} color="white" />}
                    </div>
                  </div>
                  <h3 className="line-clamp-2">{product.name}</h3>
                  <p className="price">R$ {formatPrice(product.price)}</p>
                  <p className="sales">{product.sales} vendas</p>
                  <button className="mt-2 opacity-0 hover:opacity-100 transition-all rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black px-3 py-1 text-sm font-semibold">Ver Detalhes</button>
                </div>
              ))}
            </div>

            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? "active-page" : ""}>{i + 1}</button>
              ))}
            </div>
          </div>
        </div>
      )}

     {page === "analytics" && (
  <div className="analytics-layout">
    {/* Coluna do gráfico e categorias */}
    <div className="chart-column">
      <div className="chart">
        <div className="chart-header">
          <h3 className="chart-title">Análise de Preços</h3>
        </div>
        
        {/* Verifica se há produtos para mostrar no gráfico */}
        {sortedProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="name" 
                stroke="#888" 
                tick={{ fill: '#888', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis stroke="#888" tick={{ fill: '#888' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="price" 
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                cursor="pointer"
              >
                {sortedProducts.map((product, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={product.link === selectedId ? '#f97316' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">
            <p>Nenhum produto encontrado. Faça uma busca primeiro!</p>
          </div>
        )}
      </div>

      {/* Categorias */}
      <div className="categories">
        <h3>Categorias</h3>
        {categories.length > 1 ? (
          categories.map((category) => (
            <div 
              key={category} 
              className="category-item" 
              onClick={() => setSelectedCategory(category)}
            >
              <div className={`category-circle ${selectedCategory === category ? "active" : ""}`}></div>
              <span>{category}</span>
            </div>
          ))
        ) : (
          <p className="no-categories">Nenhuma categoria disponível</p>
        )}
      </div>
    </div>

  
    </div>
)}

      {/* === NOVO MODAL DE DETALHES CENTRALIZADO (POP-UP) === */}
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
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="product-modal-content">
        {/* Coluna da Imagem */}
        <div className="modal-image-column">
          <div className="modal-image-container">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="product-modal-image"
            />
            
            <div
              className="favorite-star-modal"
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

            <div className="sale-badge">SALE</div>
          </div>
        </div>

        {/* Coluna das Informações */}
        <div className="modal-info-column">
          <h2 className="product-title">
            {selectedProduct.name}
          </h2>
          
          <div className="product-price-row">
            <span className="product-price">R$ {formatPrice(selectedProduct.price)}</span>
          </div>
          
          <div className="product-specs">
            <div className="spec-item">
              <span className="spec-value">{selectedProduct.name}</span>
            </div>
            </div>
          

          <div className="product-actions">
            {selectedProduct.link && (
              <a
                href={selectedProduct.link}
                target="_blank"
                rel="noreferrer"
                className="buy-button"
              >
                Ver no site
              </a>
            )}
            
            <button
              className="compare-button"
              onClick={() => alert("Funcionalidade de comparar em breve!")}
            >
              COMPARAR AGORA
            </button>
          
          </div>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default App;