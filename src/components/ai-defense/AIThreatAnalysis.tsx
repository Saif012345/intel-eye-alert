import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, AlertTriangle, Shield, Target, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThreatInsight {
  id: string;
  title: string;
  severity: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  relatedThreats: number;
}

const AIThreatAnalysis = () => {
  const [insights, setInsights] = useState<ThreatInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    try {
      const { data: threats } = await supabase
        .from('threats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!threats || threats.length === 0) {
        setInsights([]);
        return;
      }

      // Analyze threat patterns
      const criticalThreats = threats.filter(t => t.severity === 'critical');
      const aptThreats = threats.filter(t => t.threat_type === 'apt');
      const exploitThreats = threats.filter(t => t.threat_type === 'exploit');

      const generatedInsights: ThreatInsight[] = [];

      if (criticalThreats.length > 0) {
        generatedInsights.push({
          id: '1',
          title: 'Critical Threat Campaign Detected',
          severity: 'critical',
          analysis: `Analysis of ${criticalThreats.length} critical threats reveals potential coordinated attack campaign. ${criticalThreats.length > 5 ? 'High volume indicates active exploitation.' : 'Monitoring recommended.'}`,
          recommendations: [
            'Activate incident response team',
            'Review firewall rules for affected indicators',
            'Enable enhanced logging on critical systems',
            'Brief executive team on potential impact'
          ],
          confidence: Math.min(95, 70 + criticalThreats.length * 2),
          relatedThreats: criticalThreats.length
        });
      }

      if (aptThreats.length > 0) {
        generatedInsights.push({
          id: '2',
          title: 'APT Activity Pattern Analysis',
          severity: 'high',
          analysis: `Detected ${aptThreats.length} APT-related indicators. Behavioral patterns suggest ${aptThreats.length > 10 ? 'nation-state level sophistication' : 'organized threat actor activity'}.`,
          recommendations: [
            'Review lateral movement detection rules',
            'Audit privileged account activity',
            'Implement additional network segmentation',
            'Update threat hunting playbooks'
          ],
          confidence: Math.min(90, 60 + aptThreats.length * 3),
          relatedThreats: aptThreats.length
        });
      }

      if (exploitThreats.length > 0) {
        generatedInsights.push({
          id: '3',
          title: 'Vulnerability Exploitation Trends',
          severity: 'medium',
          analysis: `${exploitThreats.length} active exploits tracked. Primary targets include web applications and remote access services.`,
          recommendations: [
            'Prioritize patching for affected CVEs',
            'Review WAF rule effectiveness',
            'Conduct vulnerability assessment',
            'Update IDS/IPS signatures'
          ],
          confidence: Math.min(85, 55 + exploitThreats.length * 2),
          relatedThreats: exploitThreats.length
        });
      }

      // Add general security posture insight
      generatedInsights.push({
        id: '4',
        title: 'Security Posture Assessment',
        severity: 'info',
        analysis: `Based on ${threats.length} analyzed threats, your current detection rate is performing ${threats.length > 30 ? 'above' : 'at'} baseline expectations. AI models continue learning from new threat patterns.`,
        recommendations: [
          'Continue monitoring threat feed integrations',
          'Review and update detection rules weekly',
          'Conduct quarterly threat landscape review',
          'Maintain threat intelligence sharing'
        ],
        confidence: 88,
        relatedThreats: threats.length
      });

      setInsights(generatedInsights);
      setLastAnalysis(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'high': return <Target className="h-5 w-5 text-orange-400" />;
      default: return <Shield className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            AI Threat Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastAnalysis && (
              <span className="text-xs text-muted-foreground">
                Last: {lastAnalysis}
              </span>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={generateInsights}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Deep-dive analysis with AI-powered recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Analyzing threat patterns...</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No threats to analyze. Sync threat intelligence to get started.
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(insight.severity)}
                  <h4 className="font-semibold">{insight.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                    {insight.severity}
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{insight.analysis}</p>
              
              <div className="mb-3">
                <h5 className="text-xs font-medium text-warning mb-2">AI Recommendations:</h5>
                <ul className="space-y-1">
                  {insight.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Related threats analyzed: {insight.relatedThreats}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AIThreatAnalysis;
