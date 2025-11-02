import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bell, Save } from "lucide-react";

const AlertPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    alert_on_critical: true,
    alert_on_high: true,
    alert_on_medium: false,
    alert_on_low: false,
    alert_countries: [] as string[],
    alert_threat_types: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          alert_on_critical: data.alert_on_critical,
          alert_on_high: data.alert_on_high,
          alert_on_medium: data.alert_on_medium,
          alert_on_low: data.alert_on_low,
          alert_countries: data.alert_countries || [],
          alert_threat_types: data.alert_threat_types || [],
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast.success("Alert preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCountry = (country: string) => {
    setPreferences(prev => ({
      ...prev,
      alert_countries: prev.alert_countries.includes(country)
        ? prev.alert_countries.filter(c => c !== country)
        : [...prev.alert_countries, country]
    }));
  };

  const toggleThreatType = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      alert_threat_types: prev.alert_threat_types.includes(type)
        ? prev.alert_threat_types.filter(t => t !== type)
        : [...prev.alert_threat_types, type]
    }));
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading preferences...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          Real-Time Alert Preferences
        </CardTitle>
        <CardDescription>
          Configure when you want to receive real-time notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Severity Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Alert by Severity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="critical" className="text-red-500">Critical Threats</Label>
              <Switch
                id="critical"
                checked={preferences.alert_on_critical}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, alert_on_critical: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="high" className="text-orange-500">High Severity</Label>
              <Switch
                id="high"
                checked={preferences.alert_on_high}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, alert_on_high: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="medium" className="text-yellow-500">Medium Severity</Label>
              <Switch
                id="medium"
                checked={preferences.alert_on_medium}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, alert_on_medium: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low" className="text-blue-500">Low Severity</Label>
              <Switch
                id="low"
                checked={preferences.alert_on_low}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, alert_on_low: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Country Filter */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Filter by Country (Optional)</h3>
          <p className="text-xs text-muted-foreground">
            Leave empty to receive alerts for all countries
          </p>
          <div className="flex flex-wrap gap-2">
            {["Nigeria", "USA", "China", "Russia", "Iran", "North Korea"].map(country => (
              <Badge
                key={country}
                variant={preferences.alert_countries.includes(country) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCountry(country)}
              >
                {country}
              </Badge>
            ))}
          </div>
        </div>

        {/* Threat Type Filter */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Filter by Threat Type (Optional)</h3>
          <p className="text-xs text-muted-foreground">
            Leave empty to receive alerts for all threat types
          </p>
          <div className="flex flex-wrap gap-2">
            {["malware", "phishing", "vulnerability", "exploit", "ransomware", "apt"].map(type => (
              <Badge
                key={type}
                variant={preferences.alert_threat_types.includes(type) ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => toggleThreatType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={savePreferences} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlertPreferences;
