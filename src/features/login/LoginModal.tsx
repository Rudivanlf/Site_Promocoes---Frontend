import { useState, useEffect } from "react";

interface LoginModalProps {
  onClose: () => void;
  onOpenRegister: () => void;
  onLoginSuccess: (email: string) => void;
}

export function LoginModal({ onClose, onOpenRegister, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = () => {
    const savedEmail = localStorage.getItem("registeredEmail");
    const savedPassword = localStorage.getItem("registeredPassword");

    if (email === savedEmail && password === savedPassword) {
      setMessage("Login com sucesso!");
      onLoginSuccess(email);
      localStorage.setItem("loggedUser", email);
      onClose();
    } else {
      setMessage("Email ou senha incorretos.");
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
        <button onClick={handleLogin}>Entrar</button>
        <button onClick={onClose}>Cancelar</button>
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