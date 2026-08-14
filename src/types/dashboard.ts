/**
 * Dashboard and KPI related types
 * Shared interfaces for dashboard components across the application
 */

import type { GradientPreset, StatusType } from '@/lib/design-tokens';

/**
 * KPI Item - Represents a Key Performance Indicator
 * Used in dashboards to display metrics
 */
export interface KPIItem {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: GradientPreset;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

/**
 * Metric Item - More general metric structure
 * Can be used for various dashboard metrics
 */
export interface MetricItem extends KPIItem {
  description?: string;
  unit?: string;
}

/**
 * Status Item - For displaying status-based information
 */
export interface StatusItem {
  id: string;
  label: string;
  count: number;
  status: StatusType;
  percentage?: number;
}

/**
 * Dashboard Section - Represents a section within a dashboard
 */
export interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  items: KPIItem[];
  columns?: 'auto' | 'twoCol' | 'threeCol' | 'fourCol';
}

/**
 * Chart Data - Standard format for chart data
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Period - Represents a time period (e.g., fiscal year)
 */
export interface Period {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

/**
 * Transaction - Financial transaction record
 */
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Role - Role types in the system
 */
export type UserRole = 'admin' | 'member' | 'secretary' | 'treasurer' | 'chancellor' | 'hospitaleiro';

/**
 * User Profile - Extended user information
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
