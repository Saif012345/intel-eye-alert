import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { TrendingUp, Globe, Target, Calendar as CalendarIcon, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface ThreatData {
  id: string;
  threat_type: string;
  severity: string;
  country: string | null;
  created_at: string;
}

interface TrendData {
  date: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TypeData {
  name: string;
  count: number;
}

interface GeoData {
  country: string;
  count: number;
  critical: number;
  high: number;
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const TYPE_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

const ThreatAnalyticsDashboard = () => {
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [typeData, setTypeData] = useState<TypeData[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchThreats();
  }, [dateRange]);

  const fetchThreats = async () => {
    try {
      const { data, error } = await supabase
        .from('threats')
        .select('id, threat_type, severity, country, created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setThreats(data);
        processAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching threats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch threat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      setIsExporting(true);
      
      // Create CSV content
      const headers = ['Date', 'Threat Type', 'Severity', 'Country'];
      const rows = threats.map(threat => [
        new Date(threat.created_at).toLocaleDateString(),
        threat.threat_type,
        threat.severity,
        threat.country || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `threat-analytics-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
      link.click();

      toast({
        title: "Success",
        description: "CSV report downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      const element = document.getElementById('analytics-dashboard');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`threat-analytics-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const processAnalytics = (data: ThreatData[]) => {
    // Process trend data (last 30 days)
    const last30Days = new Map<string, { count: number; critical: number; high: number; medium: number; low: number }>();
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.set(dateStr, { count: 0, critical: 0, high: 0, medium: 0, low: 0 });
    }

    data.forEach(threat => {
      const date = new Date(threat.created_at).toISOString().split('T')[0];
      if (last30Days.has(date)) {
        const dayData = last30Days.get(date)!;
        dayData.count++;
        if (threat.severity === 'critical') dayData.critical++;
        if (threat.severity === 'high') dayData.high++;
        if (threat.severity === 'medium') dayData.medium++;
        if (threat.severity === 'low') dayData.low++;
      }
    });

    const trends = Array.from(last30Days.entries()).map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...counts,
    }));
    setTrendData(trends);

    // Process threat type data
    const typeMap = new Map<string, number>();
    data.forEach(threat => {
      typeMap.set(threat.threat_type, (typeMap.get(threat.threat_type) || 0) + 1);
    });
    const types = Array.from(typeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    setTypeData(types);

    // Process geographic data
    const geoMap = new Map<string, { count: number; critical: number; high: number }>();
    data.forEach(threat => {
      if (threat.country) {
        const existing = geoMap.get(threat.country) || { count: 0, critical: 0, high: 0 };
        existing.count++;
        if (threat.severity === 'critical') existing.critical++;
        if (threat.severity === 'high') existing.high++;
        geoMap.set(threat.country, existing);
      }
    });
    const geo = Array.from(geoMap.entries())
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setGeoData(geo);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analytics-dashboard">
      {/* Export Controls */}
      <Card className="glass-card border-accent/20">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">From</p>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                        disabled={(date) => date > new Date() || date > dateRange.to}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">To</p>
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                        disabled={(date) => date > new Date() || date < dateRange.from}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportToCSV}
                disabled={isExporting || loading}
                size="sm"
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={isExporting || loading}
                size="sm"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {threats.filter(t => t.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(threats.filter(t => t.country).map(t => t.country)).size}
            </div>
            <p className="text-xs text-muted-foreground">Affected regions</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threats.filter(t => {
                const date = new Date(t.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Threat Intelligence Analytics
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of threat patterns and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Trends Over Time</TabsTrigger>
              <TabsTrigger value="types">Threat Types</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="critical" 
                      stroke={SEVERITY_COLORS.critical}
                      strokeWidth={2}
                      name="Critical"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="high" 
                      stroke={SEVERITY_COLORS.high}
                      strokeWidth={2}
                      name="High"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="medium" 
                      stroke={SEVERITY_COLORS.medium}
                      strokeWidth={2}
                      name="Medium"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      stroke={SEVERITY_COLORS.low}
                      strokeWidth={2}
                      name="Low"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {typeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))">
                        {typeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      dataKey="country" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      width={100}
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="critical" fill={SEVERITY_COLORS.critical} name="Critical" />
                    <Bar dataKey="high" fill={SEVERITY_COLORS.high} name="High" />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatAnalyticsDashboard;
