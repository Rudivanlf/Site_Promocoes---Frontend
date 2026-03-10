import { useEffect, useState } from "react";

// Lógica original mantida
import { fetchProducts } from "./features/produtos/Produtos";
import { LoginModal } from "./features/login/LoginModal";
import { CadastroModal } from "./features/cadastro/CadastroModal";

// Design Novo em features
import Header from "./features/navegacao/Header";
import ProductGrid from "./features/produtos/ProductGrid";
import SearchBar from "./features/busca/SearchBar";
import { TextAnimate } from "./features/ui/text-animate";
import { AuroraText } from "./features/ui/aurora-text";
import GreenSmokeCursor from "./features/ui/GreenSmokeCursor";

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

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    setUserEmail(storedUser);
  }, []);

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

  function toggleFavorite(product: Product) {
    if (!product.link) return;
    if (favorites.includes(product.link)) {
      setFavorites(favorites.filter(link => link !== product.link));
      setFavoriteProducts(favoriteProducts.filter(p => p.link !== product.link));
    } else {
      setFavorites([...favorites, product.link]);
      setFavoriteProducts([...favoriteProducts, product]);
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
        <div className="bg-white text-black p-3 rounded-lg shadow-xl border border-gray-300">
          <strong className="block mb-1">{data?.name}</strong>
          <p className="font-bold">R$ {typeof data?.price === 'number' ? data.price.toFixed(2) : data?.price}</p>
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (e: unknown) => {
    if (typeof e !== "object" || e === null) return;
    const ev = e as { activePayload?: unknown[] };
    const payloadArr = ev.activePayload;
    if (Array.isArray(payloadArr) && payloadArr.length) {
      const first = payloadArr[0] as { payload?: unknown } | undefined;
      const payload = first?.payload as { id?: number | string; link?: string } | undefined;
      if (payload && payload.link) {
        setSelectedId(payload.link);
      }
    }
  };

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = products.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(products.length / productsPerPage);

  // === PRODUTO SELECIONADO PARA O PAINEL LATERAL ===
  const selectedProduct = favoriteProducts.find((p) => p.link === selectedId) || products.find((p) => p.link === selectedId);

  return (
    <div className="min-h-screen bg-black text-white relative font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <GreenSmokeCursor />
      </div>

      <div className="relative z-10">
        <Header 
          userEmail={userEmail} 
          currentPage={page} 
          setPage={setPage} 
          favoritesCount={favorites.length}
          onLoginClick={() => userEmail ? setShowLogout(true) : setShowLogin(true)}
        />

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => { setShowLogin(false); setShowRegister(true); }} onLoginSuccess={(email: string) => setUserEmail(email)} />}
        {showRegister && <CadastroModal onClose={() => setShowRegister(false)} onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }} />}
        {showLogout && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLogout(false)}>
            <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Deseja sair?</h2>
              <div className="flex gap-4">
                <button className="flex-1 py-3 rounded-xl font-bold bg-white/10" onClick={() => setShowLogout(false)}>Cancelar</button>
                <button className="flex-1 py-3 rounded-xl font-bold bg-red-500" onClick={() => { localStorage.removeItem("loggedUser"); setUserEmail(null); setShowLogout(false); }}>Sair</button>
              </div>
            </div>
          </div>
        )}

        <main className="pt-24 pb-12 px-4 max-w-[1600px] w-full mx-auto">
          
          {page === "home" && (
            <div className="flex flex-col lg:flex-row gap-8 items-start animate-fadeIn">
              
              {/* LADO ESQUERDO: Busca e Grid */}
              <div className="flex-1 w-full space-y-12">
                <div className="text-center space-y-4 pt-4 pb-2">
                  <h1 className="text-4xl md:text-5xl font-black">
                    <TextAnimate animation="blurIn" as="span">Selecionar</TextAnimate>{" "}
                    <AuroraText speed={1.2} colors={["#05C71F", "#00FF88", "#39FF14", "#05C71F"]}>Produto</AuroraText>
                  </h1>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="w-full max-w-[480px]">
                    <SearchBar value={searchInput} onChange={setSearchInput} onSearch={() => handleSearch(searchInput)} isLoading={loading} placeholder="Buscar no Mercado Livre..." />
                  </div>
                  
                  <div className="w-full max-w-[480px] flex gap-2">
                    <input
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#05C71F] outline-none transition-all"
                      type="text"
                      placeholder="Colar link do Mercado Livre..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                    />
                    <button className="bg-[#05C71F] text-black px-6 rounded-xl font-bold hover:scale-105 transition-all" onClick={() => handleSearchByLink(linkInput)} disabled={loading}>
                      Buscar
                    </button>
                  </div>
                  {error && <p className="text-red-500">{error}</p>}
                </div>

                {products.length > 0 && (
                  <div>
                    <ProductGrid products={currentProducts} favorites={favorites} toggleFavorite={toggleFavorite} onSelectProduct={setSelectedId} />
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? "bg-[#05C71F] text-black" : "bg-white/10"}`}>{i + 1}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LADO DIREITO: Painel de Detalhes (Idêntico ao .side-product original) */}
              {selectedProduct && (
                <div className="w-full lg:w-[350px] shrink-0 sticky top-24 bg-[#111827] rounded-xl p-5 flex flex-col items-center text-center animate-fadeIn border border-white/5">
                  <button 
                    className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 rounded-lg mb-5 transition-transform hover:scale-105"
                    onClick={() => toggleFavorite(selectedProduct)}
                  >
                    {favorites.includes(selectedProduct.link ?? "") ? "Desfavoritar" : "Favoritar"}
                  </button>
                  
                  <div className="relative cursor-pointer group mb-4" onClick={() => toggleFavorite(selectedProduct)}>
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="max-w-[300px] w-full rounded-xl shadow-lg group-hover:brightness-75 transition-all" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                      {favorites.includes(selectedProduct.link ?? "") ? "⭐" : "☆"}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold mb-3">{selectedProduct.name}</h2>
                  {selectedProduct.link && (
                    <a href={selectedProduct.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline mb-3 block">
                      Ver no Mercado Livre
                    </a>
                  )}
                  <p className="mb-2"><strong>Preço:</strong> <span className="text-[#05C71F] font-bold">R$ {selectedProduct.price}</span></p>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-4">{selectedProduct.description}</p>
                  <p className="text-sm text-gray-500"><strong>Vendas:</strong> {selectedProduct.sales}</p>
                </div>
              )}
            </div>
          )}

          {page === "analytics" && (
            <div className="flex flex-col lg:flex-row gap-10 items-start animate-fadeIn">
              
              {selectedProduct && (
                <div className="w-full lg:w-[350px] shrink-0 bg-[#111827] rounded-xl p-5 flex flex-col items-center text-center border border-white/5">
                  <button className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 rounded-lg mb-5 transition-transform hover:scale-105" onClick={() => toggleFavorite(selectedProduct)}>
                    {favorites.includes(selectedProduct.link ?? "") ? "Desfavoritar" : "Favoritar"}
                  </button>
                  <div className="relative cursor-pointer group mb-4" onClick={() => toggleFavorite(selectedProduct)}>
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="max-w-[300px] w-full rounded-xl shadow-lg group-hover:brightness-75 transition-all" />
                  </div>
                  <h2 className="text-xl font-bold mb-3">{selectedProduct.name}</h2>
                  <p className="mb-2"><strong>Preço:</strong> R$ {selectedProduct.price}</p>
                </div>
              )}

              <div className="flex-1 w-full max-w-[900px]">
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredProducts} onClick={handleChartClick}>
                      <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                        {filteredProducts.map((product) => (
                          <Cell key={product.id} fill={product.link === selectedId ? "#f97316" : "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="w-full lg:w-[200px] shrink-0 flex flex-col gap-3">
                <h3 className="text-lg font-bold mb-2">Categorias</h3>
                {categories.map((category) => (
                  <div key={category} className="flex items-center gap-3 cursor-pointer group transition-transform hover:translate-x-1" onClick={() => setSelectedCategory(category)}>
                    <div className={`w-4 h-4 rounded-full border-2 border-[#22c55e] transition-all ${selectedCategory === category ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]" : ""}`}></div>
                    <span className="text-[16px] group-hover:text-white">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "favorites" && (
            <div className="flex flex-col lg:flex-row gap-8 items-start animate-fadeIn">
              <div className="flex-1 w-full">
                <h2 className="text-3xl font-extrabold mb-8">Meus Favoritos</h2>
                {favorites.length === 0 ? (
                  <p className="text-gray-400">Nenhum produto favoritado ainda.</p>
                ) : (
                  <ProductGrid products={favoriteProducts} favorites={favorites} toggleFavorite={toggleFavorite} onSelectProduct={setSelectedId} />
                )}
              </div>

              {selectedProduct && (
                <div className="w-full lg:w-[350px] shrink-0 sticky top-24 bg-[#111827] rounded-xl p-5 flex flex-col items-center text-center border border-white/5">
                  <button className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 rounded-lg mb-5 transition-transform hover:scale-105" onClick={() => toggleFavorite(selectedProduct)}>
                    {favorites.includes(selectedProduct.link ?? "") ? "Desfavoritar" : "Favoritar"}
                  </button>
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="max-w-[300px] w-full rounded-xl shadow-lg mb-4" />
                  <h2 className="text-xl font-bold mb-3">{selectedProduct.name}</h2>
                  <p className="mb-2"><strong>Preço:</strong> R$ {selectedProduct.price}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;