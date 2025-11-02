import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertTriangle, Bell } from "lucide-react";

interface NotificationPreferences {
  alert_on_critical: boolean;
  alert_on_high: boolean;
  alert_on_medium: boolean;
  alert_on_low: boolean;
  alert_countries: string[] | null;
  alert_threat_types: string[] | null;
}

const RealTimeAlerts = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch user notification preferences
    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching preferences:", error);
        return;
      }

      if (!data) {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            alert_on_critical: true,
            alert_on_high: true,
            alert_on_medium: false,
            alert_on_low: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating preferences:", insertError);
          return;
        }

        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    };

    fetchPreferences();
  }, [user]);

  useEffect(() => {
    if (!user || !preferences) return;

    console.log("Setting up real-time threat monitoring...");

    // Subscribe to new threats
    const channel = supabase
      .channel("threats-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "threats",
        },
        async (payload) => {
          console.log("New threat detected:", payload);
          const threat = payload.new as any;

          // Check if threat matches user preferences
          const shouldAlert = checkIfShouldAlert(threat, preferences);

          if (shouldAlert) {
            await createNotification(threat);
            showToastNotification(threat);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time threat monitoring");
      supabase.removeChannel(channel);
    };
  }, [user, preferences]);

  const checkIfShouldAlert = (
    threat: any,
    prefs: NotificationPreferences
  ): boolean => {
    // Check severity preference
    const severityMatch =
      (threat.severity === "critical" && prefs.alert_on_critical) ||
      (threat.severity === "high" && prefs.alert_on_high) ||
      (threat.severity === "medium" && prefs.alert_on_medium) ||
      (threat.severity === "low" && prefs.alert_on_low);

    if (!severityMatch) return false;

    // Check country filter
    if (prefs.alert_countries && prefs.alert_countries.length > 0) {
      if (!threat.country || !prefs.alert_countries.includes(threat.country)) {
        return false;
      }
    }

    // Check threat type filter
    if (prefs.alert_threat_types && prefs.alert_threat_types.length > 0) {
      if (!prefs.alert_threat_types.includes(threat.threat_type)) {
        return false;
      }
    }

    return true;
  };

  const createNotification = async (threat: any) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: user?.id,
        title: `New ${threat.severity.toUpperCase()} Threat Detected`,
        message: threat.title,
        severity: threat.severity,
        read: false,
      });

      if (error) {
        console.error("Error creating notification:", error);
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const showToastNotification = (threat: any) => {
    const getSeverityIcon = (severity: string) => {
      if (severity === "critical" || severity === "high") {
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      }
      return <Bell className="h-5 w-5 text-yellow-500" />;
    };

    toast(threat.title, {
      icon: getSeverityIcon(threat.severity),
      description: `${threat.severity.toUpperCase()} - ${threat.threat_type}`,
      duration: 10000,
      action: threat.country
        ? {
            label: threat.country,
            onClick: () => console.log("Country clicked"),
          }
        : undefined,
    });
  };

  // This component doesn't render anything visible
  return null;
};

export default RealTimeAlerts;
