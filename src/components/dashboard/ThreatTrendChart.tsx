import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface TrendData {
  date: string;
  threats: number;
  critical: number;
  high: number;
}

export const ThreatTrendChart = () => {
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data: threats, error } = await supabase
          .from('threats')
          .select('created_at, severity')
          .gte('created_at', subDays(new Date(), 7).toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by day
        const grouped: Record<string, { threats: number; critical: number; high: number }> = {};
        
        for (let i = 6; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'MMM dd');
          grouped[date] = { threats: 0, critical: 0, high: 0 };
        }

        threats?.forEach((threat) => {
          const date = format(new Date(threat.created_at), 'MMM dd');
          if (grouped[date]) {
            grouped[date].threats++;
            if (threat.severity === 'critical') grouped[date].critical++;
            if (threat.severity === 'high') grouped[date].high++;
          }
        });

        const chartData = Object.entries(grouped).map(([date, values]) => ({
          date,
          ...values,
        }));

        // Add some sample data if empty
        if (chartData.every(d => d.threats === 0)) {
          chartData.forEach((d, i) => {
            d.threats = Math.floor(Math.random() * 50) + 20;
            d.critical = Math.floor(d.threats * 0.2);
            d.high = Math.floor(d.threats * 0.3);
          });
        }

        setData(chartData);
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    };

    fetchTrends();
  }, []);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Threat Trends</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days activity</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(186 100% 50%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(186 100% 50%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 85% 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0 85% 55%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(222 40% 18%)" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="hsl(215 20% 60%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215 20% 60%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 8%)',
                  border: '1px solid hsl(222 40% 18%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ color: 'hsl(210 40% 98%)' }}
              />
              <Area
                type="monotone"
                dataKey="threats"
                stroke="hsl(186 100% 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorThreats)"
                name="Total Threats"
              />
              <Area
                type="monotone"
                dataKey="critical"
                stroke="hsl(0 85% 55%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCritical)"
                name="Critical"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
