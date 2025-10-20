import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Critical", value: 47, color: "hsl(var(--destructive))" },
  { name: "High", value: 234, color: "hsl(var(--warning))" },
  { name: "Medium", value: 1456, color: "hsl(var(--primary))" },
  { name: "Low", value: 1110, color: "hsl(var(--success))" },
];

const ThreatChart = () => {
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
