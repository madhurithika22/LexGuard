import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  Shield, 
  LayoutDashboard, 
  FolderLock, 
  Columns, 
  Settings, 
  LogOut, 
  User,
  Activity
} from "lucide-react";

export default function Navbar({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Contracts Directory", path: "/documents", icon: FolderLock },
    { name: "Comparison Workspace", path: "/compare", icon: Columns },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-slate-950/40 flex flex-col justify-between shrink-0 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/5">
            <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center justify-center neon-glow-teal">
              <Shield className="w-4 h-4 text-teal-400" />
            </div>
            <span className="font-bold tracking-wide text-white text-base">LexGuard AI</span>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-500/10 border border-teal-500/20 text-teal-300 shadow-md"
                      : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 bg-slate-950/50 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-teal-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Jane Analyst"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{user?.role || "analyst"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 rounded-lg text-xs font-medium text-muted-foreground transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              {location.pathname === "/" ? "Dashboard Matrix" : 
               location.pathname === "/documents" ? "Contracts Directory" :
               location.pathname === "/compare" ? "Comparison Workspace" : "Contract Intelligence"}
            </h2>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Multi-Agent System: Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Org: <span className="text-teal-400">Acme Corp</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
