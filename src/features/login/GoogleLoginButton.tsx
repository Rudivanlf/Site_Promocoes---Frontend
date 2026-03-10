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

  const onLoginSuccessRef = useRef(onLoginSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onLoginSuccessRef.current = onLoginSuccess;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    async function handleCredential({ credential }: { credential: string }) {
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
          onLoginSuccessRef.current(email);
          onCloseRef.current();
        } else {
          setErrorMessage(data.error ?? "Erro ao fazer login com Google.");
        }
      } catch {
        setErrorMessage("Falha na comunicação com o servidor.");
      }
    }

    function render() {
      if (!buttonRef.current) return;
      const width = containerRef.current?.offsetWidth || 320;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.google.accounts.id as any).renderButton(buttonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        locale: "pt-BR",
        width,
        use_fedcm_for_button: true,
      });
    }

    function init() {
      requestAnimationFrame(render);
    }

    if (window.google) {
      init();
    } else {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (script) {
        script.addEventListener("load", init, { once: true });
        return () => script.removeEventListener("load", init);
      }
    }
  }, []);

  return (
    <div className="google-login-wrapper">
      <div className="google-login-divider">
        <span>ou continue com</span>
      </div>

      <div ref={containerRef} className="google-login-custom-btn">
        <div ref={buttonRef} className="google-login-real-btn" />
      </div>

      {errorMessage && <p className="login-message">{errorMessage}</p>}
    </div>
  );
}
