import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { getGradientClasses, getGradientColors, type GradientPreset } from '@/lib/design-tokens';

export interface KPICardProps {
  /**
   * Label or title of the KPI
   */
  label: string;

  /**
   * The value to display (number or string)
   */
  value: string | number;

  /**
   * Icon component to display
   */
  icon: React.ReactNode;

  /**
   * Color gradient preset
   */
  gradient?: GradientPreset;

  /**
   * Optional trend indicator
   */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };

  /**
   * Optional description or subtitle
   */
  description?: string;

  /**
   * Custom class name for the card
   */
  className?: string;

  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * KPI Card Component
 *
 * Reusable component for displaying Key Performance Indicators
 * Supports gradients, trend indicators, and responsive layout
 *
 * @example
 * ```tsx
 * <KPICard
 *   label="Total Revenue"
 *   value="R$ 15,234"
 *   icon={<DollarSign />}
 *   gradient="blue"
 *   trend={{ value: 12.5, direction: 'up' }}
 * />
 * ```
 */
export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  (
    {
      label,
      value,
      icon,
      gradient = 'blue',
      trend,
      description,
      className,
      onClick,
    },
    ref
  ) => {
    const colors = getGradientColors(gradient);
    const gradientClasses = getGradientClasses(gradient);

    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden border-2 transition-all duration-200 hover:shadow-lg',
          gradientClasses,
          onClick && 'cursor-pointer hover:scale-105',
          className
        )}
        onClick={onClick}
      >
        <div className="p-6 pt-0">
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn('rounded-lg bg-white/10 p-3 backdrop-blur-sm', colors.icon)}>
              {icon}
            </div>

            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
                  trend.direction === 'up'
                    ? 'bg-green-100/80 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-red-100/80 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                )}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>

          {/* Label */}
          <p className={cn('text-sm font-medium', colors.text)}>
            {label}
          </p>

          {/* Value */}
          <h3 className={cn('text-2xl font-bold tracking-tight mt-2', colors.text)}>
            {value}
          </h3>

          {/* Description (Optional) */}
          {description && (
            <p className="text-xs text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </div>
      </Card>
    );
  }
);

KPICard.displayName = 'KPICard';
