"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

type Step = "login" | "otp" | "newPw" | "forgotEmail";
type Flow = "firstLogin" | "forgot";

const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 flex-shrink-0 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 flex-shrink-0 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 flex-shrink-0 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 flex-shrink-0 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const ShieldIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
const Spinner = () => (<svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>);

const PrimaryBtn = ({ loading, disabled, label, loadingLabel }: { loading: boolean; disabled?: boolean; label: string; loadingLabel: string }) => (
  <button type="submit" disabled={loading || disabled} className="w-full h-13 lg:h-12 rounded-xl font-semibold text-base lg:text-sm text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />{loadingLabel}</span> : label}
  </button>
);

const InputField = ({ icon, ...props }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex items-center gap-3 px-4 py-3.5 lg:py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 bg-white focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]">
    {icon}
    <input {...props} className="flex-1 min-w-0 bg-transparent text-slate-800 text-base lg:text-sm placeholder:text-slate-300 outline-none" />
  </div>
);

const ErrorBox = ({ msg }: { msg: string }) => msg ? (<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{msg}</div>) : null;

const pwRules = (pw: string, confirm: string) => [
  { ok: pw.length >= 8, label: "At least 8 characters" },
  { ok: /[A-Z]/.test(pw), label: "One uppercase letter" },
  { ok: /[a-z]/.test(pw), label: "One lowercase letter" },
  { ok: /\d/.test(pw), label: "One number" },
  { ok: /[@$!%*?&#^()\-_+=]/.test(pw), label: "One special character" },
  { ok: pw === confirm && confirm.length > 0, label: "Passwords match" },
];
const isPwStrong = (pw: string) => pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[@$!%*?&#^()\-_+=]/.test(pw);
const getPwStrength = (pw: string) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 4) s++; if (pw.length >= 8) s++; if (/[a-z]/.test(pw)) s++; if (/[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[@$!%*?&#^()\-_+=]/.test(pw)) s++; if (pw.length >= 12) s++;
  if (s <= 2) return { score: s, label: "Weak", color: "#ef4444" };
  if (s <= 4) return { score: s, label: "Medium", color: "#f59e0b" };
  return { score: s, label: "Strong", color: "#22c55e" };
};

function PasswordFields({ pw, onChange }: { pw: { newPassword: string; confirmPassword: string }; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const strength = getPwStrength(pw.newPassword);
  return (<>
    <div className="flex flex-col gap-1"><label className="text-sm font-medium text-slate-600">New Password</label><InputField icon={<LockIcon />} name="newPassword" type="password" placeholder="Min 8 chars, A-z, 0-9, @#$..." value={pw.newPassword} onChange={onChange} required minLength={8} />
      {pw.newPassword.length > 0 && (<div className="flex items-center gap-2 mt-0.5"><div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${(strength.score / 7) * 100}%`, backgroundColor: strength.color }} /></div><span className="text-[10px] font-semibold shrink-0" style={{ color: strength.color }}>{strength.label}</span></div>)}
    </div>
    <div className="flex flex-col gap-1"><label className="text-sm font-medium text-slate-600">Confirm Password</label><InputField icon={<CheckIcon />} name="confirmPassword" type="password" placeholder="Re-enter your password" value={pw.confirmPassword} onChange={onChange} required minLength={8} /></div>
    {pw.newPassword.length > 0 && (<div className="grid grid-cols-2 gap-x-3 gap-y-0.5">{pwRules(pw.newPassword, pw.confirmPassword).map((rule) => (<div key={rule.label} className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 shrink-0 ${rule.ok ? "text-emerald-500" : "text-slate-300"}`}><path strokeLinecap="round" strokeLinejoin="round" d={rule.ok ? "M4.5 12.75l6 6 9-13.5" : "M6 18L18 6M6 6l12 12"} /></svg><span className={`text-[11px] leading-tight ${rule.ok ? "text-emerald-600" : "text-slate-400"}`}>{rule.label}</span></div>))}</div>)}
  </>);
}

export default function LoginPage() {
  const router = useRouter();
  const { login, resetPassword, verifyOtpByUsername, forgotPassword, forgotPasswordReset, resendOtp } = useAuth();
  const [step, setStep] = useState<Step>("login");
  const [flow, setFlow] = useState<Flow>("firstLogin");
  const [form, setForm] = useState({ username: "", password: "" });
  const [maskedEmail, setMaskedEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ username: "" });
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const clearError = () => setError("");
  const resetOtp = () => setOtp(["", "", "", "", "", ""]);
  const otpValue = otp.join("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearError();
    try {
      const result = await login(form.username, form.password);
      if (result.firstLogin) {
        setCredentials({ username: form.username }); setMaskedEmail(result.email || ""); setFlow("firstLogin"); setStep("otp");
      } else {
        router.push(result.user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
      }
    } catch (err: unknown) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearError();
    try { await forgotPassword(forgotEmail); setMaskedEmail(forgotEmail); setFlow("forgot"); setStep("otp"); }
    catch (err: unknown) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1); if (val && !/^\d$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next); clearError();
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => { if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus(); };
  const handleOtpPaste = (e: React.ClipboardEvent) => { const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (text.length === 6) { setOtp(text.split("")); otpRefs.current[5]?.focus(); e.preventDefault(); } };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); if (otpValue.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true); clearError();
    try { await verifyOtpByUsername(credentials.username, otpValue); setStep("newPw"); }
    catch (err: unknown) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid or expired OTP"); }
    finally { setLoading(false); }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (pwForm.newPassword !== pwForm.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); clearError();
    try {
      if (flow === "firstLogin") {
        await resetPassword(credentials.username, otpValue, pwForm.newPassword);
        const result = await login(credentials.username, pwForm.newPassword);
        router.push(result.user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
      } else {
        await forgotPasswordReset(forgotEmail, otpValue, pwForm.newPassword);
        setStep("login"); setForm({ username: "", password: "" }); setPwForm({ newPassword: "", confirmPassword: "" }); resetOtp();
      }
    } catch (err: unknown) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Reset failed"); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    clearError();
    try { if (flow === "forgot") await resendOtp(forgotEmail); else await login(form.username, form.password); } catch { /* silent */ }
  };

  return (
    <main className="h-screen w-full flex bg-slate-50 overflow-hidden">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)" }}>
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10" /><div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" /><div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><span className="text-white font-black text-lg">N</span></div><span className="text-white font-bold text-xl">Nexora</span></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">Smart Attendance<br />for Modern<br />Classrooms.</h1>
          <p className="text-white/70 text-base max-w-sm leading-relaxed">QR-based student attendance, real-time tracking, and instant parent notifications — all in one system.</p>
        </motion.div>
        <div className="relative z-10 flex gap-8">{[{ value: "<1s", label: "QR Scan Time" }, { value: "100%", label: "Accuracy" }, { value: "Live", label: "Notifications" }].map((s) => (<div key={s.label}><p className="text-white font-bold text-2xl">{s.value}</p><p className="text-white/50 text-sm">{s.label}</p></div>))}</div>
      </div>

      {/* Mobile: gradient header + card form */}
      <div className="flex-1 flex flex-col lg:items-center lg:justify-center overflow-y-auto">
        {/* Mobile hero header */}
        <div className="lg:hidden relative overflow-hidden px-6 pt-12 pb-10 flex-shrink-0" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)" }}>
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <span className="text-white font-bold text-lg">Nexora</span>
            </div>
            <h1 className="text-white text-2xl font-bold leading-tight">Smart Attendance<br />for Modern Classrooms</h1>
            <p className="text-white/60 text-sm mt-2">QR-based tracking & instant notifications</p>
            <div className="flex gap-6 mt-5">
              {[{ value: "<1s", label: "Scan" }, { value: "100%", label: "Accuracy" }, { value: "Live", label: "Alerts" }].map((s) => (
                <div key={s.label}>
                  <p className="text-white font-bold text-lg">{s.value}</p>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-5 sm:px-6 pt-5 pb-8 lg:py-0">
          <div className="w-full max-w-md lg:max-w-lg">
            {/* Mobile card wrapper */}
            <div className="lg:bg-transparent lg:shadow-none lg:border-0 lg:p-0 lg:rounded-none bg-white rounded-2xl shadow-lg border border-slate-100/80 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === "login" && (
              <motion.div key="login" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="mb-8"><h1 className="text-2xl lg:text-2xl font-bold text-slate-800">Welcome back</h1><p className="text-slate-400 text-base lg:text-sm mt-1">Sign in to your Nexora account</p></div>
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  <ErrorBox msg={error} />
                  <div className="flex flex-col gap-1.5"><label className="text-base lg:text-sm font-medium text-slate-600">Username or Email</label><InputField icon={<UserIcon />} placeholder="Enter username or email" value={form.username} onChange={(e) => { setForm(p => ({ ...p, username: e.target.value })); clearError(); }} required /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-base lg:text-sm font-medium text-slate-600">Password</label><InputField icon={<LockIcon />} type="password" placeholder="Enter your password" value={form.password} onChange={(e) => { setForm(p => ({ ...p, password: e.target.value })); clearError(); }} required /></div>
                  <PrimaryBtn loading={loading} label="Sign In" loadingLabel="Signing in..." />
                  <button type="button" onClick={() => { setStep("forgotEmail"); clearError(); }} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium text-center transition-colors cursor-pointer">Forgot password?</button>
                </form>
              </motion.div>
            )}

            {step === "forgotEmail" && (
              <motion.div key="forgotEmail" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="mb-8"><h1 className="text-2xl lg:text-2xl font-bold text-slate-800">Forgot password?</h1><p className="text-slate-400 text-base lg:text-sm mt-1">Enter your email and we&apos;ll send you a verification code.</p></div>
                <form onSubmit={handleForgotSend} className="flex flex-col gap-5">
                  <ErrorBox msg={error} />
                  <div className="flex flex-col gap-1.5"><label className="text-base lg:text-sm font-medium text-slate-600">Email Address</label><InputField icon={<MailIcon />} type="email" placeholder="your-email@example.com" value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); clearError(); }} required /></div>
                  <PrimaryBtn loading={loading} label="Send OTP" loadingLabel="Sending..." />
                  <button type="button" onClick={() => { setStep("login"); clearError(); }} className="text-sm text-slate-500 hover:text-slate-700 font-medium text-center transition-colors cursor-pointer">← Back to login</button>
                </form>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mb-3"><ShieldIcon /></div>
                  <h1 className="text-2xl lg:text-2xl font-bold text-slate-800">{flow === "firstLogin" ? "Verify your identity" : "Enter verification code"}</h1>
                  <p className="text-slate-400 text-base lg:text-sm mt-0.5">We sent a 6-digit code to <span className="font-medium text-slate-600">{maskedEmail}</span></p>
                </div>
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                  <ErrorBox msg={error} />
                  <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>{otp.map((digit, i) => (<input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="w-12 h-14 text-center text-xl font-bold text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] outline-none transition-all" />))}</div>
                  <PrimaryBtn loading={loading} disabled={otpValue.length !== 6} label="Verify Code" loadingLabel="Verifying..." />
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => { setStep(flow === "firstLogin" ? "login" : "forgotEmail"); clearError(); resetOtp(); }} className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer">← Back</button>
                    <button type="button" onClick={handleResend} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer">Resend code</button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === "newPw" && (
              <motion.div key="newPw" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-3"><LockIcon /></div>
                  <h1 className="text-2xl lg:text-2xl font-bold text-slate-800">{flow === "firstLogin" ? "Set your password" : "Create new password"}</h1>
                  <p className="text-slate-400 text-base lg:text-sm mt-0.5">{flow === "firstLogin" ? "Create a strong password for your account." : "Your identity has been verified. Set your new password."}</p>
                </div>
                <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
                  <ErrorBox msg={error} />
                  <PasswordFields pw={pwForm} onChange={(e) => { setPwForm(p => ({ ...p, [e.target.name]: e.target.value })); clearError(); }} />
                  <PrimaryBtn loading={loading} disabled={!isPwStrong(pwForm.newPassword) || pwForm.newPassword !== pwForm.confirmPassword} label={flow === "firstLogin" ? "Set Password & Continue" : "Reset Password"} loadingLabel="Saving..." />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
