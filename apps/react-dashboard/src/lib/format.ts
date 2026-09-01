import type { OrderStatus } from '../types';

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; stripe: string; text: string; soft: string }
> = {
  pending: {
    label: 'Pending',
    stripe: 'bg-status-pending',
    text: 'text-status-pending',
    soft: 'bg-status-pending-soft',
  },
  confirmed: {
    label: 'Confirmed',
    stripe: 'bg-status-confirmed',
    text: 'text-status-confirmed',
    soft: 'bg-status-confirmed-soft',
  },
  shipped: {
    label: 'Shipped',
    stripe: 'bg-status-shipped',
    text: 'text-status-shipped',
    soft: 'bg-status-shipped-soft',
  },
  cancelled: {
    label: 'Cancelled',
    stripe: 'bg-status-cancelled',
    text: 'text-status-cancelled',
    soft: 'bg-status-cancelled-soft',
  },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
