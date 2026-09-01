import type { Order } from '../../types';
import {
  formatCurrency,
  formatTimestamp,
  STATUS_CONFIG,
} from '../../lib/format';

export function OrderRow({ order }: { order: Order }) {
  const status = STATUS_CONFIG[order.status];
  const itemSummary =
    order.items.length === 1
      ? order.items[0].productName
      : `${order.items[0].productName} +${order.items.length - 1} more`;

  return (
    <div className="flex border border-line bg-surface transition-colors hover:border-line-strong">
      <div className={`w-1.5 shrink-0 ${status.stripe}`} aria-hidden />

      <div className="grid flex-1 grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5 md:grid-cols-[1fr_2fr_1fr_1fr_auto] md:gap-y-0">
        <span className="font-mono-data text-sm text-ink-soft">{order.id}</span>

        <span
          className={`justify-self-end rounded-sm px-2.5 py-1 text-xs font-medium md:order-5 md:justify-self-auto ${status.soft} ${status.text}`}
        >
          {status.label}
        </span>

        <div className="col-span-2 flex flex-col md:col-span-1">
          <span className="text-sm font-medium text-ink">
            {order.customerName}
          </span>
          <span className="text-xs text-ink-faint">{itemSummary}</span>
        </div>

        <span className="font-mono-data text-sm text-ink">
          {formatCurrency(order.totalAmount)}
        </span>

        <span className="text-xs text-ink-faint">
          {formatTimestamp(order.createdAt)}
        </span>
      </div>
    </div>
  );
}
