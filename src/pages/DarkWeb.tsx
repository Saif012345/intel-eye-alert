import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  ShoppingCart,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  Skull,
  Key,
  CreditCard,
  Globe,
  Lock,
  Users,
  Hash,
  ExternalLink,
} from "lucide-react";

// --- Simulated dark web data generators ---

const threatActorNames = [
  "APT_Shadow", "DarkPhoenix", "CyberViper", "NetReaper", "GhostShell",
  "SilentMouse", "BinaryBaron", "CryptoWraith", "ZeroNight", "MalwareMage",
  "RansomKing", "DataHarvester", "PhishMaster", "ExploitHunter", "VoidWalker",
  "BlackMamba", "CodeBreaker", "NightCrawler", "IronProxy", "StealthByte",
];

const darkWebForums = [
  "BreachForums", "XSS.is", "Exploit.in", "RaidForums Archive", "Dread",
  "CrdClub", "Nulled.to", "OGUsers", "Hackforums", "DarkMoney",
];

const marketplaces = [
  "AlphaBay (Mirror)", "ASAP Market", "Archetyp", "Incognito Market",
  "Tor2Door", "Dark0de Reborn", "Vice City", "MGM Grand",
];

const leakTypes = ["credentials", "database", "pii", "financial", "medical", "corporate"];

const countries = [
  "United States", "Russia", "China", "Nigeria", "Brazil", "India",
  "Germany", "United Kingdom", "Iran", "North Korea", "Ukraine", "Romania",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLeakedCredential(id: number) {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.ng", "bank.com", "gov.uk", "enterprise.io"];
  const users = ["admin", "john.doe", "cto", "hr_dept", "finance", "root", "support", "devops"];
  const breachSources = [
    "Corporate email dump", "Banking portal breach", "E-commerce database leak",
    "Government portal compromise", "SaaS platform breach", "Social media data scrape",
    "Healthcare records exposure", "Telecom subscriber dump",
  ];
  const severity = Math.random() > 0.6 ? "critical" : Math.random() > 0.4 ? "high" : "medium";
  const count = randomBetween(500, 500000);
  const hoursAgo = randomBetween(1, 72);

  return {
    id: `cred-${id}`,
    type: "credential" as const,
    email: `${randomFrom(users)}@${randomFrom(domains)}`,
    source: randomFrom(breachSources),
    count,
    severity,
    timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
    forum: randomFrom(darkWebForums),
    actor: randomFrom(threatActorNames),
    country: randomFrom(countries),
    hasPassword: Math.random() > 0.3,
    price: Math.random() > 0.5 ? `$${randomBetween(50, 5000)}` : "Free",
  };
}

function generateChatMessage(id: number) {
  const messages = [
    "Looking for fresh RDP access to Nigerian banks, paying top dollar",
    "New zero-day for Cisco ASA, DM for details. Not cheap.",
    "Selling 2M combo list, 30% hit rate, all .ng domains",
    "Need help with ransomware deployment, have access to 500+ endpoints",
    "Fresh SSN + DOB database, US only, 100K records",
    "Looking for insider at major telecom, will pay BTC",
    "New exploit kit ready, bypasses latest EDR solutions",
    "Selling corporate VPN credentials, Fortune 500 company",
    "Access to government email server, bidding starts at 5 BTC",
    "Custom phishing kit with real-time OTP bypass, $2000",
    "Database dump from major e-commerce, 5M users with payment info",
    "Looking for money mules in West Africa, 40% split",
    "New RAT with kernel-level rootkit, undetectable by top 5 AV",
    "Selling access to SCADA systems, critical infrastructure",
    "Fresh credit cards with high limits, EU region only",
    "Need help laundering through DeFi protocols, have $500K",
    "Exploiting Log4Shell on unpatched servers, selling shells",
    "Government classified documents for sale, multiple countries",
  ];
  const severity = Math.random() > 0.7 ? "critical" : Math.random() > 0.4 ? "high" : "medium";
  const minutesAgo = randomBetween(1, 1440);

  return {
    id: `chat-${id}`,
    type: "chatter" as const,
    message: randomFrom(messages),
    actor: randomFrom(threatActorNames),
    forum: randomFrom(darkWebForums),
    severity,
    timestamp: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    replies: randomBetween(0, 45),
    views: randomBetween(10, 5000),
    country: randomFrom(countries),
  };
}

function generateMarketListing(id: number) {
  const listings = [
    { title: "Corporate VPN Access – Fortune 500", category: "access", price: "$3,500" },
    { title: "Ransomware-as-a-Service (RaaS) Subscription", category: "malware", price: "$10,000/mo" },
    { title: "Custom Phishing Kit with MFA Bypass", category: "tools", price: "$2,000" },
    { title: "Stolen Credit Cards – US/EU – 10K batch", category: "financial", price: "$5,000" },
    { title: "Zero-Day Exploit – Windows Privilege Escalation", category: "exploit", price: "$50,000" },
    { title: "DDoS-for-Hire – 1Tbps capability", category: "service", price: "$500/hr" },
    { title: "Insider Database Access – Major Bank", category: "access", price: "$25,000" },
    { title: "Botnet Rental – 100K nodes", category: "service", price: "$1,000/day" },
    { title: "Forged Identity Documents – Any Country", category: "fraud", price: "$800" },
    { title: "Exploit Kit – Browser Zero-Days Bundle", category: "exploit", price: "$75,000" },
    { title: "Stolen Medical Records – 50K patients", category: "data", price: "$15,000" },
    { title: "Government Classified Intel Package", category: "data", price: "$100,000" },
  ];
  const listing = randomFrom(listings);
  const severity = listing.category === "exploit" ? "critical" : listing.category === "access" ? "high" : "medium";
  const hoursAgo = randomBetween(1, 168);

  return {
    id: `market-${id}`,
    type: "marketplace" as const,
    ...listing,
    severity,
    marketplace: randomFrom(marketplaces),
    vendor: randomFrom(threatActorNames),
    rating: (3 + Math.random() * 2).toFixed(1),
    sales: randomBetween(5, 500),
    timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
    escrow: Math.random() > 0.3,
  };
}

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  low: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
};

const categoryIcons: Record<string, typeof Key> = {
  access: Key,
  malware: Skull,
  tools: Lock,
  financial: CreditCard,
  exploit: AlertTriangle,
  service: Globe,
  fraud: Users,
  data: Hash,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DarkWeb = () => {
  const [credentials, setCredentials] = useState(() =>
    Array.from({ length: 20 }, (_, i) => generateLeakedCredential(i))
  );
  const [chatter, setChatter] = useState(() =>
    Array.from({ length: 25 }, (_, i) => generateChatMessage(i))
  );
  const [listings, setListings] = useState(() =>
    Array.from({ length: 15 }, (_, i) => generateMarketListing(i))
  );
  const [search, setSearch] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [censorMode, setCensorMode] = useState(true);
  const nextId = useRef(100);

  // Simulate live feed
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const type = Math.random();
      if (type < 0.4) {
        setCredentials((prev) => [generateLeakedCredential(nextId.current++), ...prev.slice(0, 49)]);
      } else if (type < 0.7) {
        setChatter((prev) => [generateChatMessage(nextId.current++), ...prev.slice(0, 49)]);
      } else {
        setListings((prev) => [generateMarketListing(nextId.current++), ...prev.slice(0, 29)]);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  const censor = (text: string) => {
    if (!censorMode) return text;
    return text.replace(/\b\w{3,}@\w+\.\w+/g, (m) => m[0] + "***@" + m.split("@")[1]);
  };

  const totalLeaked = credentials.reduce((s, c) => s + c.count, 0);
  const criticalCount = [...credentials, ...chatter, ...listings].filter((i) => i.severity === "critical").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <Skull className="h-6 w-6 text-red-400" />
              </div>
              Dark Web Monitoring
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Simulated intelligence feed — leaked credentials, actor chatter & underground markets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCensorMode(!censorMode)}
              className="gap-2 border-muted-foreground/20"
            >
              {censorMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {censorMode ? "Censored" : "Raw"}
            </Button>
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-red-400 animate-pulse" : "bg-muted-foreground"}`} />
              {isLive ? "LIVE" : "Paused"}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Leaked Records", value: totalLeaked.toLocaleString(), icon: Key, accent: "text-red-400" },
            { label: "Active Threat Actors", value: threatActorNames.length, icon: Users, accent: "text-orange-400" },
            { label: "Critical Alerts", value: criticalCount, icon: ShieldAlert, accent: "text-red-400" },
            { label: "Monitored Forums", value: darkWebForums.length + marketplaces.length, icon: Globe, accent: "text-primary" },
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actors, forums, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="credentials" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="credentials" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Key className="h-4 w-4" /> Leaked Credentials
            </TabsTrigger>
            <TabsTrigger value="chatter" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <MessageSquare className="h-4 w-4" /> Actor Chatter
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <ShoppingCart className="h-4 w-4" /> Marketplace
            </TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-2">
            {credentials
              .filter((c) => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()))
              .map((c) => {
                const sev = severityConfig[c.severity];
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl bg-card border ${sev.border} hover:bg-accent/5 transition-colors animate-in fade-in-50 duration-300`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${sev.bg} ${sev.color} border-0 text-[10px]`}>{c.severity}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(c.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-[10px] border-muted-foreground/20">{c.forum}</Badge>
                        </div>
                        <p className="text-sm text-foreground font-medium">{c.source}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-mono">{censor(c.email)}</span>
                          <span>{c.count.toLocaleString()} records</span>
                          {c.hasPassword && (
                            <span className="text-red-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Passwords included
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                          <span>Actor: <span className="text-foreground/70">{c.actor}</span></span>
                          <span>•</span>
                          <span>Origin: {c.country}</span>
                          <span>•</span>
                          <span>Price: <span className="text-primary">{c.price}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </TabsContent>

          {/* Chatter Tab */}
          <TabsContent value="chatter" className="space-y-2">
            {chatter
              .filter((c) => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()))
              .map((c) => {
                const sev = severityConfig[c.severity];
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl bg-card border ${sev.border} hover:bg-accent/5 transition-colors animate-in fade-in-50 duration-300`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${sev.bg} ${sev.color} border-0 text-[10px]`}>{c.severity}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(c.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/20">{c.forum}</Badge>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-red-500/10 shrink-0 mt-0.5">
                          <Skull className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground/80 mb-1">{c.actor}</p>
                          <p className="text-sm text-foreground/90 leading-relaxed">{c.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50 ml-10">
                        <span>{c.replies} replies</span>
                        <span>{c.views.toLocaleString()} views</span>
                        <span>Region: {c.country}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-2">
            {listings
              .filter((l) => !search || JSON.stringify(l).toLowerCase().includes(search.toLowerCase()))
              .map((l) => {
                const sev = severityConfig[l.severity];
                const CatIcon = categoryIcons[l.category] || ShoppingCart;
                return (
                  <div
                    key={l.id}
                    className={`p-4 rounded-xl bg-card border ${sev.border} hover:bg-accent/5 transition-colors animate-in fade-in-50 duration-300`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${sev.bg} shrink-0`}>
                          <CatIcon className={`h-4 w-4 ${sev.color}`} />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${sev.bg} ${sev.color} border-0 text-[10px]`}>{c.severity || l.severity}</Badge>
                            <Badge variant="outline" className="text-[10px] border-muted-foreground/20 capitalize">{l.category}</Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {timeAgo(l.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{l.title}</p>
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
                            <span>Vendor: <span className="text-foreground/70">{l.vendor}</span></span>
                            <span>★ {l.rating}</span>
                            <span>{l.sales} sales</span>
                            <span>{l.marketplace}</span>
                            {l.escrow && <span className="text-green-400">✓ Escrow</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{l.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DarkWeb;
