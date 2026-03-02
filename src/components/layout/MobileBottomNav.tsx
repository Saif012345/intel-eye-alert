import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, AlertTriangle, Globe, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", key: "dashboard" },
  { label: "Alerts", icon: AlertTriangle, path: "/alerts", key: "alerts" },
  { label: "Map", icon: Globe, path: "/attack-map", key: "map" },
  { label: "AI Defense", icon: Brain, path: "/ai-defense", key: "ai" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tapped, setTapped] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();

    const channel = supabase
      .channel("bottom-nav-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleTap = (path: string, key: string) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);

    setTapped(key);
    setTimeout(() => setTapped(null), 300);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const isTapped = tapped === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleTap(item.path, item.key)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-all duration-200",
                active && "text-primary",
                isTapped && "scale-90"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "drop-shadow-[0_0_4px_hsl(var(--primary))]",
                    isTapped && "scale-110"
                  )}
                />
                {item.key === "alerts" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
