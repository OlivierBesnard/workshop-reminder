import { useState, useEffect } from 'react';

const ADMIN_AUTH_KEY = 'admin_auth_session';
const AUTH_EXPIRY_MINUTES = 15;

interface AdminAuthSession {
  authenticated: boolean;
  timestamp: number;
}

export function useAdminAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkStoredAuth = () => {
      const stored = localStorage.getItem(ADMIN_AUTH_KEY);
      
      if (stored) {
        try {
          const session: AdminAuthSession = JSON.parse(stored);
          const now = Date.now();
          const elapsedMinutes = (now - session.timestamp) / (1000 * 60);

          if (elapsedMinutes < AUTH_EXPIRY_MINUTES) {
            // Session valide
            setIsAdminAuthenticated(true);
          } else {
            // Session expirée
            localStorage.removeItem(ADMIN_AUTH_KEY);
            setIsAdminAuthenticated(false);
          }
        } catch (error) {
          // Données corrompues
          localStorage.removeItem(ADMIN_AUTH_KEY);
          setIsAdminAuthenticated(false);
        }
      } else {
        setIsAdminAuthenticated(false);
      }

      setIsCheckingAuth(false);
    };

    checkStoredAuth();
  }, []);

  const authenticate = () => {
    const session: AdminAuthSession = {
      authenticated: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
    setIsAdminAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAdminAuthenticated(false);
  };

  return {
    isAdminAuthenticated,
    authenticate,
    logout,
    isCheckingAuth,
  };
}
