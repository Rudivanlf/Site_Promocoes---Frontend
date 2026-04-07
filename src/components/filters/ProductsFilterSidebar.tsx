import { useState } from "react";

import "./ProductsFilterSidebar.css";


interface ProductsFilterSidebarProps {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  selectedStore: "all" | "mercado_livre" | "amazon" | "kabum";
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onStoreChange: (store: "all" | "mercado_livre" | "amazon" | "kabum") => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductsFilterSidebar({
  minPrice,
  maxPrice,
  priceRange,
  selectedStore,
  onMinPriceChange,
  onMaxPriceChange,
  onStoreChange,
}: ProductsFilterSidebarProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const [selectedMin, selectedMax] = priceRange;
  const minPercent = maxPrice > minPrice ? ((selectedMin - minPrice) / (maxPrice - minPrice)) * 100 : 0;
  const maxPercent = maxPrice > minPrice ? ((selectedMax - minPrice) / (maxPrice - minPrice)) * 100 : 100;

  return (
    <aside className="productsFilterSidebar">
      <button
        type="button"
        className="filtersToggleButton"
        onClick={() => setMobileExpanded((prev) => !prev)}
      >
        Filtros
      </button>

      <div className={`filtersContent ${mobileExpanded ? "expanded" : ""}`}>
        <h3 className="filterTitle">Filtros</h3>

        <section className="filterSection">
          <h4 className="filterSectionTitle">Faixa de Preço</h4>

          <div className="priceRangeWrapper">
            <div style={{ position: "relative", height: "4px", margin: "12px 0" }}>
              {/* Base track (visual) */}
              <div className="priceRangeTrack slider-track-base" />

              {/* Fill verde entre os thumbs */}
              <div
                className="priceRangeFill slider-track-fill"
                style={{ left: `${minPercent}%`, width: `${Math.max(0, maxPercent - minPercent)}%` }}
              />

              {/* Input min (barra de baixo) */}
              <input
                className="priceRangeInput range-min"
                type="range"
                min={minPrice}
                max={maxPrice}
                value={selectedMin}
                onChange={(event) => onMinPriceChange(Number(event.target.value))}
                style={{ position: "absolute", width: "100%", background: "transparent", pointerEvents: "none" }}
              />

              {/* Input max (barra de cima) */}
              <input
                className="priceRangeInput range-max"
                type="range"
                min={minPrice}
                max={maxPrice}
                value={selectedMax}
                onChange={(event) => onMaxPriceChange(Number(event.target.value))}
                style={{ position: "absolute", width: "100%", background: "transparent", pointerEvents: "none" }}
              />
            </div>

            <div className="priceRangeValues">
              <span>{formatCurrency(selectedMin)}</span>
              <span>{formatCurrency(selectedMax)}</span>
            </div>
          </div>
        </section>

        <section className="filterSection">
          <h4 className="filterSectionTitle">Loja</h4>
          <div className="storeRadioGroup" role="radiogroup" aria-label="Filtro por loja">
            <label className="storeRadioOption">
              <input
                type="radio"
                name="store-filter"
                value="all"
                checked={selectedStore === "all"}
                onChange={() => onStoreChange("all")}
              />
              <span>Todos</span>
            </label>

            <label className="storeRadioOption">
              <input
                type="radio"
                name="store-filter"
                value="mercado_livre"
                checked={selectedStore === "mercado_livre"}
                onChange={() => onStoreChange("mercado_livre")}
              />
              <span>Mercado Livre</span>
            </label>

            <label className="storeRadioOption">
              <input
                type="radio"
                name="store-filter"
                value="amazon"
                checked={selectedStore === "amazon"}
                onChange={() => onStoreChange("amazon")}
              />
              <span>Amazon</span>
            </label>

            <label className="storeRadioOption">
              <input
                type="radio"
                name="store-filter"
                value="kabum"
                checked={selectedStore === "kabum"}
                onChange={() => onStoreChange("kabum")}
              />
              <span>Kabum</span>
            </label>
          </div>
        </section>

        {/* Avaliação mínima removed */}
      </div>
    </aside>
  );
}
