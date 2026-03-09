import { useEffect, useState } from "react";
import { fetchProducts } from "./features/produtos/Produtos";
import { LoginModal } from "./features/login/LoginModal";
import { CadastroModal } from "./features/cadastro/CadastroModal";

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
 const [showLogin, setShowLogin] = useState(false);
const [showRegister, setShowRegister] = useState(false);
const [page, setPage] = useState<"home" | "analytics" | "favorites">("home");
const [favorites, setFavorites] = useState<string[]>([]);
const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
const [userEmail, setUserEmail] = useState<string | null>(null);

useEffect(() => {
  const storedUser = localStorage.getItem("loggedUser");
  setUserEmail(storedUser);
}, []);
const [showLogout, setShowLogout] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const productsPerPage = 12;
const [linkInput, setLinkInput] = useState("");

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

function toggleFavorite(product: Product) {

  if (!product.link) return;

  if (favorites.includes(product.link)) {

    setFavorites(favorites.filter(link => link !== product.link));

    setFavoriteProducts(
      favoriteProducts.filter(p => p.link !== product.link)
    );

  } else {

    setFavorites([...favorites, product.link]);

    setFavoriteProducts([...favoriteProducts, product]);

  }

}

async function handleSearch(query: string) {
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

async function handleSearchByLink(link: string) {
  try {

    const url = new URL(link);

    let slug = "";

    if (url.pathname.includes("/p/")) {
      slug = url.pathname.split("/p/")[0].split("/").pop() || "";
    } else {
      slug = url.pathname.split("/").pop() || "";
    }

    const query = slug
      .replace(/MLB\d+/i, "")
      .replace(/-/g, " ")
      .trim();

    if (!query) {
      console.error("Não foi possível extrair a busca do link");
      return;
    }

    const data = await fetchProducts(query);

    if (data && data.length > 0) {
      const productMatch = data.find(p => p.link === link);

const product = productMatch
  ? productMatch
  : { ...data[0], link: link };

      setProducts([product]);
      setSelectedId(product.link ?? null);
    }

  } catch (err) {
    console.error("Link inválido", err);
  }
}

const selectedProduct =
  favoriteProducts.find((product) => product.link === selectedId) ||
  products.find((product) => product.link === selectedId);

const indexOfLast = currentPage * productsPerPage;
const indexOfFirst = indexOfLast - productsPerPage;
const currentProducts = products.slice(indexOfFirst, indexOfLast);

const totalPages = Math.ceil(products.length / productsPerPage);

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
    onLoginSuccess={(email: string) => setUserEmail(email)}
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
<div className={`home-layout ${selectedProduct ? "active" : ""}`}>

<div className="home-left">

<h1>Selecionar Produto</h1>

<form
  onSubmit={(e) => {
    e.preventDefault();
    handleSearch(searchInput);
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

<div className="link-search-container">

  <input
    className="search-input"
    type="text"
    placeholder="Colar link do Mercado Livre..."
    value={linkInput}
    onChange={(e) => setLinkInput(e.target.value)}
  />

  <button
    className="search-button"
    onClick={() => handleSearchByLink(linkInput)}
  >
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

      <p className="price">
        R$ {product.price}
      </p>

      <p className="sales">
        {product.sales} vendas
      </p>

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

<button
  className="buy-button"
  onClick={() => selectedProduct && toggleFavorite(selectedProduct)}
>
  {favorites.includes(selectedProduct?.link ?? "") ? "Desfavoritar" : "Favoritar"}
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
</div>

)}

{page === "analytics" && (
  <div className="analytics-layout">

    {selectedProduct && (
      <div className="side-product">
        <button
          className="buy-button"
          onClick={() => selectedProduct && toggleFavorite(selectedProduct)}
        >
          {favorites.includes(selectedProduct?.link ?? "") ? "Desfavoritar" : "Favoritar"}
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
  key={product.id}
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
          onClick={() => selectedProduct && toggleFavorite(selectedProduct)}
        >
          {favorites.includes(selectedProduct?.link ?? "") ? "Desfavoritar" : "Favoritar"}
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


   
    </div >

);
}


export default App;