import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Shield, AlertTriangle, Bug, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CountryThreat {
  id: string;
  title: string;
  severity: string;
  threat_type: string;
  created_at: string;
  description: string | null;
  source: string;
  indicator: string | null;
}

interface CountryDrillDownProps {
  country: string;
  onClose: () => void;
}

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#22c55e",
};

const typeIcons: Record<string, typeof Shield> = {
  apt: Target,
  malware: Bug,
  exploit: AlertTriangle,
  vulnerability: Shield,
  ioc: Shield,
  phishing: AlertTriangle,
  botnet: Bug,
  ransomware: Bug,
};

const CountryDrillDown = ({ country, onClose }: CountryDrillDownProps) => {
  const [threats, setThreats] = useState<CountryThreat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("threats")
        .select("id, title, severity, threat_type, created_at, description, source, indicator")
        .eq("country", country)
        .order("created_at", { ascending: false })
        .limit(50);
      setThreats(data || []);
      setLoading(false);
    };
    fetch();
  }, [country]);

  const severityCounts = threats.reduce<Record<string, number>>((acc, t) => {
    acc[t.severity] = (acc[t.severity] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = threats.reduce<Record<string, number>>((acc, t) => {
    acc[t.threat_type] = (acc[t.threat_type] || 0) + 1;
    return acc;
  }, {});

  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 animate-in slide-in-from-right duration-300">
      <div className="h-full bg-[hsl(220,45%,6%)] border-l border-cyan-900/40 flex flex-col shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <MapPin className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-50">{country}</h2>
              <p className="text-xs text-cyan-200/40">{threats.length} threat{threats.length !== 1 ? "s" : ""} detected</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-cyan-400 hover:bg-cyan-900/30">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2 p-4">
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="p-3 rounded-lg bg-[hsl(220,40%,10%)] border border-cyan-900/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors[sev], boxShadow: `0 0 6px ${severityColors[sev]}` }} />
                <span className="text-[10px] uppercase tracking-wider text-cyan-200/50">{sev}</span>
              </div>
              <p className="text-xl font-bold text-cyan-50">{severityCounts[sev] || 0}</p>
            </div>
          ))}
        </div>

        {/* Top attack type */}
        {topType && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-[hsl(220,40%,10%)] border border-cyan-900/20 flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-[10px] text-cyan-200/40 uppercase tracking-wider">Top Attack Type</p>
              <p className="text-sm font-semibold text-cyan-50 capitalize">{topType[0]} <span className="text-cyan-200/40">({topType[1]})</span></p>
            </div>
          </div>
        )}

        {/* Type breakdown */}
        <div className="px-4 mb-3">
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">By Type</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const Icon = typeIcons[type] || Shield;
                return (
                  <Badge key={type} variant="outline" className="gap-1 text-[10px] bg-[hsl(220,40%,10%)] border-cyan-900/30 text-cyan-100/70">
                    <Icon className="h-2.5 w-2.5" />
                    <span className="capitalize">{type}</span>
                    <span className="text-cyan-400">{count}</span>
                  </Badge>
                );
              })}
          </div>
        </div>

        {/* Threat list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Recent Threats</p>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : threats.length === 0 ? (
            <p className="text-sm text-cyan-200/40 text-center py-8">No threats found for this country</p>
          ) : (
            threats.map((t) => (
              <div key={t.id} className="p-3 rounded-lg bg-[hsl(220,40%,10%)] border border-cyan-900/20 space-y-1.5 hover:bg-[hsl(220,40%,14%)] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-cyan-100/90 leading-tight">{t.title}</span>
                  <Badge
                    className="text-[8px] px-1.5 shrink-0"
                    style={{
                      backgroundColor: `${severityColors[t.severity]}20`,
                      color: severityColors[t.severity],
                      borderColor: `${severityColors[t.severity]}40`,
                    }}
                  >
                    {t.severity}
                  </Badge>
                </div>
                {t.description && (
                  <p className="text-[10px] text-cyan-200/40 line-clamp-2">{t.description}</p>
                )}
                <div className="flex items-center gap-2 text-[9px] text-cyan-200/30">
                  <span className="capitalize">{t.threat_type}</span>
                  <span>•</span>
                  <span>{t.source}</span>
                  {t.indicator && (
                    <>
                      <span>•</span>
                      <span className="font-mono truncate max-w-[120px]">{t.indicator}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryDrillDown;
