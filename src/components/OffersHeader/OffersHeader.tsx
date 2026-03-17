import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type OffersHeaderProps = {
  title?: string;
  totalProducts?: number;
};

export default function OffersHeader({
  title = "Produto",
  totalProducts = 0,
}: OffersHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="offers-header">
      <button
        type="button"
        className="offers-header__back"
        onClick={() => navigate("/")}
        aria-label="Voltar para a Home"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="offers-header__content">
        <h1 className="offers-header__title">
          Ofertas para: <span>{title}</span>
        </h1>

        <p className="offers-header__subtitle">
          {totalProducts} {totalProducts === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      </div>
    </header>
  );
}
