import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  MessageSquare,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Send,
  Trash2,
  UserCircle,
  Briefcase,
  StickyNote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Case {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  assigned_to: string | null;
  created_by: string;
  threat_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CaseNote {
  id: string;
  case_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Annotation {
  id: string;
  case_id: string | null;
  threat_id: string | null;
  user_id: string;
  annotation: string;
  tag: string | null;
  created_at: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  low: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
};

const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  open: { icon: Circle, color: "text-blue-400", label: "Open" },
  in_progress: { icon: Loader2, color: "text-yellow-400", label: "In Progress" },
  resolved: { icon: CheckCircle2, color: "text-green-400", label: "Resolved" },
  closed: { icon: CheckCircle2, color: "text-muted-foreground", label: "Closed" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const Collaboration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  // New case form
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCase, setNewCase] = useState({ title: "", description: "", severity: "medium", status: "open" });

  // New annotation form
  const [showNewAnnotation, setShowNewAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({ annotation: "", tag: "" });

  const fetchCases = async () => {
    const { data } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });
    setCases((data as Case[]) || []);
  };

  const fetchNotes = async (caseId: string) => {
    const { data } = await supabase
      .from("case_notes")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });
    setNotes((data as CaseNote[]) || []);
  };

  const fetchAnnotations = async () => {
    const { data } = await supabase
      .from("case_annotations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setAnnotations((data as Annotation[]) || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCases(), fetchAnnotations()]);
      setLoading(false);
    };
    load();

    // Realtime subscriptions
    const caseChannel = supabase
      .channel("cases-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => fetchCases())
      .subscribe();

    const noteChannel = supabase
      .channel("notes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "case_notes" }, () => {
        if (selectedCase) fetchNotes(selectedCase.id);
      })
      .subscribe();

    const annotationChannel = supabase
      .channel("annotations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "case_annotations" }, () => fetchAnnotations())
      .subscribe();

    return () => {
      supabase.removeChannel(caseChannel);
      supabase.removeChannel(noteChannel);
      supabase.removeChannel(annotationChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedCase) fetchNotes(selectedCase.id);
  }, [selectedCase]);

  const handleCreateCase = async () => {
    if (!user || !newCase.title.trim()) return;
    const { error } = await supabase.from("cases").insert({
      title: newCase.title,
      description: newCase.description || null,
      severity: newCase.severity,
      status: newCase.status,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Case created" });
      setNewCase({ title: "", description: "", severity: "medium", status: "open" });
      setShowNewCase(false);
      fetchCases();
    }
  };

  const handleUpdateCaseStatus = async (caseId: string, status: string) => {
    const { error } = await supabase.from("cases").update({ status }).eq("id", caseId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchCases();
      if (selectedCase?.id === caseId) setSelectedCase((prev) => prev ? { ...prev, status } : null);
    }
  };

  const handleAddNote = async () => {
    if (!user || !selectedCase || !newNoteContent.trim()) return;
    const { error } = await supabase.from("case_notes").insert({
      case_id: selectedCase.id,
      user_id: user.id,
      content: newNoteContent,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewNoteContent("");
      fetchNotes(selectedCase.id);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("case_notes").delete().eq("id", noteId);
    if (selectedCase) fetchNotes(selectedCase.id);
  };

  const handleAddAnnotation = async () => {
    if (!user || !newAnnotation.annotation.trim()) return;
    const { error } = await supabase.from("case_annotations").insert({
      case_id: selectedCase?.id || null,
      user_id: user.id,
      annotation: newAnnotation.annotation,
      tag: newAnnotation.tag || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewAnnotation({ annotation: "", tag: "" });
      setShowNewAnnotation(false);
      fetchAnnotations();
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    const { error } = await supabase.from("cases").delete().eq("id", caseId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (selectedCase?.id === caseId) setSelectedCase(null);
      fetchCases();
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterSeverity !== "all" && c.severity !== filterSeverity) return false;
    return true;
  });

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Sign in Required</h2>
            <p className="text-muted-foreground">Please sign in to access team collaboration features.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30">
                <Users className="h-6 w-6 text-primary" />
              </div>
              Team Collaboration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage cases, share annotations, and collaborate with your team in real-time
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showNewAnnotation} onOpenChange={setShowNewAnnotation}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-muted-foreground/20">
                  <Tag className="h-4 w-4" /> Add Annotation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">New Annotation</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Write your annotation..."
                    value={newAnnotation.annotation}
                    onChange={(e) => setNewAnnotation((p) => ({ ...p, annotation: e.target.value }))}
                    className="bg-background border-border min-h-[80px]"
                  />
                  <Input
                    placeholder="Tag (e.g., IOC, TTP, Intel)"
                    value={newAnnotation.tag}
                    onChange={(e) => setNewAnnotation((p) => ({ ...p, tag: e.target.value }))}
                    className="bg-background border-border"
                  />
                  <Button onClick={handleAddAnnotation} className="w-full gap-2">
                    <Plus className="h-4 w-4" /> Save Annotation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Case</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder="Case title"
                    value={newCase.title}
                    onChange={(e) => setNewCase((p) => ({ ...p, title: e.target.value }))}
                    className="bg-background border-border"
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newCase.description}
                    onChange={(e) => setNewCase((p) => ({ ...p, description: e.target.value }))}
                    className="bg-background border-border min-h-[80px]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={newCase.severity} onValueChange={(v) => setNewCase((p) => ({ ...p, severity: v }))}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newCase.status} onValueChange={(v) => setNewCase((p) => ({ ...p, status: v }))}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateCase} className="w-full gap-2">
                    <Plus className="h-4 w-4" /> Create Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Cases", value: cases.length, icon: Briefcase, accent: "text-primary" },
            { label: "Open", value: cases.filter((c) => c.status === "open").length, icon: Circle, accent: "text-blue-400" },
            { label: "In Progress", value: cases.filter((c) => c.status === "in_progress").length, icon: Loader2, accent: "text-yellow-400" },
            { label: "Annotations", value: annotations.length, icon: StickyNote, accent: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.accent}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="cases" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="cases" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Briefcase className="h-4 w-4" /> Cases
            </TabsTrigger>
            <TabsTrigger value="annotations" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Tag className="h-4 w-4" /> Annotations
            </TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-card border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[140px] bg-card border-border">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Case List */}
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No cases found. Create one to get started.</p>
                  </div>
                ) : (
                  filteredCases.map((c) => {
                    const sev = severityConfig[c.severity] || severityConfig.medium;
                    const st = statusConfig[c.status] || statusConfig.open;
                    const StatusIcon = st.icon;
                    const isSelected = selectedCase?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className={`p-4 rounded-xl bg-card border cursor-pointer transition-all ${
                          isSelected ? "border-primary/50 ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-foreground leading-tight">{c.title}</h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className={`${sev.bg} ${sev.color} border-0 text-[10px]`}>{c.severity}</Badge>
                          </div>
                        </div>
                        {c.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-3.5 w-3.5 ${st.color}`} />
                            <span className={`text-[10px] ${st.color}`}>{st.label}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(c.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Case Detail / Notes Panel */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                {selectedCase ? (
                  <div className="flex flex-col h-[500px]">
                    {/* Case Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-foreground">{selectedCase.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCase(selectedCase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {selectedCase.description && (
                        <p className="text-xs text-muted-foreground mb-3">{selectedCase.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedCase.status}
                          onValueChange={(v) => handleUpdateCaseStatus(selectedCase.id, v)}
                        >
                          <SelectTrigger className="w-[130px] h-7 text-xs bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge className={`${severityConfig[selectedCase.severity]?.bg} ${severityConfig[selectedCase.severity]?.color} border-0 text-[10px]`}>
                          {selectedCase.severity}
                        </Badge>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Analyst Notes</p>
                      {notes.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No notes yet. Start the conversation.</p>
                      ) : (
                        notes.map((n) => {
                          const isOwn = n.user_id === user?.id;
                          return (
                            <div
                              key={n.id}
                              className={`p-3 rounded-lg border ${
                                isOwn ? "bg-primary/5 border-primary/20" : "bg-accent/5 border-border"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {isOwn ? "You" : n.user_id.slice(0, 8)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground/50">{timeAgo(n.created_at)}</span>
                                  {isOwn && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-destructive/50 hover:text-destructive"
                                      onClick={() => handleDeleteNote(n.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-foreground/80 leading-relaxed">{n.content}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Note Input */}
                    <div className="p-3 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a note..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                          className="bg-background border-border text-sm"
                        />
                        <Button size="icon" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-center">
                    <div>
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Select a case to view details and notes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Annotations Tab */}
          <TabsContent value="annotations" className="space-y-2">
            {annotations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No annotations yet. Add one to share insights with your team.</p>
              </div>
            ) : (
              annotations.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl bg-card border border-border hover:border-muted-foreground/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {a.user_id === user?.id ? "You" : a.user_id.slice(0, 8)}
                          </span>
                        </div>
                        {a.tag && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{a.tag}</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(a.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{a.annotation}</p>
                    </div>
                    {a.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/50 hover:text-destructive shrink-0"
                        onClick={async () => {
                          await supabase.from("case_annotations").delete().eq("id", a.id);
                          fetchAnnotations();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Collaboration;
