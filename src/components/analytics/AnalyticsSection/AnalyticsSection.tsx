import { XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

import { SideProduct } from "../../products/SideProduct/SideProduct";
import type { Product } from "../../../types/product";
import "./AnalyticsSection.css";

interface AnalyticsSectionProps {
  products: Product[];
  categories: string[];
  selectedProduct: Product | undefined;
  selectedId: string | null;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onBarClick: (data: unknown) => void;
  onToggleFavorite: (product: Product) => void;
  favorites: string[];
  onCloseSideProduct: () => void;
}

function ChartTooltipContent(props?: unknown) {
  const parsed = props as
    | {
        active?: boolean;
        payload?: Array<{ payload?: { name?: string; price?: number | string; sales?: number } }>;
      }
    | undefined;

  const active = parsed?.active;
  const payload = parsed?.payload;

  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-name">{data?.name}</span>
        <span className="chart-tooltip-price">
          R$ {typeof data?.price === "number" ? data.price.toFixed(2) : data?.price}
        </span>
        {data?.sales !== undefined && <span className="chart-tooltip-sales">{data.sales} vendas</span>}
      </div>
    );
  }

  return null;
}

export function AnalyticsSection({
  products,
  categories,
  selectedProduct,
  selectedId,
  selectedCategory,
  onSelectCategory,
  onBarClick,
  onToggleFavorite,
  favorites,
  onCloseSideProduct,
}: AnalyticsSectionProps) {
  return (
    <div className="analytics-layout">
      {selectedProduct && (
        <SideProduct
          product={selectedProduct}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onClose={onCloseSideProduct}
        />
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
            <BarChart data={products}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="price"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={onBarClick}
                activeBar={{ fill: "#86efac", stroke: "#22c55e", strokeWidth: 2 }}
              >
                {products.map((product) => (
                  <Cell
                    key={product.id}
                    fill={product.link === selectedId ? "#4ade80" : "#22c55e"}
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
            <div key={category} className="category-item" onClick={() => onSelectCategory(category)}>
              <div className={`category-circle ${selectedCategory === category ? "active" : ""}`}></div>
              <span>{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
