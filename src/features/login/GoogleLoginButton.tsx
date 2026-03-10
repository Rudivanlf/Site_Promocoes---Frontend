import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID =
  "145822041440-c58sfkkmqb3vh9hq7o4d9p4bbfib6ea0.apps.googleusercontent.com";

const API_BASE_URL = import.meta.env.VITE_BASE_API_URL ?? "";
const GOOGLE_LOGIN_PATH = `${API_BASE_URL}/api/usuarios/google/`;

interface GoogleLoginButtonProps {
  onLoginSuccess: (email: string) => void;
  onClose: () => void;
}

export function GoogleLoginButton({ onLoginSuccess, onClose }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    const width = containerRef.current?.offsetWidth ?? 320;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      locale: "pt-BR",
      width,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCredentialResponse({ credential }: { credential: string }) {
    setErrorMessage(null);
    try {
      const res = await fetch(GOOGLE_LOGIN_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credential }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("authToken", data.token);
        const email: string = data.usuario?.email ?? "";
        localStorage.setItem("loggedUser", email);
        onLoginSuccess(email);
        onClose();
      } else {
        setErrorMessage(data.error ?? "Erro ao fazer login com Google.");
      }
    } catch {
      setErrorMessage("Falha na comunicação com o servidor.");
    }
  }

  return (
    <div className="google-login-wrapper">
      <div className="google-login-divider">
        <span>ou continue com</span>
      </div>

      {/* Custom styled button (visible) + Google's real button (invisible on top) */}
      <div ref={containerRef} className="google-login-custom-btn">
        <div className="google-login-custom-visible" aria-hidden="true">
          <GoogleIcon />
          <span>Entrar com Google</span>
        </div>
        <div ref={buttonRef} className="google-login-real-btn" />
      </div>

      {errorMessage && <p className="login-message">{errorMessage}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.3 5.5-4.8 7.2v6h7.7c4.5-4.2 7.5-10.3 7.5-17.5z"/>
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.7-6c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1H2.4v6.2C6.4 42.6 14.6 48 24 48z"/>
      <path fill="#FBBC05" d="M10.3 28.4c-.5-1.4-.8-3-.8-4.4s.3-3 .8-4.4v-6.2H2.4C.9 16.5 0 20.1 0 24s.9 7.5 2.4 10.6l7.9-6.2z"/>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C36 2.1 30.5 0 24 0 14.6 0 6.4 5.4 2.4 13.4l7.9 6.2C12.2 13.8 17.6 9.5 24 9.5z"/>
    </svg>
  );
}
