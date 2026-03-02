import { useCallback } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();

  const handleRefresh = useCallback(async () => {
    toast.info("Refreshing threat data...");
    // Small delay to allow UI to update, then reload data
    await new Promise((r) => setTimeout(r, 800));
    window.location.reload();
  }, []);

  const { containerRef, pullDistance, isRefreshing, progress } =
    usePullToRefresh({ onRefresh: handleRefresh });

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
          <TopNav />
          <main
            ref={containerRef as React.RefObject<HTMLElement>}
            className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto relative"
          >
            {/* Pull-to-refresh indicator (mobile only) */}
            {isMobile && (pullDistance > 0 || isRefreshing) && (
              <div
                className="flex items-center justify-center transition-all duration-200 pointer-events-none"
                style={{
                  height: isRefreshing ? 48 : pullDistance,
                  opacity: isRefreshing ? 1 : progress,
                }}
              >
                <RefreshCw
                  className={cn(
                    "h-5 w-5 text-primary transition-transform",
                    isRefreshing && "animate-spin"
                  )}
                  style={{
                    transform: isRefreshing
                      ? undefined
                      : `rotate(${progress * 360}deg)`,
                  }}
                />
                <span className="ml-2 text-xs text-muted-foreground">
                  {isRefreshing
                    ? "Refreshing..."
                    : progress >= 1
                      ? "Release to refresh"
                      : "Pull to refresh"}
                </span>
              </div>
            )}
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
};
