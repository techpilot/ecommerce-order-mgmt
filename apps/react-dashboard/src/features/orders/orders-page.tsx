import { useMemo, useState } from 'react';
import { Topbar } from '../../components/layout/topbar';
import { OrderRow } from '../../components/orders/order-row';
import { StatStrip } from '../../components/orders/stat-strip';
import { Button } from '../../components/ui/button';
import { formatCurrency } from '../../lib/format';
import type { OrderStatus } from '../../types';
import { NewOrderModal } from './new-order-modal';
import { useOrders } from './use-orders';

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function OrdersPage() {
  const { data: allOrders = [], isLoading, isError } = useOrders();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const orders = useMemo(
    () =>
      filter === 'all'
        ? allOrders
        : allOrders.filter((order) => order.status === filter),
    [allOrders, filter],
  );

  const stats = useMemo(() => {
    const pending = allOrders.filter((o) => o.status === 'pending').length;
    const revenue = allOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return [
      { label: 'Orders today', value: String(allOrders.length) },
      {
        label: 'Awaiting confirmation',
        value: String(pending),
        tone: 'warn' as const,
      },
      { label: 'Revenue (non-cancelled)', value: formatCurrency(revenue) },
    ];
  }, [allOrders]);

  return (
    <>
      <Topbar
        title="Orders"
        description="Every order placed, oldest activity first"
        action={
          <Button onClick={() => setIsNewOrderOpen(true)}>New order</Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <StatStrip stats={stats} />

          <div className="flex gap-1.5 overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
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
            {isLoading ? (
              <div className="border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-faint">
                Loading orders…
              </div>
            ) : isError ? (
              <div className="border border-dashed border-line-strong px-5 py-8 text-center text-sm text-status-cancelled">
                Couldn't load orders. Try refreshing.
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-faint">
                No orders with this status yet.
              </div>
            ) : (
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </div>
        </div>
      </div>

      {isNewOrderOpen && (
        <NewOrderModal onClose={() => setIsNewOrderOpen(false)} />
      )}
    </>
  );
}
