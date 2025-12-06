import { useState } from "react";
import { Bell, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TopNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncThreats = async () => {
    setIsSyncing(true);
    toast.info("Syncing threat intelligence...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Authentication required.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-threat-intelligence', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) throw error;
      
      toast.success(data.message || `Synced ${data.threatsAdded} threats`);
      window.location.reload();
    } catch (error) {
      console.error('Error syncing threats:', error);
      toast.error("Failed to sync threats.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search threats, IOCs, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncThreats}
            disabled={isSyncing}
            className="hidden md:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Intel'}</span>
          </Button>
          
          <ThemeToggle />
          
          {user ? (
            <>
              <NotificationCenter />
              <UserMenu />
            </>
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
