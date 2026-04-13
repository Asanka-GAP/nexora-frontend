"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { User, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Mail, Phone, BookOpen, Calendar, GraduationCap, Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/shared/DatePicker";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useFetch } from "@/hooks/useFetch";
import { getTeacherProfile, updateTeacherProfile, changeTeacherPassword, sendEmailOtp, changeTeacherEmail, getAcademicYearConfig, updateAcademicYearConfig } from "@/services/api";
import PageSkeleton from "@/components/ui/PageSkeleton";

type Tab = "profile" | "password" | "appearance" | "academic";

export default function SettingsPage() {
  const { updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const dk = theme === "dark";
  const [tab, setTab] = useState<Tab>("profile");

  const fetchProfile = useCallback(() => getTeacherProfile(), []);
  const { data: profile, loading, refetch } = useFetch(fetchProfile);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email change
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Academic year
  const fetchAcademicConfig = useCallback(() => getAcademicYearConfig(), []);
  const { data: academicConfig, loading: academicLoading, refetch: refetchAcademic } = useFetch(fetchAcademicConfig);
  const [nextUpgradeDate, setNextUpgradeDate] = useState("");
  const [academicSaving, setAcademicSaving] = useState(false);
  const [academicMsg, setAcademicMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setSubject(profile.subject ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (academicConfig) {
      setNextUpgradeDate(academicConfig.nextUpgradeDate ?? "");
    }
  }, [academicConfig]);

  // Cooldown timer
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [emailCooldown]);

  const handleProfileSave = async () => {
    if (!name.trim()) { setProfileMsg({ type: "error", text: "Name is required" }); return; }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await updateTeacherProfile({ name: name.trim(), phone: phone.trim(), subject: subject.trim() });
      updateUser({ name: updated.name, subject: updated.subject });
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
      refetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      setProfileMsg({ type: "error", text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const emailChanged = email.trim().toLowerCase() !== (profile?.email ?? "").toLowerCase();

  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      setEmailMsg({ type: "error", text: "Please enter a valid email address" }); return;
    }
    setEmailSending(true);
    setEmailMsg(null);
    try {
      const res = await sendEmailOtp(email.trim());
      if (!res.data.success) throw new Error(res.data.message);
      setEmailOtpSent(true);
      setEmailOtp(["", "", "", "", "", ""]);
      setEmailCooldown(60);
      setEmailMsg({ type: "success", text: `Verification code sent to ${email.trim()}` });
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (e instanceof Error ? e.message : "Failed to send verification code");
      setEmailMsg({ type: "error", text: msg });
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmail = async () => {
    const code = emailOtp.join("");
    if (code.length !== 6) { setEmailMsg({ type: "error", text: "Please enter the 6-digit code" }); return; }
    setEmailVerifying(true);
    setEmailMsg(null);
    try {
      await changeTeacherEmail(email.trim(), code);
      setEmailOtpSent(false);
      setEmailOtp(["", "", "", "", "", ""]);
      setEmailMsg(null);
      setEmailCooldown(0);
      setProfileMsg({ type: "success", text: "Email updated successfully" });
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (e instanceof Error ? e.message : "Failed to verify code");
      setEmailMsg({ type: "error", text: msg });
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val && !/^\d$/.test(val)) return;
    const next = [...emailOtp];
    next[idx] = val;
    setEmailOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !emailOtp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...emailOtp];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setEmailOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (!currentPassword) { setPwMsg({ type: "error", text: "Current password is required" }); return; }
    if (newPassword.length < 6) { setPwMsg({ type: "error", text: "New password must be at least 6 characters" }); return; }
    if (newPassword !== confirmPassword) { setPwMsg({ type: "error", text: "Passwords do not match" }); return; }
    setPwSaving(true);
    try {
      const res = await changeTeacherPassword(currentPassword, newPassword);
      if (!res.data.success) throw new Error(res.data.message);
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (e instanceof Error ? e.message : "Failed to change password");
      setPwMsg({ type: "error", text: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const handleAcademicSave = async () => {
    if (!nextUpgradeDate) {
      setAcademicMsg({ type: "error", text: "Please select a date" }); return;
    }
    if (new Date(nextUpgradeDate) <= new Date()) {
      setAcademicMsg({ type: "error", text: "Date must be in the future" }); return;
    }
    setAcademicSaving(true);
    setAcademicMsg(null);
    try {
      await updateAcademicYearConfig({ nextUpgradeDate });
      setAcademicMsg({ type: "success", text: "Next grade upgrade date updated" });
      refetchAcademic();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (e instanceof Error ? e.message : "Failed to update");
      setAcademicMsg({ type: "error", text: msg });
    } finally {
      setAcademicSaving(false);
    }
  };

  const tabs: { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", shortLabel: "Profile", icon: <User className="w-4 h-4" /> },
    { key: "password", label: "Password", shortLabel: "Password", icon: <Lock className="w-4 h-4" /> },
    { key: "appearance", label: "Appearance", shortLabel: "Theme", icon: <Sun className="w-4 h-4" /> },
    { key: "academic", label: "Academic Year", shortLabel: "Academic", icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (loading && !profile) return <PageSkeleton />;

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text">Settings</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage your account details and security</p>
        </div>

        {/* Next Grade Upgrade Banner - always visible */}
        {academicConfig?.nextUpgradeDate && (
          <div className={`relative rounded-2xl border p-4 flex items-center gap-4 overflow-hidden ${dk ? "bg-[#2a1f0f] border-amber-500/25" : "bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-200/60"}`}>
            <div className={`absolute right-0 top-0 w-32 h-32 rounded-full -translate-y-8 translate-x-8 ${dk ? "bg-amber-500/5" : "bg-gradient-to-bl from-amber-200/20 to-transparent"}`} />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${dk ? "text-amber-400/70" : "text-amber-600/70"}`}>Next Grade Upgrade</p>
              <p className={`text-sm font-bold mt-0.5 ${dk ? "text-amber-100" : "text-text"}`}>
                {new Date(academicConfig.nextUpgradeDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex-shrink-0 relative">
              {(() => {
                const days = Math.ceil((new Date(academicConfig.nextUpgradeDate + "T00:00:00").getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                return (
                  <div className={`text-center px-3 py-1.5 rounded-xl border ${dk ? "bg-amber-500/10 border-amber-500/20" : "bg-white/70 border-amber-200/50"}`}>
                    <p className={`text-lg font-bold leading-tight ${dk ? "text-amber-400" : "text-amber-600"}`}>{days <= 0 ? "Due" : days}</p>
                    <p className={`text-[9px] font-semibold ${dk ? "text-amber-400/60" : "text-amber-500/70"}`}>{days <= 0 ? "now" : days === 1 ? "day left" : "days left"}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-bg rounded-xl p-1 border border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setProfileMsg(null); setPwMsg(null); setAcademicMsg(null); }}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2.5 rounded-lg text-[10px] sm:text-sm font-medium transition-all ${tab === t.key ? "bg-bg-card text-primary shadow-sm border border-border" : "text-text-muted hover:text-text"}`}>
              {t.icon} <span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.shortLabel}</span>
            </button>
          ))}
        </div>

        {tab === "profile" && !loading ? (
          <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {/* Avatar header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20">
                  {profile?.name?.charAt(0)?.toUpperCase() ?? "T"}
                </div>
                <div>
                  <p className="font-semibold text-text">{profile?.name}</p>
                  <p className="text-xs text-text-muted">@{profile?.username}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Read-only username */}
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
                  <div className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg text-sm text-text-muted">{profile?.username}</div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                  <input value={email} onChange={e => { setEmail(e.target.value); if (emailOtpSent) { setEmailOtpSent(false); setEmailOtp(["", "", "", "", "", ""]); setEmailMsg(null); } }}
                    placeholder="Enter email address" disabled={emailOtpSent}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60" />
                </div>

                <AnimatePresence>
                  {emailChanged && !emailOtpSent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center justify-between mt-2 px-1">
                        <p className="text-[11px] text-text-muted">We'll send a verification code to confirm this email</p>
                        <Button onClick={handleSendEmailOtp} loading={emailSending} size="sm">
                          <Mail className="w-3.5 h-3.5" /> Verify Email
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {emailOtpSent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
                        <p className="text-[11px] text-text-muted">
                          Enter the 6-digit code sent to <span className="font-semibold text-text">{email.trim()}</span>
                        </p>
                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                          {emailOtp.map((d, i) => (
                            <input key={i} ref={el => { otpRefs.current[i] = el; }} value={d}
                              onChange={e => handleOtpChange(i, e.target.value)}
                              onKeyDown={e => handleOtpKeyDown(i, e)}
                              maxLength={1} inputMode="numeric"
                              className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-border bg-bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <button onClick={handleSendEmailOtp} disabled={emailCooldown > 0 || emailSending}
                            className="text-[11px] font-medium text-primary hover:text-primary-dark disabled:text-text-muted disabled:cursor-not-allowed transition">
                            {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Resend Code"}
                          </button>
                          <Button onClick={handleVerifyEmail} loading={emailVerifying} size="sm">
                            <CheckCircle className="w-3.5 h-3.5" /> Verify & Update
                          </Button>
                        </div>
                        {emailMsg && (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${emailMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {emailMsg.type === "success" ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                            {emailMsg.text}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Editable fields */}
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted mb-1.5 block">Subject</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter subject"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${profileMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {profileMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleProfileSave} loading={profileSaving}><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </div>
          </motion.div>
        ) : tab === "password" ? (
          <motion.div key="password" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text text-sm">Change Password</h3>
              <p className="text-xs text-text-muted mt-0.5">Ensure your account stays secure</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                  <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                  <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>
                )}
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${pwMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {pwMsg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {pwMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handlePasswordChange} loading={pwSaving}><Lock className="w-4 h-4" /> Change Password</Button>
              </div>
            </div>
          </motion.div>
        ) : tab === "appearance" ? (
          <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text text-sm">Appearance</h3>
              <p className="text-xs text-text-muted mt-0.5">Choose how Nexora looks to you</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  { key: "light" as const, label: "Light", icon: <Sun className="w-5 h-5" />, desc: "Clean & bright", preview: "bg-white border-slate-200" },
                  { key: "dark" as const, label: "Dark", icon: <Moon className="w-5 h-5" />, desc: "Easy on the eyes", preview: "bg-slate-900 border-slate-700" },
                ]).map(opt => (
                  <button key={opt.key} onClick={() => setTheme(opt.key)}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      theme === opt.key
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border hover:border-primary/30 hover:bg-bg"
                    }`}>
                    {theme === opt.key && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-8 rounded-lg border ${opt.preview} flex items-center justify-center`}>
                      <div className={`${theme === opt.key ? "text-primary" : "text-text-muted"}`}>{opt.icon}</div>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${theme === opt.key ? "text-primary" : "text-text"}`}>{opt.label}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : tab === "academic" ? (
          <motion.div key="academic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text text-sm">Academic Year Configuration</h3>
              <p className="text-xs text-text-muted mt-0.5">Set when student grades automatically upgrade each year</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Next upgrade date highlight card */}
              {academicConfig?.nextUpgradeDate && (
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Next Grade Upgrade</p>
                      <p className="text-lg font-bold text-text mt-0.5">
                        {new Date(academicConfig.nextUpgradeDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-xs text-primary font-medium mt-1">
                        {(() => {
                          const days = Math.ceil((new Date(academicConfig.nextUpgradeDate + "T00:00:00").getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                          if (days <= 0) return "Upgrade is due";
                          if (days === 1) return "Tomorrow";
                          return `${days} days from now`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {academicConfig?.lastUpgradedAt && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700">Last upgrade: {new Date(academicConfig.lastUpgradedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-bg p-4">
                <p className="text-xs text-text-muted">
                  All active students will be promoted to the next grade on this date. After the upgrade runs, it automatically resets to January 1st of the following year — you can change it again anytime.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Change Upgrade Date</label>
                <DatePicker
                  value={nextUpgradeDate}
                  onChange={setNextUpgradeDate}
                  label="Select upgrade date"
                  minDate={new Date().toISOString().split("T")[0]}
                  fullWidth
                />
              </div>

              {academicMsg && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${academicMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {academicMsg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {academicMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleAcademicSave} loading={academicSaving || academicLoading}><Save className="w-4 h-4" /> Save Configuration</Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </>
  );
}
