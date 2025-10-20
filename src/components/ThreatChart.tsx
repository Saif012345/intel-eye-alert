import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters } from "./SearchBar";

interface ThreatChartProps {
  filters: SearchFilters;
}

const ThreatChart = ({ filters }: ThreatChartProps) => {
  const [data, setData] = useState([
    { name: "Critical", value: 0, color: "hsl(var(--destructive))" },
    { name: "High", value: 0, color: "hsl(var(--warning))" },
    { name: "Medium", value: 0, color: "hsl(var(--primary))" },
    { name: "Low", value: 0, color: "hsl(var(--success))" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from('threats').select('severity');

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }
      if (filters.threatType && filters.threatType.length > 0) {
        query = query.in('threat_type', filters.threatType);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,indicator.ilike.%${filters.search}%`);
      }

      const { data: threats } = await query;

      if (threats) {
        const counts = {
          critical: threats.filter(t => t.severity === 'critical').length,
          high: threats.filter(t => t.severity === 'high').length,
          medium: threats.filter(t => t.severity === 'medium').length,
          low: threats.filter(t => t.severity === 'low').length,
        };

        setData([
          { name: "Critical", value: counts.critical, color: "hsl(var(--destructive))" },
          { name: "High", value: counts.high, color: "hsl(var(--warning))" },
          { name: "Medium", value: counts.medium, color: "hsl(var(--primary))" },
          { name: "Low", value: counts.low, color: "hsl(var(--success))" },
        ]);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Threat Severity Distribution</h2>
        <p className="text-sm text-muted-foreground">Current threat landscape breakdown</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ThreatChart;
