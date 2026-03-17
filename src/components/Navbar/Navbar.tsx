import { useState } from "react";
import styles from "./Navbar.module.css";

interface NavbarProps {
  hidden?: boolean;
  loginOnly?: boolean;
  hideLoginButton?: boolean;
  onToggleTheme: () => void;
  onLoginButtonClick: () => void;
  userEmail: string | null;
}

export function Navbar({
  hidden = false,
  loginOnly = false,
  hideLoginButton = false,
  onToggleTheme,
  onLoginButtonClick,
  userEmail,
}: NavbarProps) {
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute("data-theme") !== "light"
  );

  function handleTheme() {
    onToggleTheme();
    setIsDark(prev => !prev);
  }

  return (
    <div className={`${styles.navbar} ${hidden ? styles.navbarHidden : ""} ${loginOnly ? styles.navbarLoginOnly : ""}`}>

      {!loginOnly && (
        <button
          type="button"
          className={styles.loginIconButton}
          onClick={handleTheme}
          aria-label="Alternar tema"
        >
          {isDark ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      )}

      {!hideLoginButton && (
        <button
          type="button"
          className={styles.loginIconButton}
          onClick={onLoginButtonClick}
          aria-label={userEmail ? "Conta do usuário" : "Abrir login"}
          title={userEmail ? "Conta" : "Login"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      )}
    </div>
  );
}
