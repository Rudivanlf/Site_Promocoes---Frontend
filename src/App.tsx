import { useEffect, useState } from "react";
import { fetchProducts } from "./features/produtos/Produtos";
import { LoginModal } from "./features/login/loginModal";
import { CadastroModal } from "./features/cadastro/CadastroModal";
import { addFavorite, removeFavorite, getFavorites } from "./shared/utils/favoritesApi";

import "./App.css";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

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
  const [searchQuery, setSearchQuery] = useState("");
 const [showLogin, setShowLogin] = useState(false);
const [showRegister, setShowRegister] = useState(false);
const [page, setPage] = useState<"home" | "analytics" | "favorites">("home");
const [search, setSearch] = useState("");
const [favorites, setFavorites] = useState<string[]>([]);
const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
const [userEmail, setUserEmail] = useState(
  localStorage.getItem("loggedUser")
);
const [showLogout, setShowLogout] = useState(false);
const [favoritesLoading, setFavoritesLoading] = useState(false);

useEffect(() => {
  async function loadInitialProducts() {
    try {
      const data = await fetchProducts("celular");

      if (data && data.length > 0) {

        const sorted = data
          .sort((a: Product, b: Product) => b.sales - a.sales)
          .slice(0, 8); // pega os 8 mais vendidos

        setProducts(sorted);
      }

    } catch (err) {
      console.error("Erro ao carregar produtos iniciais", err);
    }
  }

  loadInitialProducts();
}, []);

// Carregar favoritos quando o usuário estiver logado
useEffect(() => {
  async function loadFavorites() {
    if (!userEmail) {
      setFavorites([]);
      setFavoriteProducts([]);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      setFavoritesLoading(true);
      const favs = await getFavorites();
      
      setFavorites(favs.map(f => f.link));
      setFavoriteProducts(favs.map(f => ({
        id: f.id || 0,
        name: f.name,
        price: f.price,
        description: f.description || "",
        sales: f.sales || 0,
        image: f.image,
        link: f.link,
        category: f.category || ""
      })));
    } catch (err) {
      console.error("Erro ao carregar favoritos:", err);
    } finally {
      setFavoritesLoading(false);
    }
  }

  loadFavorites();
}, [userEmail]);

async function toggleFavorite(product: Product) {
  if (!product.link) return;

  // Se o usuário não estiver logado, apenas altera o estado local
  if (!userEmail) {
    if (favorites.includes(product.link)) {
      setFavorites(favorites.filter(link => link !== product.link));
      setFavoriteProducts(favoriteProducts.filter(p => p.link !== product.link));
    } else {
      setFavorites([...favorites, product.link]);
      setFavoriteProducts([...favoriteProducts, product]);
    }
    return;
  }

  // Se o usuário estiver logado, sincroniza com o backend
  const isFavorited = favorites.includes(product.link);

  try {
    if (isFavorited) {
      // Remover do backend
      await removeFavorite(product.link);
      
      // Atualizar estado local
      setFavorites(favorites.filter(link => link !== product.link));
      setFavoriteProducts(favoriteProducts.filter(p => p.link !== product.link));
    } else {
      // Adicionar ao backend
      await addFavorite({
        link: product.link,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        sales: product.sales,
        category: product.category,
        id: product.id
      });
      
      // Atualizar estado local
      setFavorites([...favorites, product.link]);
      setFavoriteProducts([...favoriteProducts, product]);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro ao gerenciar favorito";
    console.error("Erro ao favoritar/desfavoritar:", errorMessage);
    alert(errorMessage);
  }
}

async function handleSearch(query: string) {
  setLoading(true);
  setError(null);

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
}finally {
    setLoading(false);
  }
}
const categories = [
  "Todas",
  ...Array.from(new Set(products.map(p => p.category)))
];

const filteredProducts =
  selectedCategory === "Todas"
    ? products
    : products.filter(p => p.category === selectedCategory);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props?: any | null) => {
    const { active, payload } = props ?? {};
    if (active && payload && payload.length) {
      const first = payload[0] as { payload?: unknown } | undefined;
      const data = first?.payload as { name?: string; price?: number | string; sales?: number } | undefined;
      return (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            color: "#000"
          }}
        >
          <strong>{data?.name}</strong>
          <p>Preço: R$ {typeof data?.price === 'number' ? data.price.toFixed(2) : data?.price}</p>
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
      const payload = first?.payload as { id?: number | string } | undefined;
      if (payload && payload.id) {
        setSelectedId(String(payload.id));
      }
    }
  };

  const [cartCount, setCartCount] = useState(0);
  const [requestId, setRequestId] = useState(0);

const selectedProduct =
  favoriteProducts.find((product) => product.link === selectedId) ||
  products.find((product) => product.link === selectedId);

  const topProducts = [...products]
  .sort((a, b) => b.sales - a.sales)
  .slice(0, 4);

  return (
  <div className="container">
    <div className="navbar">
  <button onClick={() => setPage("home")}>Home</button>
  <button onClick={() => setPage("analytics")}>Analytics</button>
  <button onClick={() => setPage("favorites")}>
    Favoritos ({favorites.length})
  </button>
</div>
    <button
  className="login-top-button"
  onClick={() => {
  if (userEmail) {
    setShowLogout(true);
  } else {
    setShowLogin(true);
  }
}}
>
  {userEmail ? userEmail.charAt(0).toUpperCase() : "Fazer Login"}
</button>

  {showLogin && (
  <LoginModal
    onClose={() => setShowLogin(false)}
    onOpenRegister={() => {
      setShowLogin(false);
      setShowRegister(true);
    }}
    onLoginSuccess={(email) => setUserEmail(email)}
  />
)}


{showRegister && (
  <CadastroModal
    onClose={() => setShowRegister(false)}
    onOpenLogin={() => {
      setShowRegister(false);
      setShowLogin(true);
    }}
  />
)}
{showLogout && (
  <div className="login-overlay" onClick={() => setShowLogout(false)}>
    <div
      className="login-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>Deseja sair?</h2>

      <div className="login-buttons">
        <button
          onClick={() => {
            localStorage.removeItem("loggedUser");
            localStorage.removeItem("authToken");
            setUserEmail(null);
            setShowLogout(false);
          }}
        >
          Sair
        </button>

        <button onClick={() => setShowLogout(false)}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

{page === "home" && (
<>


  <h1>Selecionar Produto</h1>

<form
  className="search-form"
  onSubmit={(e) => {
  e.preventDefault();

  const query = searchInput.trim();
  if (!query) return;

  setSelectedId(null);
  setProducts([]); // limpa produtos antigos

  handleSearch(query);
}}
>
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

  {error && <p className="search-error">{error}</p>}

  <label htmlFor="product-select">Escolher produto:</label>

<select
  id="product-select"
  value={selectedId ?? ""}
  onChange={(e) => setSelectedId(e.target.value)}
>
    <option value="" disabled>
      Escolha um produto
    </option>
    {products.map((product) => (
      <option key={product.link} value={product.link}>
        {product.name}
      </option>
    ))}
  </select>

  <div className="home-products">

  {topProducts.map((product) => (
    <div
      key={product.id}
      className="home-card"
      onClick={() => setSelectedId(product.link ?? null)}
    >
      <img src={product.image} alt={product.name} />

      <h3>{product.name}</h3>

      <p className="price">
        R$ {product.price}
      </p>

      <p className="sales">
        {product.sales} vendas
      </p>

    </div>
  ))}

</div>

</>
)}

    
        <div className="cart">
        ({cartCount}) Lista de Produtos
      </div>
{page === "analytics" && (
  <div className="analytics-layout">

    {selectedProduct && (
      <div className="side-product">
        <button
          className="buy-button"
          onClick={() => setCartCount(cartCount + 1)}
        >
          Salvar
        </button>

        <div
          className="image-container"
          onClick={() => toggleFavorite(selectedProduct)}
        >
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            className="product-image"
          />

          <div className="favorite-star">
            {favorites.includes(selectedProduct?.link ?? "") ? "⭐" : "☆"}
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
      </div>
    )}

    {/* GRÁFICO */}
    <div className="chart">
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={filteredProducts} onClick={handleChartClick}>
  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />

  <XAxis
    dataKey="name"
    stroke="#9ca3af"
    tick={{ fill: "#9ca3af", fontSize: 12 }}
  />

  <YAxis
    stroke="#9ca3af"
    tick={{ fill: "#9ca3af", fontSize: 12 }}
  />

  <Tooltip content={CustomTooltip} />

 <Bar
  dataKey="price"
  radius={[6, 6, 0, 0]}
  onClick={(data: any) => {
    if (data?.payload?.link) {
      setSelectedId(data.payload.link);
    }
  }}
>
  {filteredProducts.map((product) => (
    <Cell
      key={product.link}
      fill={product.link === selectedId ? "#f97316" : "#22c55e"}
    />
  ))}
</Bar>
</BarChart>
      </ResponsiveContainer>
    </div>

    {/* CATEGORIAS */}
    <div className="categories">
      <h3>Categorias</h3>

      {categories.map((category) => (
        <div
          key={category}
          className="category-item"
          onClick={() => setSelectedCategory(category)}
        >
          <div
            className={`category-circle ${
              selectedCategory === category ? "active" : ""
            }`}
          ></div>

          <span>{category}</span>
        </div>
      ))}
    </div>
    
  </div>
)}

{page === "favorites" && (
  <div className="analytics-layout">

    {selectedProduct && (
      <div className="side-product">
        <button
          className="buy-button"
          onClick={() => setCartCount(cartCount + 1)}
        >
          Salvar
        </button>

        <div
          className="image-container"
          onClick={() => toggleFavorite(selectedProduct)}
        >
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            className="product-image"
          />

          <div className="favorite-star">
            {favorites.includes(selectedProduct?.link ?? "") ? "⭐" : "☆"}
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
      </div>
    )}

    <div className="home-products">

      {favorites.length === 0 && (
        <p>Nenhum produto favoritado ainda</p>
      )}

      {favoriteProducts.map((product) => (
        <div
          key={product.id}
          className="home-card"
          onClick={() => setSelectedId(product.link ?? null)}
        >
          <img src={product.image} alt={product.name} />

          <h3>{product.name}</h3>

          <p className="price">
            R$ {product.price}
          </p>

          <p className="sales">
            {product.sales} vendas
          </p>
        </div>
      ))}

    </div>

  </div>
)}

{page === "home" && selectedProduct && (
  <div className="home-selected-product center">
    <button
      className="buy-button"
      onClick={() => setCartCount(cartCount + 1)}
    >
      Salvar
    </button>

    <div
      className="image-container"
      onClick={() => toggleFavorite(selectedProduct)}
    >
      <img
        src={selectedProduct.image}
        alt={selectedProduct.name}
        className="product-image"
      />

      <div className="favorite-star">
        {favorites.includes(selectedProduct?.link ?? "") ? "⭐" : "☆"}
      </div>
    </div>

    <h2>{selectedProduct.name}</h2>

    {selectedProduct.link && (
      <p>
        <a
          href={selectedProduct.link}
          target="_blank"
          rel="noreferrer"
        >
          Ver no Mercado Livre
        </a>
      </p>
    )}

    <p><strong>Preço:</strong> R$ {selectedProduct.price}</p>
    <p>{selectedProduct.description}</p>
    <p><strong>Vendas:</strong> {selectedProduct.sales}</p>

  </div>
)}
   
    </div >

);
}


export default App;