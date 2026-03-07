import { useState, useEffect } from "react";
import { loginUser } from "../../shared/utils/authApi";

interface LoginModalProps {
  onClose: () => void;
  onOpenRegister: () => void;
  onLoginSuccess: (email: string) => void;
}

export function LoginModal({ onClose, onOpenRegister, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Preencha email e senha.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const authResult = await loginUser({ email, password });
      const userEmail = authResult.userEmail || email;

      localStorage.setItem("loggedUser", userEmail);
      if (authResult.token) {
        localStorage.setItem("authToken", authResult.token);
      }

      onLoginSuccess(userEmail);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Email ou senha incorretos.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [onClose]);

  return (
  <div className="login-overlay" onClick={onClose}>
    <div
      className="login-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>Login</h2>

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

      {message && <p className="login-message">{message}</p>}

      <div className="login-buttons">
        <button onClick={handleLogin} disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
        <button onClick={onClose} disabled={isLoading}>Cancelar</button>
      </div>

      <span
        className="register-link"
        onClick={() => {
          onClose();
          onOpenRegister();
        }}
      >
        Cadastrar
      </span>
    </div>
  </div>
);
}

