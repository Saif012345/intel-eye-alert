import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, AlertTriangle, Globe, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Alerts", icon: AlertTriangle, path: "/alerts" },
  { label: "Map", icon: Globe, path: "/attack-map" },
  { label: "AI Defense", icon: Brain, path: "/ai-defense" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors",
                active && "text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_4px_hsl(var(--primary))]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
