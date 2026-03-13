import React, { createContext, useContext, useState, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { loginApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("tt_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string, _role?: UserRole) => {
    const { user: apiUser, session } = await loginApi(email, password);
    const mappedUser: User = {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      department: apiUser.department,
      semester: apiUser.semester,
    };
    setUser(mappedUser);
    localStorage.setItem("tt_user", JSON.stringify(mappedUser));
    localStorage.setItem("tt_token", session.access_token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("tt_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
