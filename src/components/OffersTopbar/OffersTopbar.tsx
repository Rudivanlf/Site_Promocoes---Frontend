import { ArrowLeft, Menu } from "lucide-react";
import { SearchBar } from "../SearchBar/SearchBar";
import "../Navbar/Navbar.module.css";

type OffersTopbarProps = {
  title?: string;
  totalProducts?: number;
  onBack?: () => void;
  onLogin?: () => void;
  searchValue?: string;
  searchLoading?: boolean;
  searchError?: string | null;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: () => void;
};

export default function OffersTopbar({
  title = "Produtos",
  totalProducts = 0,
  onBack,
  onLogin,
  searchValue = "",
  searchLoading = false,
  searchError = null,
  onSearchChange = () => {},
  onSearchSubmit = () => {},
}: OffersTopbarProps) {
  return (
    <header className="products-fixed-header" role="banner">
      <div className="products-fixed-header__inner">
        <div className="products-fixed-header__left">
          <button
            type="button"
            className="products-fixed-header__back"
            onClick={onBack}
            aria-label="Voltar para a Home"
          >
            <ArrowLeft size={18} strokeWidth={2.4} />
          </button>

          <div className="products-fixed-header__info">
            <h1>
              Ofertas para: <span>{title}</span>
            </h1>
            <p>{totalProducts} {totalProducts === 1 ? "produto" : "produtos"}</p>
          </div>
        </div>

        <div className="products-fixed-header__search">
          <SearchBar
            compact={false}
            value={searchValue}
            loading={searchLoading}
            error={searchError}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
          />
        </div>

        <div className="products-fixed-header__login">
          <button
            type="button"
            className="products-fixed-header__login-button"
            onClick={onLogin}
            aria-label="Login"
            title="Login"
          >
            <Menu size={32} strokeWidth={2.5} color="#39ff14" />
          </button>
        </div>
      </div>
    </header>
  );
}
