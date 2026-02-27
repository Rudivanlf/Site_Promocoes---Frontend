import { useEffect, useState } from "react";
import { fetchProducts } from "./features/produtos/Produtos";
import "./App.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
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
  category: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

const categories = [
  "Todas",
  ...Array.from(new Set(products.map(p => p.category)))
];

const filteredProducts =
  selectedCategory === "Todas"
    ? products
    : products.filter(p => p.category === selectedCategory);

  const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

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
        <strong>{data.name}</strong>
        <p>Vendas: {data.sales}</p>
      </div>
    );
  }

  return null;
};

const [cartCount, setCartCount] = useState(0);

  if (loading) return <p>Carregando produtos...</p>;
  if (error) return <p>{error}</p>;

  const selectedProduct = products.find(
    (product) => product.id === selectedId
  );

  return (
  <div className="container">
  <h1>Selecionar Produto</h1>

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
              Comprar
            </button>

            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="product-image"
            />

            <h2>{selectedProduct.name}</h2>
            <p><strong>Preço:</strong> R$ {selectedProduct.price}</p>
            <p>{selectedProduct.description}</p>
            <p><strong>Vendas:</strong> {selectedProduct.sales}</p>
          </>
        )}
      </div>

        <div className="cart">
        ({cartCount}) Carrinho
      </div>

           
      {/* Gráfico */}
      <div className="chart">
          <ResponsiveContainer width="100%" height={450}>
            
  <LineChart
    data={filteredProducts}
    onClick={(e: any) => {
      if (e && e.activePayload && e.activePayload.length) {
        const clickedProduct = e.activePayload[0].payload;
        setSelectedId(clickedProduct.id);
      }
    }}
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
    
    <Tooltip />

    
    <Line
  type="monotone"
  dataKey="sales"
  stroke="#22c55e"
  strokeWidth={2}
  dot={(props: any) => {
    const { cx, cy, payload } = props;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#22c55e"
        style={{ cursor: "pointer" }}
        onClick={() => setSelectedId(payload.id)}
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