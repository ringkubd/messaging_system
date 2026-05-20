import { type ReactNode } from 'react';
import { cn } from '@/_lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon?: ReactNode;
  className?: string;
}

export function KPICard({ label, value, trend, icon, className }: KPICardProps) {
  return (
    <div className={cn('p-5 rounded-xl border bg-card hover:shadow-sm transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
              {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value} from last week</span>
            </div>
          )}
        </div>
        {icon && <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">{icon}</div>}
      </div>
    </div>
  );
}
