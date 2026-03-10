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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onLoginSuccessRef = useRef(onLoginSuccess);
  const onCloseRef = useRef(onClose);
  const googleReadyRef = useRef(false);

  useEffect(() => {
    onLoginSuccessRef.current = onLoginSuccess;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    function initGoogle() {
      if (googleReadyRef.current) return;
      googleReadyRef.current = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.google.accounts.id as any).initialize({
        client_id: GOOGLE_CLIENT_ID,
        context: "signin",
        cancel_on_tap_outside: false,
        callback: async ({ credential }: { credential: string }) => {
          setErrorMessage(null);
          setIsLoading(true);
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
          } finally {
            setIsLoading(false);
          }
        },
      });
    }

    if (window.google) {
      initGoogle();
    } else {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (script) {
        script.addEventListener("load", initGoogle, { once: true });
        return () => script.removeEventListener("load", initGoogle);
      }
    }
  }, []);

  function handleClick() {
    if (!window.google || !googleReadyRef.current) {
      setErrorMessage("Serviço do Google não carregou. Recarregue a página.");
      return;
    }
    if (isLoading) return;
    setErrorMessage(null);

    window.google.accounts.id.prompt((notification: {
      isNotDisplayed: () => boolean;
      isSkippedMoment: () => boolean;
      getNotDisplayedReason: () => string;
    }) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        if (reason === "unregistered_origin") {
          setErrorMessage("Domínio não autorizado no Google Cloud Console.");
        } else if (reason === "opt_out_or_no_session") {
          setErrorMessage("Entre na sua conta Google no navegador e tente novamente.");
        } else if (reason === "suppressed_by_user") {
          setErrorMessage("Prompt bloqueado pelo navegador. Tente limpar cookies e recarregar.");
        } else {
          setErrorMessage(`Login indisponível (${reason}). Recarregue a página e tente novamente.`);
        }
      }
      // isSkippedMoment = user dismissed → no action needed
      // isDisplayed / isDismissedMoment → wait for callback
    });
  }

  return (
    <div className="google-login-wrapper">
      <div className="google-login-divider">
        <span>ou continue com</span>
      </div>

      <button
        type="button"
        className="google-login-custom-btn"
        onClick={handleClick}
        disabled={isLoading}
      >
        <GoogleIcon />
        <span>{isLoading ? "Entrando..." : "Entrar com Google"}</span>
      </button>

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
