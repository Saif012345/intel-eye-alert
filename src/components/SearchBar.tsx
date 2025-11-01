import { Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  search: string;
  severity: string[];
  threatType: string[];
  startDate: string;
  endDate: string;
  source: string[];
  country: string[];
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<string[]>([]);
  const [threatType, setThreatType] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [source, setSource] = useState<string[]>([]);
  const [country, setCountry] = useState<string[]>([]);

  const handleSearch = () => {
    onSearch({ search, severity, threatType, startDate, endDate, source, country });
  };

  const handleExport = async () => {
    try {
      toast({ title: "Generating report...", description: "Please wait" });
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { 
          filters: { search, severity, threatType, startDate, endDate, source, country }
        }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: "Report generated", description: "Download started" });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: "Export failed", 
        description: "Could not generate report",
        variant: "destructive" 
      });
    }
  };

  const activeFilters = severity.length + threatType.length + source.length + country.length + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Threat Intelligence Search</h2>
        <p className="text-sm text-muted-foreground">Query and filter threat data</p>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search threats... (e.g., 185.220.101.47 or CVE-2025-1234)"
            className="pl-10 bg-secondary border-border focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilters > 0 && (
                <Badge className="ml-2 bg-primary" variant="secondary">{activeFilters}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-border" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Severity</h4>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={severity.includes(level)}
                        onCheckedChange={(checked) => {
                          setSeverity(checked 
                            ? [...severity, level]
                            : severity.filter(s => s !== level)
                          );
                        }}
                      />
                      <Label htmlFor={level} className="capitalize cursor-pointer">{level}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Threat Type</h4>
                <div className="space-y-2">
                  {['malware', 'phishing', 'ransomware', 'ddos', 'exploit', 'vulnerability'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={threatType.includes(type)}
                        onCheckedChange={(checked) => {
                          setThreatType(checked 
                            ? [...threatType, type]
                            : threatType.filter(t => t !== type)
                          );
                        }}
                      />
                      <Label htmlFor={type} className="capitalize cursor-pointer">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Source</h4>
                <div className="space-y-2">
                  {['internal', 'external', 'osint', 'threat_feed'].map((src) => (
                    <div key={src} className="flex items-center space-x-2">
                      <Checkbox
                        id={src}
                        checked={source.includes(src)}
                        onCheckedChange={(checked) => {
                          setSource(checked 
                            ? [...source, src]
                            : source.filter(s => s !== src)
                          );
                        }}
                      />
                      <Label htmlFor={src} className="capitalize cursor-pointer">
                        {src.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Country</h4>
                <div className="space-y-2">
                  {['USA', 'China', 'Russia', 'Iran', 'North Korea'].map((c) => (
                    <div key={c} className="flex items-center space-x-2">
                      <Checkbox
                        id={c}
                        checked={country.includes(c)}
                        onCheckedChange={(checked) => {
                          setCountry(checked 
                            ? [...country, c]
                            : country.filter(cn => cn !== c)
                          );
                        }}
                      />
                      <Label htmlFor={c} className="cursor-pointer">{c}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Date Range</h4>
                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-secondary border-border"
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
          Search
        </Button>

        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </Card>
  );
};

export default SearchBar;
