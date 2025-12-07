import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Shield,
  Trash2,
  RefreshCw,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bot,
  Loader2,
  Play,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvestigationStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tasks: {
    id: string;
    text: string;
    completed: boolean;
    aiPrompt: string;
  }[];
  notes: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface Threat {
  id: string;
  title: string;
  severity: string;
  threat_type: string;
  description: string;
}

const initialSteps: InvestigationStep[] = [
  {
    id: 'triage',
    name: 'Triage & Identification',
    description: 'Assess the threat severity and scope of impact',
    icon: <Search className="h-5 w-5" />,
    tasks: [
      { id: 't1', text: 'Verify the threat is legitimate (not false positive)', completed: false, aiPrompt: 'Analyze this threat and help me determine if it is a false positive. What indicators suggest it is real or fake?' },
      { id: 't2', text: 'Determine affected systems and assets', completed: false, aiPrompt: 'What systems and assets might be affected by this type of threat? How can I identify impacted resources?' },
      { id: 't3', text: 'Assess business impact and urgency', completed: false, aiPrompt: 'Help me assess the business impact of this threat. What questions should I consider for urgency evaluation?' },
      { id: 't4', text: 'Classify incident severity level', completed: false, aiPrompt: 'Based on this threat, what severity classification would you recommend and why?' },
    ],
    notes: '',
    status: 'pending'
  },
  {
    id: 'containment',
    name: 'Containment',
    description: 'Limit the spread and prevent further damage',
    icon: <Shield className="h-5 w-5" />,
    tasks: [
      { id: 'c1', text: 'Isolate affected systems from network', completed: false, aiPrompt: 'What are the best practices for isolating affected systems? What should I be careful about?' },
      { id: 'c2', text: 'Block malicious IPs/domains at firewall', completed: false, aiPrompt: 'Generate firewall rules to block the indicators associated with this threat.' },
      { id: 'c3', text: 'Disable compromised user accounts', completed: false, aiPrompt: 'How should I handle potentially compromised user accounts? What steps are recommended?' },
      { id: 'c4', text: 'Preserve evidence for forensic analysis', completed: false, aiPrompt: 'What evidence should I preserve for this type of incident? Provide a forensic checklist.' },
    ],
    notes: '',
    status: 'pending'
  },
  {
    id: 'eradication',
    name: 'Eradication',
    description: 'Remove the threat from all affected systems',
    icon: <Trash2 className="h-5 w-5" />,
    tasks: [
      { id: 'e1', text: 'Remove malware/malicious files', completed: false, aiPrompt: 'What tools and techniques should I use to remove this type of malware completely?' },
      { id: 'e2', text: 'Patch vulnerabilities exploited', completed: false, aiPrompt: 'What vulnerabilities might have been exploited? Recommend patches and mitigations.' },
      { id: 'e3', text: 'Reset compromised credentials', completed: false, aiPrompt: 'Provide a credential reset checklist for incident response.' },
      { id: 'e4', text: 'Update security controls and signatures', completed: false, aiPrompt: 'What security controls and detection signatures should be updated based on this threat?' },
    ],
    notes: '',
    status: 'pending'
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Restore systems to normal operations',
    icon: <RefreshCw className="h-5 w-5" />,
    tasks: [
      { id: 'r1', text: 'Restore systems from clean backups', completed: false, aiPrompt: 'What should I verify before restoring from backups? How do I ensure backups are clean?' },
      { id: 'r2', text: 'Verify system integrity', completed: false, aiPrompt: 'How can I verify system integrity after recovery? What checks should I perform?' },
      { id: 'r3', text: 'Reconnect systems to network gradually', completed: false, aiPrompt: 'What is the recommended approach for safely reconnecting systems after an incident?' },
      { id: 'r4', text: 'Monitor for signs of persistent threat', completed: false, aiPrompt: 'What indicators should I monitor for to detect if the threat persists or returns?' },
    ],
    notes: '',
    status: 'pending'
  },
  {
    id: 'lessons',
    name: 'Lessons Learned',
    description: 'Document findings and improve defenses',
    icon: <FileText className="h-5 w-5" />,
    tasks: [
      { id: 'l1', text: 'Document incident timeline', completed: false, aiPrompt: 'Help me create an incident timeline template for this investigation.' },
      { id: 'l2', text: 'Identify root cause', completed: false, aiPrompt: 'What techniques can help identify the root cause of this incident?' },
      { id: 'l3', text: 'Update playbooks and procedures', completed: false, aiPrompt: 'What playbook updates would you recommend based on this incident?' },
      { id: 'l4', text: 'Conduct post-incident review', completed: false, aiPrompt: 'Provide a post-incident review agenda and key discussion points.' },
    ],
    notes: '',
    status: 'pending'
  }
];

interface ThreatInvestigationProps {
  onAskBot: (message: string) => void;
}

const ThreatInvestigation = ({ onAskBot }: ThreatInvestigationProps) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [steps, setSteps] = useState<InvestigationStep[]>(initialSteps);
  const [expandedStep, setExpandedStep] = useState<string | null>('triage');
  const [isLoading, setIsLoading] = useState(true);
  const [investigationStarted, setInvestigationStarted] = useState(false);

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    try {
      const { data, error } = await supabase
        .from('threats')
        .select('id, title, severity, threat_type, description')
        .in('severity', ['critical', 'high'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setThreats(data || []);
    } catch (error) {
      console.error('Error fetching threats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startInvestigation = (threat: Threat) => {
    setSelectedThreat(threat);
    setInvestigationStarted(true);
    setSteps(initialSteps.map((step, idx) => ({
      ...step,
      status: idx === 0 ? 'in-progress' : 'pending'
    })));
    toast.success(`Investigation started for: ${threat.title}`);
    
    // Send initial context to bot
    onAskBot(`I'm starting an investigation on: "${threat.title}" (${threat.severity} severity, ${threat.threat_type}). Description: ${threat.description || 'No description available'}. Help me with the triage phase.`);
  };

  const toggleTask = (stepId: string, taskId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        const updatedTasks = step.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const allCompleted = updatedTasks.every(t => t.completed);
        return {
          ...step,
          tasks: updatedTasks,
          status: allCompleted ? 'completed' : 'in-progress'
        };
      }
      return step;
    }));
  };

  const updateNotes = (stepId: string, notes: string) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, notes } : step
    ));
  };

  const askBotAboutTask = (task: { text: string; aiPrompt: string }) => {
    const context = selectedThreat 
      ? `Regarding the threat "${selectedThreat.title}" (${selectedThreat.severity}): `
      : '';
    onAskBot(context + task.aiPrompt);
  };

  const advanceToNextStep = (currentStepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    if (currentIndex < steps.length - 1) {
      setSteps(steps.map((step, idx) => {
        if (idx === currentIndex) return { ...step, status: 'completed' };
        if (idx === currentIndex + 1) return { ...step, status: 'in-progress' };
        return step;
      }));
      setExpandedStep(steps[currentIndex + 1].id);
      toast.success(`Advanced to: ${steps[currentIndex + 1].name}`);
    }
  };

  const resetInvestigation = () => {
    setSelectedThreat(null);
    setInvestigationStarted(false);
    setSteps(initialSteps);
    setExpandedStep('triage');
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!investigationStarted) {
    return (
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Start Threat Investigation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a high-priority threat to begin guided incident response
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {threats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No critical or high severity threats found. Sync threat intelligence to get started.
                </p>
              ) : (
                threats.map((threat) => (
                  <div
                    key={threat.id}
                    className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => startInvestigation(threat)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{threat.title}</h4>
                          <Badge variant="outline" className={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Type: {threat.threat_type}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {threat.description || 'No description available'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Investigation Workflow
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Investigating: <span className="text-foreground font-medium">{selectedThreat?.title}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetInvestigation} className="gap-1">
            <RotateCcw className="h-3 w-3" />
            New Investigation
          </Button>
        </div>
        <div className="space-y-2 mt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-medium">{completedSteps}/{steps.length} phases</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[450px]">
          <div className="p-4 space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`rounded-lg border transition-all ${
                  step.status === 'in-progress'
                    ? 'border-primary/50 bg-primary/5'
                    : step.status === 'completed'
                    ? 'border-success/30 bg-success/5'
                    : 'border-border/50 bg-secondary/30'
                }`}
              >
                {/* Step Header */}
                <div
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div className={`p-1.5 rounded ${step.status === 'in-progress' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{step.name}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {expandedStep === step.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Step Content */}
                {expandedStep === step.id && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Tasks */}
                    <div className="space-y-2">
                      {step.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-2 rounded bg-background/50"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(step.id, task.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.text}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => askBotAboutTask(task)}
                            className="h-7 px-2 gap-1 text-xs"
                          >
                            <Bot className="h-3 w-3" />
                            Ask AI
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Investigation Notes</label>
                      <Textarea
                        value={step.notes}
                        onChange={(e) => updateNotes(step.id, e.target.value)}
                        placeholder="Add notes, findings, IOCs..."
                        className="h-20 text-sm bg-background/50"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      {step.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => advanceToNextStep(step.id)}
                          disabled={!step.tasks.some(t => t.completed)}
                        >
                          Complete & Continue
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ThreatInvestigation;
