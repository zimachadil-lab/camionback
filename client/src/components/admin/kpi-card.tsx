import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp }: KpiCardProps) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {trend && (
              <p className={`text-sm mt-2 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
