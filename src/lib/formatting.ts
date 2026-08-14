/**
 * Formatting utilities for consistent data presentation
 * Centralized formatting functions used across the application
 */

import type { StatusType } from '@/lib/design-tokens';
import { STATUS_COLORS } from '@/lib/design-tokens';

/**
 * Format a number as Brazilian Real currency (BRL)
 * @param value - The numeric value to format
 * @returns Formatted currency string (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Format a number as percentage
 * @param value - The numeric value to format
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted percentage string (ex: "45.5%")
 */
export function formatPercentage(value: number, decimalPlaces: number = 1): string {
  return `${value.toFixed(decimalPlaces)}%`;
}

/**
 * Format a date to Brazilian format
 * @param date - The date to format
 * @returns Formatted date string (ex: "10/04/2026")
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return '-';
  }
}

/**
 * Format a date to include time
 * @param date - The date to format
 * @returns Formatted date-time string (ex: "10/04/2026 14:30")
 */
export function formatDateTime(date: Date | string | undefined): string {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return '-';
  }
}

/**
 * Format a date to show relative time (ex: "há 2 horas")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'agora mesmo';
    if (diffMinutes < 60) return `há ${diffMinutes}m`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;

    return formatDate(dateObj);
  } catch {
    return '-';
  }
}

/**
 * Format a number with thousands separator
 * @param value - The numeric value to format
 * @param decimalPlaces - Number of decimal places (default: 0)
 * @returns Formatted number string (ex: "1.234.567")
 */
export function formatNumber(value: number, decimalPlaces: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

/**
 * Get status color classes for a given status
 * @param status - The status type
 * @returns Object with bg, text, and badge color classes
 */
export function getStatusColor(status: StatusType | string) {
  const statusKey = status.toLowerCase() as StatusType;
  return STATUS_COLORS[statusKey] || STATUS_COLORS.inactive;
}

/**
 * Get badge variant for status
 * @param status - The status type
 * @returns Badge variant string
 */
export function getStatusBadgeVariant(status: StatusType | string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusKey = status.toLowerCase();

  if (statusKey === 'approved' || statusKey === 'active' || statusKey === 'success') {
    return 'default';
  }
  if (statusKey === 'rejected' || statusKey === 'error') {
    return 'destructive';
  }
  if (statusKey === 'pending' || statusKey === 'warning') {
    return 'secondary';
  }

  return 'outline';
}

/**
 * Format a file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Parse and safely format a date
 * @param dateString - Date string to parse
 * @returns Formatted date or fallback string
 */
export function parseDateSafe(dateString: string | null | undefined): string {
  if (!dateString) {
    return '-';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    return formatDate(date);
  } catch {
    return '-';
  }
}

/**
 * Truncate text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param suffix - Suffix to add if truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 50, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format status text for display
 * @param status - Status string
 * @returns Formatted status text (ex: "pending" -> "Pendente")
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    active: 'Ativo',
    inactive: 'Inativo',
    success: 'Sucesso',
    warning: 'Aviso',
    error: 'Erro',
  };

  return statusMap[status.toLowerCase()] || capitalize(status);
}
