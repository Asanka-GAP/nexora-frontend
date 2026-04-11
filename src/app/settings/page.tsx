"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { User, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Mail, Phone, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useFetch } from "@/hooks/useFetch";
import { getTeacherProfile, updateTeacherProfile, changeTeacherPassword, sendEmailOtp, changeTeacherEmail } from "@/services/api";

type Tab = "profile" | "password";

export default function SettingsPage() {
  const { updateUser } = useAuth();
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

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setSubject(profile.subject ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { key: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text">Settings</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage your account details and security</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg rounded-xl p-1 border border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setProfileMsg(null); setPwMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-bg-card text-primary shadow-sm border border-border" : "text-text-muted hover:text-text"}`}>
              {t.icon} {t.label}
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
        ) : (
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
        )}
      </div>
    </AppShell>
  );
}
