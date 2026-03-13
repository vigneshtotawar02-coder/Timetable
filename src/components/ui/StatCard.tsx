import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  iconBg?: string;
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, iconBg = "bg-primary", className }: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border shadow-card p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
