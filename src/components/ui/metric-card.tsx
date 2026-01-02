import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string | React.ReactNode;
  value: string | number;
  className?: string;
  children?: React.ReactNode;
  tooltipText?: string;
}

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function MetricCard({ title, value, className, children, tooltipText }: MetricCardProps) {
  return (
    <div className={cn(
      "bg-metric-card border border-border rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs md:text-sm font-medium text-metric-label">{title}</h3>
        {tooltipText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-metric-value mb-3 md:mb-4">{value}</div>
      {children}
    </div>
  );
}

export function TrendIndicator({ value, suffix = "", className }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-sm font-medium",
      isPositive ? "text-trend-up" : "text-trend-down",
      className
    )}>
      <Icon className="h-4 w-4" />
      <span>{Math.abs(value).toFixed(2)}{suffix}</span>
    </div>
  );
}

export function PeriodMetric({ 
  label, 
  value, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  trend?: number; 
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-metric-label">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-metric-value">{value}</span>
        {trend !== undefined && <TrendIndicator value={trend} suffix="%" />}
      </div>
    </div>
  );
}