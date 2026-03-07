import { useState } from "react";
import { registerUser } from "../../shared/utils/authApi";

interface CadastroModalProps {
  onClose: () => void;
  onOpenLogin: () => void;
}

export function CadastroModal({ onClose, onOpenLogin }: CadastroModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setMessage("Preencha email e senha.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      await registerUser({ email, password });

      setMessage("Cadastro realizado com sucesso!");
      onClose();
      onOpenLogin();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar usuario.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
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

        {message && <p className="login-message">{message}</p>}

        <div className="login-buttons">
          <button onClick={handleRegister} disabled={isLoading}>
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </button>
          <button onClick={onClose} disabled={isLoading}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}