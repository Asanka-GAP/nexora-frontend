"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, LogIn } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    // Simulated auth — replace with real API when backend auth is ready
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Welcome back!");
    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-2xl bg-primary p-3 mb-4 shadow-lg shadow-primary/25">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome to Nexora</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to manage attendance</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-bg-card border border-border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="teacher@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
