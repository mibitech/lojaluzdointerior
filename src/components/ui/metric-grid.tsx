import React from 'react';
import { cn } from '@/lib/utils';
import { GRID_COLS, type GRID_COLS as GridColsType } from '@/lib/design-tokens';

export interface MetricGridProps {
  /**
   * Grid layout columns configuration
   */
  columns?: keyof typeof GRID_COLS | string;

  /**
   * Gap between items (default: "gap-4")
   */
  gap?: 'gap-2' | 'gap-3' | 'gap-4' | 'gap-6';

  /**
   * Child elements (typically KPICard components)
   */
  children: React.ReactNode;

  /**
   * Custom class name for the grid
   */
  className?: string;
}

/**
 * Metric Grid Component
 *
 * Responsive grid layout for displaying metrics/KPIs
 * Automatically handles responsive column layout based on screen size
 *
 * @example
 * ```tsx
 * <MetricGrid columns="fourCol" gap="gap-4">
 *   <KPICard {...props1} />
 *   <KPICard {...props2} />
 *   <KPICard {...props3} />
 *   <KPICard {...props4} />
 * </MetricGrid>
 * ```
 */
export const MetricGrid = React.forwardRef<HTMLDivElement, MetricGridProps>(
  (
    {
      columns = 'fourCol',
      gap = 'gap-4',
      children,
      className,
    },
    ref
  ) => {
    // Get grid columns class from GRID_COLS or use custom value
    const gridColsClass = columns in GRID_COLS
      ? GRID_COLS[columns as keyof typeof GRID_COLS]
      : columns;

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gridColsClass,
          gap,
          className
        )}
      >
        {children}
      </div>
    );
  }
);

MetricGrid.displayName = 'MetricGrid';

/**
 * Predefined grid configurations for common layouts
 */
export const METRIC_GRID_CONFIGS = {
  /**
   * Single column on mobile, 4 columns on desktop
   * Best for: 4+ metrics
   */
  fourCol: {
    columns: 'fourCol' as const,
  },

  /**
   * Single column on mobile, 3 columns on desktop
   * Best for: 3-6 metrics
   */
  threeCol: {
    columns: 'threeCol' as const,
  },

  /**
   * Single column on mobile, 2 columns on desktop
   * Best for: 2-4 metrics
   */
  twoCol: {
    columns: 'twoCol' as const,
  },

  /**
   * Full width single column
   * Best for: Detailed metrics or single item
   */
  singleCol: {
    columns: 'grid-cols-1' as const,
  },
} as const;
