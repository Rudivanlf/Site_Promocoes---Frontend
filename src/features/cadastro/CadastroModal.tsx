import { useState } from "react";
import { registerUser } from "../../shared/utils/authApi";
import { GoogleLoginButton } from "../login/GoogleLoginButton";

interface CadastroModalProps {
  onClose: () => void;
  onOpenLogin: () => void;
  onLoginSuccess: (email: string) => void;
}

export function CadastroModal({ onClose, onOpenLogin, onLoginSuccess }: CadastroModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setMessage("Preencha email e senha.");
      return;
    }

    if (password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const authResult = await registerUser({ email, password });
      const userEmail = authResult.userEmail || email;

      if (authResult.token) {
        localStorage.setItem("authToken", authResult.token);
      }

      localStorage.setItem("loggedUser", userEmail);
      onLoginSuccess(userEmail);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="auth-modal auth-modal--split" onClick={(e) => e.stopPropagation()}>
        <div className="auth-panel auth-panel--form">
          <h2>Cadastrar</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className={`password-hint${password.length >= 8 ? " valid" : password.length > 0 ? " typing" : ""}`}>
            {password.length >= 8
              ? "✓ Senha válida"
              : password.length > 0
              ? `• Mínimo 8 caracteres — faltam ${8 - password.length}`
              : "• Mínimo 8 caracteres"}
          </p>

          {message && <p className="login-message">{message}</p>}

          <div className="login-buttons">
            <button onClick={handleRegister} disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
            <button onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
          </div>

          <span
            className="register-link"
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
          >
            Já tem conta? Fazer login
          </span>

          <GoogleLoginButton onLoginSuccess={onLoginSuccess} onClose={onClose} />
        </div>

        <div className="auth-panel auth-panel--promo">
          <div className="auth-promo-content">
            <p className="auth-promo-eyebrow">Promo IA</p>
            <h3>Já tem uma conta?</h3>
            <p>
              Entre para continuar acompanhando as melhores promoções e oportunidades.
            </p>

            <button
              type="button"
              className="auth-promo-button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
            >
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}