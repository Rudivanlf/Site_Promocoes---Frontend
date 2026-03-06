import { useState } from "react";

interface CadastroModalProps {
  onClose: () => void;
  onOpenLogin: () => void;
}

export function CadastroModal({ onClose, onOpenLogin }: CadastroModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    localStorage.setItem("registeredEmail", email);
    localStorage.setItem("registeredPassword", password);

    alert("Cadastro realizado com sucesso!");

    onClose();
    onOpenLogin();
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

        <div className="login-buttons">
          <button onClick={handleRegister}>Cadastrar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}