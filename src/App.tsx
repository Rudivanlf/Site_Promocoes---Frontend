import { useEffect, useState } from "react";
import { fetchProducts } from "./features/produtos/Produtos";
import "./App.css";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!searchQuery.trim()) return;

    async function loadProducts() {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      try {
        const data = await fetchProducts(searchQuery);
        setProducts(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Erro ao carregar produtos");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [searchQuery]);

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
      if (payload && (typeof payload.id === "number" || typeof payload.id === "string")) {
        setSelectedId(Number(payload.id));
      }
    }
  };

  const [cartCount, setCartCount] = useState(0);

  const selectedProduct = products.find(
    (product) => product.id === selectedId
  );

  return (
  <div className="container">
  <h1>Selecionar Produto</h1>

  <form
    className="search-form"
    onSubmit={(e) => {
      e.preventDefault();
      if (searchInput.trim()) setSearchQuery(searchInput.trim());
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

  <select
    value={selectedId ?? ""}
    onChange={(e) => setSelectedId(Number(e.target.value))}
  >
    <option value="" disabled>
      Escolha um produto
    </option>
    {products.map((product) => (
      <option key={product.id} value={product.id}>
        {product.name}
      </option>
    ))}
  </select>



    <div className={`content ${selectedProduct ? "active" : ""}`}>
      
      {/* Painel esquerdo */}
      <div className="details">
        {selectedProduct && (
          <>
            <button
              className="buy-button"
              onClick={() => setCartCount(cartCount + 1)}
            >
              Salvar
            </button>

            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="product-image"
            />

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
          </>
        )}
      </div>

        <div className="cart">
        ({cartCount}) Lista de Produtos
      </div>

           
      {/* Gráfico */}
      <div className="chart">
          <ResponsiveContainer width="100%" height={450}>
            
  <LineChart
    data={filteredProducts}
    onClick={handleChartClick}
  >
    
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

    
    <Line
      type="monotone"
      dataKey="price"
      stroke="#22c55e"
      strokeWidth={2}
  dot={(dotProps: unknown) => {
    if (typeof dotProps !== "object" || dotProps === null) return null;
    const p = dotProps as { cx?: number; cy?: number; payload?: unknown };
    const cx = p.cx ?? 0;
    const cy = p.cy ?? 0;
    const payload = p.payload as { id?: number | string } | undefined;
    const id = payload && (typeof payload.id === "number" || typeof payload.id === "string") ? Number(payload.id) : undefined;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#22c55e"
        style={{ cursor: id !== undefined ? "pointer" : "default" }}
        onClick={() => id !== undefined && setSelectedId(id)}
      />
    );
  }}
/>
  </LineChart>
</ResponsiveContainer>
      </div>

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
    </div >
  </div>
);
}

export default App;