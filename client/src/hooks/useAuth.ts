import { useState, useCallback } from "react";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export const useAuth = () => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    return { user, token, isAuthenticated: !!token && !!user };
  });

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ user, token, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ user: null, token: null, isAuthenticated: false });
  }, []);

  return { ...auth, isGuest: !auth.isAuthenticated, login, logout };
};
