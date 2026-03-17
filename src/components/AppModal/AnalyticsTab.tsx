import { useState, useEffect } from "react";
import { BarChart3, TrendingDown, TrendingUp, Minus, ExternalLink } from "lucide-react";
import type { Product } from "../../types/product";
import { formatCurrency } from "../../features/products/productPricing";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

interface AnalyticsTabProps {
  favoriteProducts: Product[];
}

type HistoryEntry = { price: number; recorded_at: string };
type HistoryMap = Record<string, HistoryEntry[]>;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(3,21,13,0.97)",
      border: "1px solid rgba(57,255,20,0.3)",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "13px",
    }}>
      <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "4px", fontSize: "11px" }}>{label}</div>
      <div style={{ color: "#39ff14", fontWeight: 800, fontSize: "15px" }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
};

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function AnalyticsTab({ favoriteProducts }: AnalyticsTabProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    favoriteProducts.length > 0 ? favoriteProducts[0] : null
  );
  const [historyMap, setHistoryMap] = useState<HistoryMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = (import.meta as any).env.VITE_BASE_API_URL ?? "";

  // Busca histórico de todos os favoritos de uma vez
  useEffect(() => {
    if (!favoriteProducts.length) return;

    const links = favoriteProducts.map((p) => p.link ?? "").filter(Boolean);
    if (!links.length) return;

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("authToken");
    const encoded = links.map(encodeURIComponent).join(",");

    fetch(`${API_BASE_URL}/api/scraper/historico/?links=${encoded}`, {
      headers: token ? { Authorization: `Token ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: HistoryMap) => {
        setHistoryMap(data);
      })
      .catch(() => setError("Não foi possível carregar o histórico."))
      .finally(() => setLoading(false));
  }, [favoriteProducts]);


// Função para limpar links de rastreamento do ML
function cleanMlLink(link: string): string {
  // Links de clique/rastreamento do ML — descarta
  if (link.includes("click1.mercadolivre") || link.includes("/mclics/")) {
    return "";
  }
  // Remove parâmetros de tracking do hash (#polycard_client=...)
  // mantendo só a URL limpa até o # ou ?tracking_id
  try {
    const url = new URL(link);
    // Remove query params de tracking
    ["tracking_id", "search_layout", "position", "type", "wid", "sid",
     "polycard_client", "is_advertising", "searchVariation"].forEach(
      (p) => url.searchParams.delete(p)
    );
    // Remove o hash inteiro (contém mais tracking)
    url.hash = "";
    return url.toString();
  } catch {
    return link;
  }
}

useEffect(() => {
  if (!favoriteProducts.length) return;

  const links = favoriteProducts
    .map((p) => cleanMlLink(p.link ?? ""))
    .filter(Boolean);

  if (!links.length) return;

  setLoading(true);
  setError(null);

 const token = localStorage.getItem("authToken") 
           ?? localStorage.getItem("token")
           ?? localStorage.getItem("access");  // cobre variações de nome
  const encoded = links.map(encodeURIComponent).join(",");

  fetch(`${API_BASE_URL}/api/scraper/historico/?links=${encoded}`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  })
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data: HistoryMap) => {
      // Remapeia de volta para o link original do produto
      const remapped: HistoryMap = {};
      favoriteProducts.forEach((p) => {
        const clean = cleanMlLink(p.link ?? "");
        if (clean && data[clean]) {
          remapped[p.link ?? ""] = data[clean];
        }
      });
      setHistoryMap(remapped);
    })
    .catch(() => setError("Não foi possível carregar o histórico."))
    .finally(() => setLoading(false));
}, [favoriteProducts]);

  // Atualiza produto selecionado se favoritos mudarem
  useEffect(() => {
    if (favoriteProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(favoriteProducts[0]);
    }
  }, [favoriteProducts]);

  if (favoriteProducts.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: "rgba(255,255,255,0.3)" }}>
        <BarChart3 size={52} style={{ color: "rgba(57,255,20,0.2)" }} />
        <p style={{ fontSize: "1rem", margin: 0 }}>Nenhum produto favoritado</p>
        <p style={{ fontSize: "0.85rem", margin: 0, color: "rgba(255,255,255,0.2)" }}>
          Favorite produtos para ver o histórico de preços
        </p>
      </div>
    );
  }

  // Dados do produto selecionado
  const selectedLink = selectedProduct?.link ?? "";
  const rawHistory = historyMap[selectedLink] ?? [];

  // Formata para o gráfico
  const history = rawHistory.map((e) => ({
    month: formatDateLabel(e.recorded_at),
    price: e.price,
  }));

  const prices = history.map((h) => h.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const currentPrice = selectedProduct?.price ?? 0;
  const avgPrice = prices.length
    ? prices.reduce((a, b) => a + b, 0) / prices.length
    : 0;
  const trend = prices.length >= 2 ? prices[prices.length - 1] - prices[0] : 0;
  const trendPct = prices.length >= 2
    ? ((trend / prices[0]) * 100).toFixed(1)
    : "0.0";

  const hasHistory = history.length >= 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1.25rem" }}>

      {/* Título */}
      <div>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
          Analytics de Preços
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
          Histórico coletado a cada busca
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>

        {/* Lista de produtos */}
        <div style={{ width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, flexShrink: 0 }}>
            Seus favoritos
          </span>
          {favoriteProducts.map((product) => {
            const isSelected =
              selectedProduct?.link === product.link ||
              selectedProduct?.id === product.id;
            const productLink = product.link ?? "";
            const productHistory = historyMap[productLink] ?? [];
            const hasData = productHistory.length >= 2;

            return (
              <div
                key={product.id ?? product.link}
                onClick={() => setSelectedProduct(product)}
                style={{
                  background: isSelected ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                  border: isSelected
                    ? "1px solid rgba(57,255,20,0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  padding: "0.6rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(57,255,20,0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(255,255,255,0.07)";
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "6px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "11px", color: isSelected ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {product.name.split(" ").slice(0, 4).join(" ")}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#39ff14", fontWeight: 700 }}>
                    {formatCurrency(product.price)}
                  </p>
                </div>
                {/* Indicador de dados disponíveis */}
                {hasData && (
                  <div style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#39ff14",
                    boxShadow: "0 0 4px #39ff14",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Área do gráfico */}
        {selectedProduct && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 0 }}>

            {/* Info do produto */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.75rem" }}>
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                style={{ width: "44px", height: "44px", objectFit: "contain", background: "rgba(255,255,255,0.05)", borderRadius: "8px", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedProduct.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "1rem", fontWeight: 900, color: "#39ff14" }}>
                  {formatCurrency(currentPrice)}
                </p>
              </div>
              
              <a
                href={selectedProduct.link ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.4)", display: "flex" }}
              >
                <ExternalLink size={16} />
              </a>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {[
                { label: "Mínimo", value: hasHistory ? formatCurrency(minPrice) : "—", color: "#39ff14" },
                { label: "Máximo", value: hasHistory ? formatCurrency(maxPrice) : "—", color: "#ff6b35" },
                { label: "Média", value: hasHistory ? formatCurrency(avgPrice) : "—", color: "#38bdf8" },
                {
                  label: "Tendência",
                  value: hasHistory ? `${Number(trendPct) > 0 ? "+" : ""}${trendPct}%` : "—",
                  color: Number(trendPct) > 0 ? "#ff6b35" : "#39ff14",
                  icon: hasHistory
                    ? Number(trendPct) > 0
                      ? <TrendingUp size={12} />
                      : Number(trendPct) < 0
                        ? <TrendingDown size={12} />
                        : <Minus size={12} />
                    : null,
                },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.6rem", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{stat.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "13px", fontWeight: 800, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                    {stat.icon}{stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Gráfico ou estados de loading/vazio */}
            <div style={{ flex: 1, minHeight: "200px" }}>
              {loading ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, border: "3px solid rgba(57,255,20,0.15)", borderTop: "3px solid #39ff14", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Carregando histórico...</p>
                </div>
              ) : error ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#ff6b6b" }}>{error}</p>
                </div>
              ) : !hasHistory ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <BarChart3 size={32} style={{ color: "rgba(57,255,20,0.2)" }} />
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
                    Histórico será gerado nas próximas buscas
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.15)" }}>
                    O ponto indicador (•) aparece quando há dados
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
                      width={48}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={minPrice}
                      stroke="rgba(57,255,20,0.3)"
                      strokeDasharray="4 4"
                      label={{ value: "Mín", fill: "#39ff14", fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={currentPrice}
                      stroke="rgba(255,255,255,0.2)"
                      strokeDasharray="4 4"
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#39ff14"
                      strokeWidth={2.5}
                      fill="url(#priceGradient)"
                      dot={(props: any) => {
                        const { cx, cy } = props;
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="#39ff14"
                            stroke="#03150d"
                            strokeWidth={1.5}
                          />
                        );
                      }}
                      activeDot={{ r: 6, fill: "#39ff14", stroke: "#03150d", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              {hasHistory
                ? `${history.length} registros coletados`
                : "Busque por este produto para iniciar o histórico"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}