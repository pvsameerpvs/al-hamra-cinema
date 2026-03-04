"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      toast({ title: "Success", description: "Logged in successfully!" });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Login Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-indigo-100 overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 translate-y-8" />
          <Film className="w-12 h-12 text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-bold text-white relative z-10">Al-Hamra Staff Portal</h1>
          <p className="text-indigo-100 text-sm mt-2 relative z-10">Sign in to manage bookings</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Email *</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@alhamra.com"
                className="h-11 rounded-xl bg-slate-50 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Password *</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl bg-slate-50 focus:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-semibold mt-4 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Secure area. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
