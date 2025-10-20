import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const SearchBar = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Threat Intelligence Search</h2>
        <p className="text-sm text-muted-foreground">Query by IP, domain, CVE, or malware signature</p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search threats... (e.g., 185.220.101.47 or CVE-2025-1234)"
          className="pl-10 bg-secondary border-border focus:border-primary"
        />
      </div>
    </Card>
  );
};

export default SearchBar;
