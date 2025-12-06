import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface TypeData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  'hsl(186 100% 50%)',  // cyan
  'hsl(0 85% 55%)',      // red
  'hsl(38 92% 50%)',     // amber
  'hsl(142 76% 45%)',    // green
  'hsl(270 95% 65%)',    // purple
  'hsl(199 89% 48%)',    // blue
];

export const ThreatTypeChart = () => {
  const [data, setData] = useState<TypeData[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const { data: threats, error } = await supabase
          .from('threats')
          .select('threat_type');

        if (error) throw error;

        const counts: Record<string, number> = {};
        threats?.forEach((threat) => {
          const type = threat.threat_type || 'unknown';
          counts[type] = (counts[type] || 0) + 1;
        });

        const chartData = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value], index) => ({
            name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value,
            color: COLORS[index % COLORS.length],
          }));

        setData(chartData);
      } catch (error) {
        console.error('Error fetching threat types:', error);
      }
    };

    fetchTypes();
  }, []);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <PieChartIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Threat Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">By category</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 8%)',
                  border: '1px solid hsl(222 40% 18%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(210 40% 98%)' }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
