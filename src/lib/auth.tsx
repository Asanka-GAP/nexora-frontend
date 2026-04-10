"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loginApi, resetPasswordApi, verifyOtpByUsernameApi, forgotPasswordApi, forgotPasswordResetApi, resendOtpApi } from "@/services/api";
import type { AuthUser } from "@/lib/types";

interface LoginResult { user: AuthUser; firstLogin: boolean; email: string | null; }

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  resetPassword: (username: string, otp: string, newPassword: string) => Promise<void>;
  verifyOtpByUsername: (username: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  forgotPasswordReset: (email: string, otp: string, newPassword: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, isSuperAdmin: false,
  login: async () => { throw new Error("not ready"); },
  resetPassword: async () => {}, verifyOtpByUsername: async () => {},
  forgotPassword: async () => {}, forgotPasswordReset: async () => {},
  resendOtp: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("nexora_user");
    const token = localStorage.getItem("nexora_token");
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    const isAuthPage = pathname === "/login";
    if (!user && !isAuthPage) router.replace("/login");
    else if (user && isAuthPage) router.replace(user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
  }, [user, loading, pathname, router]);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const res = await loginApi(username, password);
    if (!res.data.success) throw new Error(res.data.message);
    const { token, firstLogin, email, ...authUser } = res.data.data;
    localStorage.setItem("nexora_token", token);
    if (!firstLogin) {
      localStorage.setItem("nexora_user", JSON.stringify(authUser));
      setUser(authUser);
    }
    return { user: authUser, firstLogin, email };
  }, []);

  const resetPassword = useCallback(async (username: string, otp: string, newPassword: string) => {
    const res = await resetPasswordApi(username, otp, newPassword);
    if (!res.data.success) throw new Error(res.data.message);
  }, []);

  const verifyOtpByUsername = useCallback(async (username: string, otp: string) => {
    const res = await verifyOtpByUsernameApi(username, otp);
    if (!res.data.success) throw new Error(res.data.message);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await forgotPasswordApi(email);
    if (!res.data.success) throw new Error(res.data.message);
  }, []);

  const forgotPasswordReset = useCallback(async (email: string, otp: string, newPassword: string) => {
    const res = await forgotPasswordResetApi(email, otp, newPassword);
    if (!res.data.success) throw new Error(res.data.message);
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await resendOtpApi(email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nexora_token");
    localStorage.removeItem("nexora_user");
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, isSuperAdmin: user?.role === "SUPER_ADMIN", login, resetPassword, verifyOtpByUsername, forgotPassword, forgotPasswordReset, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
