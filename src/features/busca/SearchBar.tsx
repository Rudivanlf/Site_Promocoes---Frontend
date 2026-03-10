import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  isResultsView?: boolean;
}

export default function SearchBar({ value, onChange, onSearch, isLoading, isResultsView = false }: SearchBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  return (
    <div className={`w-full transition-all duration-500 ${isResultsView ? 'max-w-3xl' : 'max-w-4xl'}`}>
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="O que você está procurando? (Ex: TV 65 polegadas)"
          className="w-full px-6 py-4 pr-32 bg-gray-900 border-2 border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all duration-300 text-lg"
        />
        <button
          onClick={onSearch}
          aria-label={isLoading ? "Buscando" : "Buscar"}
          title={isLoading ? "Buscando..." : "Buscar"}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl text-white flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          style={{
            backgroundColor: "#39FF14",
            boxShadow: "0 10px 30px #05C71F",
          }}
          onMouseEnter={(e) => {
            if (e.currentTarget.disabled) return;
            e.currentTarget.style.boxShadow = "0 12px 40px #39FF14";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 30px #39FF14";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}