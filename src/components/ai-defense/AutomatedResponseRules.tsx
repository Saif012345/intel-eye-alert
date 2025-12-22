import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Zap, 
  Ban, 
  Mail, 
  Bell, 
  Database,
  Plus,
  Activity
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ResponseRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
  icon: 'shield' | 'ban' | 'mail' | 'bell' | 'database';
}

const AutomatedResponseRules = () => {
  const [rules, setRules] = useState<ResponseRule[]>([
    {
      id: '1',
      name: 'Block Critical IPs',
      trigger: 'Critical severity threat detected',
      action: 'Add to firewall blocklist',
      severity: 'critical',
      enabled: true,
      lastTriggered: '2 hours ago',
      triggerCount: 47,
      icon: 'ban'
    },
    {
      id: '2',
      name: 'Alert SOC Team',
      trigger: 'High severity APT detected',
      action: 'Send Slack/Email notification',
      severity: 'high',
      enabled: true,
      lastTriggered: '30 minutes ago',
      triggerCount: 156,
      icon: 'bell'
    },
    {
      id: '3',
      name: 'Quarantine Malicious Domains',
      trigger: 'Known malware domain accessed',
      action: 'Add to DNS sinkhole',
      severity: 'high',
      enabled: true,
      lastTriggered: '1 hour ago',
      triggerCount: 89,
      icon: 'shield'
    },
    {
      id: '4',
      name: 'Threat Intel Enrichment',
      trigger: 'New IOC detected',
      action: 'Auto-enrich with external sources',
      severity: 'medium',
      enabled: true,
      lastTriggered: '5 minutes ago',
      triggerCount: 324,
      icon: 'database'
    },
    {
      id: '5',
      name: 'Executive Briefing',
      trigger: 'Weekly threat summary',
      action: 'Generate and email report',
      severity: 'low',
      enabled: false,
      lastTriggered: '7 days ago',
      triggerCount: 12,
      icon: 'mail'
    }
  ]);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => {
      if (rule.id === id) {
        const newState = !rule.enabled;
        toast.success(`Rule "${rule.name}" ${newState ? 'enabled' : 'disabled'}`);
        return { ...rule, enabled: newState };
      }
      return rule;
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'shield': return <Shield className="h-4 w-4" />;
      case 'ban': return <Ban className="h-4 w-4" />;
      case 'mail': return <Mail className="h-4 w-4" />;
      case 'bell': return <Bell className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const activeRules = rules.filter(r => r.enabled).length;
  const totalTriggers = rules.reduce((acc, r) => acc + r.triggerCount, 0);

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-primary/5 pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            Automated Response Rules
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1 border-primary/30 hover:bg-primary/10">
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        </div>
        <div className="flex gap-4 text-sm mt-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">
              Active: <span className="text-success font-medium">{activeRules}/{rules.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              Total Triggers: <span className="text-primary font-medium">{totalTriggers}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
              rule.enabled 
                ? 'bg-secondary/50 border-border hover:border-primary/50 hover:shadow-primary/5' 
                : 'bg-secondary/20 border-border/50 opacity-60'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  rule.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {getIcon(rule.icon)}
                </div>
                <div>
                  <h4 className="font-medium">{rule.name}</h4>
                  <p className="text-xs text-muted-foreground">{rule.trigger}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                  {rule.severity}
                </Badge>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  Action: <span className="text-foreground">{rule.action}</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {rule.triggerCount}x
                </span>
                {rule.lastTriggered && <span>Last: {rule.lastTriggered}</span>}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AutomatedResponseRules;
