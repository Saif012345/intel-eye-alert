import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, Search, Download, Filter, Globe, Hash, 
  Link2, Server, Copy, CheckCircle, AlertTriangle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface IOC {
  id: string;
  indicator: string;
  type: "ip" | "domain" | "hash" | "url";
  severity: string;
  threat_type: string;
  source: string;
  country: string | null;
  title: string;
  created_at: string;
}

const IOCs = () => {
  const [iocs, setIOCs] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchIOCs();
  }, []);

  const fetchIOCs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('threats')
      .select('*')
      .not('indicator', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      const processedIOCs: IOC[] = data.map((threat) => ({
        id: threat.id,
        indicator: threat.indicator || '',
        type: detectIOCType(threat.indicator || ''),
        severity: threat.severity,
        threat_type: threat.threat_type,
        source: threat.source,
        country: threat.country,
        title: threat.title,
        created_at: threat.created_at
      }));
      setIOCs(processedIOCs);
    }
    setLoading(false);
  };

  const detectIOCType = (indicator: string): "ip" | "domain" | "hash" | "url" => {
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(indicator)) return "ip";
    if (/^https?:\/\//.test(indicator)) return "url";
    if (/^[a-fA-F0-9]{32,64}$/.test(indicator)) return "hash";
    return "domain";
  };

  const filteredIOCs = iocs.filter((ioc) => {
    const matchesSearch = ioc.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ioc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || ioc.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || ioc.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      ip: <Server className="h-4 w-4" />,
      domain: <Globe className="h-4 w-4" />,
      hash: <Hash className="h-4 w-4" />,
      url: <Link2 className="h-4 w-4" />
    };
    return icons[type] || <Database className="h-4 w-4" />;
  };

  const getSeverityBadgeVariant = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    return variants[severity] || "secondary";
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCSV = () => {
    const headers = ["Indicator", "Type", "Severity", "Threat Type", "Source", "Country", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredIOCs.map(ioc => [
        `"${ioc.indicator}"`,
        ioc.type,
        ioc.severity,
        ioc.threat_type,
        ioc.source,
        ioc.country || "Unknown",
        new Date(ioc.created_at).toISOString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iocs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("IOCs exported successfully");
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredIOCs, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iocs-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("IOCs exported as JSON");
  };

  const stats = {
    total: filteredIOCs.length,
    ips: filteredIOCs.filter(i => i.type === "ip").length,
    domains: filteredIOCs.filter(i => i.type === "domain").length,
    hashes: filteredIOCs.filter(i => i.type === "hash").length,
    critical: filteredIOCs.filter(i => i.severity === "critical").length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              IOCs Database
            </h1>
            <p className="text-muted-foreground">Search and analyze Indicators of Compromise</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchIOCs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToJSON}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total IOCs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Server className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ips}</p>
                  <p className="text-xs text-muted-foreground">IP Addresses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <Globe className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.domains}</p>
                  <p className="text-xs text-muted-foreground">Domains</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Hash className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hashes}</p>
                  <p className="text-xs text-muted-foreground">File Hashes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by indicator, title..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="IOC Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ip">IP Address</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="hash">File Hash</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[160px]">
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
          </CardContent>
        </Card>

        {/* IOCs Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                IOC Repository
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                Showing {filteredIOCs.length} of {iocs.length} IOCs
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredIOCs.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No IOCs found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead>Indicator</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Threat</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIOCs.map((ioc) => (
                      <TableRow key={ioc.id} className="hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-secondary">
                              {getTypeIcon(ioc.type)}
                            </div>
                            <span className="text-xs uppercase font-mono">{ioc.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-secondary px-2 py-1 rounded break-all max-w-[200px] block truncate">
                            {ioc.indicator}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(ioc.severity)} className="capitalize">
                            {ioc.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">{ioc.threat_type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{ioc.source}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{ioc.country || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ioc.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(ioc.indicator, ioc.id)}
                          >
                            {copiedId === ioc.id ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IOCs;