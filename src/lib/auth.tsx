"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loginApi, resetPasswordApi, verifyOtpByUsernameApi, forgotPasswordApi, forgotPasswordResetApi, resendOtpApi, instituteLoginApi, instituteResetPasswordApi } from "@/services/api";
import type { AuthUser } from "@/lib/types";

interface LoginResult { user: AuthUser; firstLogin: boolean; email: string | null; }

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isInstituteAdmin: boolean;
  isInstituteTeacher: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  instituteLogin: (username: string, password: string) => Promise<LoginResult>;
  resetPassword: (username: string, otp: string, newPassword: string) => Promise<void>;
  instituteResetPassword: (username: string, otp: string, newPassword: string) => Promise<void>;
  verifyOtpByUsername: (username: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  forgotPasswordReset: (email: string, otp: string, newPassword: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, isSuperAdmin: false, isInstituteAdmin: false, isInstituteTeacher: false,
  login: async () => { throw new Error("not ready"); },
  instituteLogin: async () => { throw new Error("not ready"); },
  resetPassword: async () => {}, instituteResetPassword: async () => {},
  verifyOtpByUsername: async () => {}, forgotPassword: async () => {},
  forgotPasswordReset: async () => {}, resendOtp: async () => {},
  updateUser: () => {}, logout: () => {},
});

function getRedirectPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "/super-admin";
    case "INSTITUTE_ADMIN": return "/institute";
    case "INSTITUTE_TEACHER": return "/institute/teacher";
    default: return "/dashboard";
  }
}

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
    else if (user && isAuthPage) router.replace(getRedirectPath(user.role));
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

  const instituteLogin = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const res = await instituteLoginApi(username, password);
    if (!res.data.success) throw new Error(res.data.message);
    const data = res.data.data as any;
    const { token, firstLogin, email, ...rest } = data;
    const authUser: AuthUser = {
      teacherId: rest.id,
      username: rest.username || rest.email,
      name: rest.name,
      subject: rest.subject,
      role: rest.role,
    };
    localStorage.setItem("nexora_token", token);
    if (!firstLogin) {
      localStorage.setItem("nexora_user", JSON.stringify(authUser));
      setUser(authUser);
    }
    return { user: authUser, firstLogin, email: email || null };
  }, []);

  const resetPassword = useCallback(async (username: string, otp: string, newPassword: string) => {
    const res = await resetPasswordApi(username, otp, newPassword);
    if (!res.data.success) throw new Error(res.data.message);
  }, []);

  const instituteResetPassword = useCallback(async (username: string, otp: string, newPassword: string) => {
    const res = await instituteResetPasswordApi(username, otp, newPassword);
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

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("nexora_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nexora_token");
    localStorage.removeItem("nexora_user");
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      isSuperAdmin: user?.role === "SUPER_ADMIN",
      isInstituteAdmin: user?.role === "INSTITUTE_ADMIN",
      isInstituteTeacher: user?.role === "INSTITUTE_TEACHER",
      login, instituteLogin, resetPassword, instituteResetPassword,
      verifyOtpByUsername, forgotPassword, forgotPasswordReset,
      resendOtp, updateUser, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
