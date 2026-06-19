import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Shield, Sparkles, Building, Mail, Lock, User } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({
          name,
          email,
          password,
          organization_name: organizationName,
          industry
        });
      }
      navigate("/");
    } catch (err) {
      // Error handled by store
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="min-h-screen bg-background bg-grid-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center mb-3 neon-glow-teal">
            <Shield className="w-6 h-6 text-teal-400 animate-pulse-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            LexGuard AI <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-mono">PRO</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1 text-center">
            Enterprise-grade contract intelligence & audit platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                >
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Procurement & Logistics">Procurement & Logistics</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Legal Services">Legal Services</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-teal-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-teal-500/50 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg shadow-teal-500/20"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {isLogin ? "Sign In to LexGuard" : "Create Enterprise Account"}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
