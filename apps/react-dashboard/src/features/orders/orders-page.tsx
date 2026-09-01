import { useMemo, useState } from 'react';
import { Topbar } from '../../components/layout/topbar';
import { OrderRow } from '../../components/orders/order-row';
import { StatStrip } from '../../components/orders/stat-strip';
import { Button } from '../../components/ui/button';
import { MOCK_ORDERS } from '../../lib/mock-data';
import { formatCurrency } from '../../lib/format';
import type { OrderStatus } from '../../types';

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const orders = useMemo(
    () =>
      filter === 'all'
        ? MOCK_ORDERS
        : MOCK_ORDERS.filter((order) => order.status === filter),
    [filter],
  );

  const stats = useMemo(() => {
    const pending = MOCK_ORDERS.filter((o) => o.status === 'pending').length;
    const revenue = MOCK_ORDERS.filter((o) => o.status !== 'cancelled').reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );
    return [
      { label: 'Orders today', value: String(MOCK_ORDERS.length) },
      { label: 'Awaiting confirmation', value: String(pending), tone: 'warn' as const },
      { label: 'Revenue (non-cancelled)', value: formatCurrency(revenue) },
    ];
  }, []);

  return (
    <>
      <Topbar
        title="Orders"
        description="Every order placed, oldest activity first"
        action={<Button>New order</Button>}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <StatStrip stats={stats} />

          <div className="flex gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === item.value
                    ? 'bg-ink text-white'
                    : 'text-ink-soft hover:bg-surface hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {orders.length === 0 ? (
              <div className="border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-faint">
                No orders with this status yet.
              </div>
            ) : (
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}
