import { 
  LayoutDashboard, 
  Rss, 
  Users, 
  Database, 
  Globe, 
  AlertTriangle, 
  Bot, 
  Settings, 
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Threat Feeds", url: "/threat-feeds", icon: Rss },
  { title: "Actors & Campaigns", url: "/actors", icon: Users },
  { title: "IOCs Database", url: "/iocs", icon: Database },
  { title: "Attack Map", url: "/attack-map", icon: Globe },
  { title: "Alerts & Incidents", url: "/alerts", icon: AlertTriangle },
];

const toolsNavItems = [
  { title: "AI Defense", url: "/ai-defense", icon: Bot },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Documentation", url: "/docs", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar-background"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 glow-cyan">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary">SentinelEye</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Threat Intelligence
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider px-3 mb-2">
            {!isCollapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "bg-primary/10 text-primary border-l-2 border-primary"
                      )}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        {!isCollapsed && (
                          <span className={cn(
                            "text-sm",
                            isActive ? "font-medium text-primary" : "text-foreground"
                          )}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider px-3 mb-2">
            {!isCollapsed && "Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "bg-primary/10 text-primary border-l-2 border-primary"
                      )}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        {!isCollapsed && (
                          <span className={cn(
                            "text-sm",
                            isActive ? "font-medium text-primary" : "text-foreground"
                          )}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarTrigger className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </div>
          )}
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}
