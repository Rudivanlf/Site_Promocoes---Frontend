import { Search } from "lucide-react";

import "./SearchBar.css";

interface SearchBarProps {
  value: string;
  loading: boolean;
  error: string | null;
  compact?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchBar({ value, loading, error, compact = false, onChange, onSubmit }: SearchBarProps) {
  return (
    <>
      <form
        className={`search-form ${compact ? "search-form-compact" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          className="search-input"
          type="text"
          placeholder="Pesquise um produto ou cole o link do Mercado Livre..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          className="search-button search-icon-button"
          type="submit"
          disabled={loading}
          aria-label="Buscar"
        >
          {loading ? "..." : <Search size={15} strokeWidth={2.4} />}
        </button>
      </form>

      {error && <p className="search-error">{error}</p>}
    </>
  );
}
