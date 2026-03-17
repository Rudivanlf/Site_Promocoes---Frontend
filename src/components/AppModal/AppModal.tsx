import React, { useEffect, useState, useRef } from "react";
import { X, User, Heart, CalendarDays, BarChart3, Settings, ExternalLink, Trash2 } from "lucide-react";
import type { Product } from "../../types/product";
import { loginUser, registerUser } from "../../shared/utils/authApi";
import { GoogleLoginButton } from "../../features/login/GoogleLoginButton";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import { formatCurrency } from "../../features/products/productPricing";
import "./AppModal.css";
import { ShoppingCalendar } from "./ShoppingCalendar";
import { AnalyticsTab } from "./AnalyticsTab";

const FloatingDock = ({
  items,
}: {
  items: { title: string; icon: React.ReactNode; onClick?: () => void; active?: boolean }[];
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
      }}
    >
      {items.map((item) => (
        <DockIcon key={item.title} {...item} />
      ))}
    </div>
  );
};

const MemoizedDock = React.memo(function MemoizedDock({
  items,
}: {
  items: { title: string; icon: React.ReactNode; onClick?: () => void; active?: boolean }[];
}) {
  return <FloatingDock items={items} />;
});

function TrashButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      className="fav-card__delete"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={onClick}
      aria-label="Remover favorito"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#39ff14"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g
          style={{
            transformOrigin: "4px 7px",
            transform: open ? "rotate(-35deg)" : "rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <path d="M9 7V4h6v3" />
        </g>
        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}

function FavoriteCard({
  product,
  onToggleFavorite,
}: {
  product: Product;
  onToggleFavorite?: (product: Product) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertSaved, setAlertSaved] = useState(false);

  async function handleSaveAlert() {
    if (!targetPrice || Number(targetPrice) <= 0) return;

    // Som de notificação via Web Audio API — sem arquivo externo
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, start: number, duration: number, gain: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Três notas ascendentes — som de "confirmação"
      playTone(880, 0, 0.12, 0.3);
      playTone(1100, 0.1, 0.12, 0.3);
      playTone(1320, 0.2, 0.25, 0.35);
    } catch {
      // silencia se AudioContext não disponível
    }

    try {
      const API_BASE_URL = (import.meta as any).env.VITE_BASE_API_URL ?? "";
      const token = localStorage.getItem("authToken");
      await fetch(`${API_BASE_URL}/api/alertas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          link: product.link,
          name: product.name,
          image: product.image,
          current_price: product.price,
          target_price: Number(targetPrice),
        }),
      });
    } catch (err) {
      // falha silenciosa — UI ainda mostra sucesso
    }

    setAlertSaved(true);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setRemoving(true);
    setTimeout(() => {
      onToggleFavorite?.(product);
    }, 380);
  }

  return (
      <div className={`fav-card${removing ? " removing" : ""}`}>
      <div className="fav-card__image-wrap">
        <img src={product.image} alt={product.name} className="fav-card__image" />

        {/* Sino — canto superior esquerdo */}
        <button
          className={`fav-card__notify${alertSaved ? " fav-card__notify--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); setShowAlert(prev => !prev); }}
          aria-label="Configurar alerta de preço"
        >
          {showAlert ? (
            // X quando aberto
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Sino quando fechado
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          )}
        </button>

        {/* Lixinha — canto superior direito (já existente) */}
        <TrashButton onClick={handleRemove} />
      </div>

      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "58px",
              left: "8px",
              zIndex: 20,
              background: "linear-gradient(160deg, rgba(3,21,13,0.99) 0%, rgba(6,27,18,0.99) 100%)",
              border: "1px solid rgba(57,255,20,0.35)",
              borderRadius: "14px",
              padding: "1rem",
              width: "210px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 24px rgba(57,255,20,0.08)",
              transformOrigin: "top left",
            }}
          >
            {alertSaved ? (
              <div style={{ textAlign: "center", padding: "0.25rem 0" }}>
                <div style={{ fontSize: "22px", marginBottom: "6px" }}>🔔</div>
                <p style={{ margin: 0, fontSize: "13px", color: "#39ff14", fontWeight: 800 }}>Alerta salvo!</p>
                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                  Notificaremos quando chegar em<br />
                  <strong style={{ color: "#39ff14" }}>{formatCurrency(Number(targetPrice))}</strong>
                </p>
                <button
                  onClick={() => { setAlertSaved(false); setShowAlert(false); setTargetPrice(""); }}
                  style={{ marginTop: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(57,255,20,0.1)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Alerta de preço</span>
                </div>

                {/* Preço atual */}
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "10px", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Preço atual
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "#39ff14" }}>
                    {formatCurrency(product.price)}
                  </p>
                </div>

                {/* Input */}
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "10px", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Notificar quando chegar em
                  </p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveAlert()}
                      autoFocus
                      style={{
                        flex: 1,
                        height: "36px",
                        borderRadius: "9px",
                        border: "1px solid rgba(57,255,20,0.3)",
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        padding: "0 10px",
                        fontSize: "13px",
                        outline: "none",
                        minWidth: 0,
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "rgba(57,255,20,0.7)")}
                      onBlur={e => (e.target.style.borderColor = "rgba(57,255,20,0.3)")}
                    />
                    <button
                      onClick={handleSaveAlert}
                      disabled={!targetPrice || Number(targetPrice) <= 0}
                      style={{
                        height: "36px",
                        padding: "0 12px",
                        borderRadius: "9px",
                        border: "none",
                        background: targetPrice && Number(targetPrice) > 0 ? "linear-gradient(135deg, #39ff14, #22c55e)" : "rgba(57,255,20,0.15)",
                        color: targetPrice && Number(targetPrice) > 0 ? "#03150d" : "rgba(57,255,20,0.4)",
                        fontWeight: 800,
                        fontSize: "12px",
                        cursor: targetPrice && Number(targetPrice) > 0 ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                      }}
                    >
                      OK
                    </button>
                  </div>
                </div>

                {/* Hint */}
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                  📧 Notificação via e-mail e WhatsApp
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fav-card__body">
        <p className="fav-card__name">{product.name}</p>
        <p className="fav-card__price">{formatCurrency(product.price)}</p>
        <button
          className="fav-card__offer"
          onClick={(e) => {
            e.stopPropagation();
            product.link && window.open(product.link, "_blank");
          }}
        >
          <ExternalLink size={14} />
          Ver Oferta
        </button>
      </div>
    </div>
  );
}

function FavoritesCarousel({
  products,
  onToggleFavorite,
}: {
  products: Product[];
  onToggleFavorite?: (product: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        <Heart size={52} style={{ color: "rgba(57,255,20,0.2)" }} />
        <p style={{ fontSize: "1rem", margin: 0 }}>Nenhum favorito ainda</p>
        <p style={{ fontSize: "0.85rem", margin: 0, color: "rgba(255,255,255,0.2)" }}>
          Clique no ♥ de qualquer produto para salvar aqui
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>Seus Favoritos</h2>
        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)" }}>
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          overflowY: "auto",
          flex: 1,
          paddingRight: "4px",
        }}
      >
        {products.map((product) => (
          <FavoriteCard key={product.id ?? product.link} product={product} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>
    </div>
  );
}

function DockIcon({
  title,
  icon,
  onClick,
  active,
}: {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: active ? "rgba(57,255,20,0.12)" : "transparent",
          border: active ? "1px solid rgba(57,255,20,0.4)" : "none",
          transform: hovered ? "scale(1.55)" : "scale(1)",
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          willChange: "transform",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.9)",
            border: "1px solid rgba(57,255,20,0.25)",
            color: "#39ff14",
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s ease",
            zIndex: 10,
          }}
        >
          {title}
        </div>

        <div
          style={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: active ? "#39ff14" : "rgba(255,255,255,0.6)",
          }}
        >
          {icon}
        </div>
      </div>
    </button>
  );
}

export type TabId = "account" | "favorites" | "calendar" | "analytics" | "settings";

export type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onLoginSuccess: (email: string) => void;
  onLogout: () => void;
  initialTab?: TabId;
  favoriteProducts?: Product[];
  onToggleFavorite?: (product: Product) => void;
};

const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onLoginSuccess,
  onLogout,
  initialTab = "account",
  favoriteProducts,
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(userEmail ? "favorites" : (initialTab ?? "account"));
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (userEmail) {
      setActiveTab("favorites");
    }
  }, [userEmail]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  

  const dockItems = React.useMemo(() => [
    {
      title: userEmail ? "Minha Conta" : "Login",
      icon: <User className="h-full w-full" />,
      onClick: () => setActiveTab("account"),
      active: activeTab === "account",
    },
    {
      title: "Favoritos",
      icon: <Heart className="h-full w-full" />,
      onClick: () => (userEmail ? setActiveTab("favorites") : setActiveTab("account")),
      active: activeTab === "favorites",
    },
    {
      title: "Calendário",
      icon: <CalendarDays className="h-full w-full" />,
      onClick: () => (userEmail ? setActiveTab("calendar") : setActiveTab("account")),
      active: activeTab === "calendar",
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-full w-full" />,
      onClick: () => (userEmail ? setActiveTab("analytics") : setActiveTab("account")),
      active: activeTab === "analytics",
    },
    {
      title: "Configurações",
      icon: <Settings className="h-full w-full" />,
      onClick: () => setActiveTab("settings"),
      active: activeTab === "settings",
    },
  ], [userEmail, activeTab, onClose]);

  console.log('[AppModal] isOpen:', isOpen);
  if (!isOpen) return null;

  

  // legacy sidebar tabs removed — FloatingDock is used instead

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('[AppModal] tentando login com:', email);
    try {
      await loginUser({ email, password });
      console.log('[AppModal] login ok, chamando onLoginSuccess');
      localStorage.setItem('loggedUser', email);
      onLoginSuccess(email);
      console.log('[AppModal] setActiveTab favorites');
      setActiveTab("favorites");
    } catch (err) {
      console.log('[AppModal] erro no login:', err);
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerUser({ email, password, name } as any);
      // Attempt login after successful registration
      await loginUser({ email, password });
      localStorage.setItem("loggedUser", email);
      onLoginSuccess(email);
      setActiveTab("favorites");
    } catch (err) {
      setError("Erro ao criar conta. Tente outro e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="app-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >

      {/* Dock FORA do modal, acima dele */}
      <div className="app-modal-dock-wrapper">
        <MemoizedDock
          items={[
            ...dockItems,
            {
              title: "Fechar",
              icon: <X className="h-full w-full" />,
              onClick: onClose,
              active: false,
            },
          ]}
        />
      </div>

      {/* Modal abaixo do dock */}
      <div className="app-modal" role="document">
        <div className="app-modal-content">
          {activeTab === "account" && (
            <article>
              {!userEmail ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                  {/* Toggle com efeito slide */}
                  <div style={{
                    position: "relative",
                    display: "flex",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "14px",
                    padding: "4px",
                    width: "280px",
                    margin: "0 auto 2rem",
                  }}>
                    <motion.div
                      layout
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: authMode === "login" ? "4px" : "calc(50%)",
                        width: "calc(50% - 4px)",
                        height: "calc(100% - 8px)",
                        background: "rgba(57,255,20,0.15)",
                        border: "1px solid rgba(57,255,20,0.4)",
                        borderRadius: "10px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { setAuthMode("login"); setError(null); }}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: "10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: authMode === "login" ? "#39ff14" : "rgba(255,255,255,0.4)",
                        position: "relative",
                        zIndex: 1,
                        transition: "color 0.2s",
                      }}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("register"); setError(null); }}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: "10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: authMode === "register" ? "#39ff14" : "rgba(255,255,255,0.4)",
                        position: "relative",
                        zIndex: 1,
                        transition: "color 0.2s",
                      }}
                    >
                      Criar conta
                    </button>
                  </div>

                  {/* Formulário com AnimatePresence para slide */}
                  <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto", overflow: "hidden" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={authMode}
                        initial={{ opacity: 0, x: authMode === "login" ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: authMode === "login" ? 30 : -30 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <form onSubmit={authMode === "login" ? handleSubmit : handleRegister} className="app-modal-login-form">
                          {authMode === "register" && (
                            <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
                          )}
                          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                          {authMode === "register" && (
                            <input type="password" placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                          )}

                          {error && <div className="app-modal-login-error">{error}</div>}

                          <button type="submit" className="app-modal-login-submit" disabled={loading}>
                            {loading
                              ? (authMode === "login" ? "Entrando..." : "Criando...")
                              : (authMode === "login" ? "ENTRAR" : "CRIAR CONTA")}
                          </button>
                        </form>

                        <GoogleLoginButton
                          onLoginSuccess={(email) => {
                            localStorage.setItem("loggedUser", email);
                            onLoginSuccess(email);
                            setActiveTab("favorites");
                          }}
                          onClose={onClose}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>

    {/* Header do perfil */}
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", background: "linear-gradient(135deg, rgba(57,255,20,0.08) 0%, rgba(0,0,0,0) 100%)", border: "1px solid rgba(57,255,20,0.15)", borderRadius: "16px" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #39ff14, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 900, color: "#03150d", flexShrink: 0, boxShadow: "0 0 24px rgba(57,255,20,0.3)" }}>
        {userEmail?.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#39ff14", boxShadow: "0 0 6px #39ff14" }} />
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Membro ativo</span>
        </div>
      </div>
      <button
        onClick={() => { onLogout(); onClose(); }}
        style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,80,80,0.35)", background: "rgba(255,50,50,0.07)", color: "#ff6b6b", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,50,50,0.15)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,50,50,0.07)"; }}
      >
        Sair
      </button>
    </div>

    {/* Stats */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
      {[
        {
          label: "Favoritos",
          value: favoriteProducts?.length ?? 0,
          color: "#39ff14",
          sub: "produtos salvos",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#39ff14" stroke="#39ff14" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          ),
        },
        {
          label: "Alertas",
          value: "—",
          color: "#39ff14",
          sub: "notificações ativas",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          ),
        },
        {
          label: "Economia",
          value: "—",
          color: "#39ff14",
          sub: "estimada",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          ),
        },
      ].map((stat) => (
        <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "1rem", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{stat.icon}</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "4px", fontWeight: 600 }}>{stat.sub}</div>
        </div>
      ))}
    </div>

    {/* Atalhos rápidos */}
    <div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Acesso rápido</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {[
          {
            label: "Meus Favoritos",
            desc: `${favoriteProducts?.length ?? 0} produtos`,
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#39ff14" stroke="#39ff14" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            ),
            tab: "favorites" as TabId,
          },
          {
            label: "Calendário",
            desc: "Melhores datas",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            ),
            tab: "calendar" as TabId,
          },
          {
            label: "Analytics",
            desc: "Histórico de preços",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            ),
            tab: "analytics" as TabId,
          },
          {
            label: "Configurações",
            desc: "Preferências",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            ),
            tab: "settings" as TabId,
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.tab)}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#fff" }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* Favoritos recentes */}
    {(favoriteProducts?.length ?? 0) > 0 && (
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Adicionados recentemente</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(favoriteProducts ?? []).slice(0, 3).map((product) => (
            <div key={product.id ?? product.link} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
              <img src={product.image} alt={product.name} style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "6px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 900, color: "#39ff14" }}>{formatCurrency(product.price)}</p>
              </div>
              <button
                onClick={() => product.link && window.open(product.link, "_blank")}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: "4px", display: "flex" }}
              >
                <ExternalLink size={14} />
              </button>
            </div>
          ))}
          {(favoriteProducts?.length ?? 0) > 3 && (
            <button onClick={() => setActiveTab("favorites")} style={{ background: "none", border: "none", color: "rgba(57,255,20,0.6)", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "center", padding: "4px" }}>
              Ver todos os {favoriteProducts?.length} favoritos →
            </button>
          )}
        </div>
      </div>
    )}

  </div>
              )}
            </article>
          )}

          {activeTab === "favorites" && (
            <div style={{ padding: 12 }}>
              <FavoritesCarousel products={favoriteProducts ?? []} onToggleFavorite={onToggleFavorite} />
            </div>
          )}

          {activeTab === "calendar" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <ShoppingCalendar />
            </div>
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab favoriteProducts={favoriteProducts ?? []} />
          )}

          {activeTab === "settings" && (
            <div className="app-modal-placeholder">
              <Settings size={48} />
              <p>Configurações em breve</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AppModal;
