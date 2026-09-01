import type { Product } from '../../types';

export function StockBar({ product }: { product: Product }) {
  const isLow = product.stockQuantity <= product.lowStockThreshold;
  // Scale against 2x the low-stock threshold so the bar has headroom above the danger zone.
  const ceiling = product.lowStockThreshold * 2;
  const pct = Math.min(100, Math.round((product.stockQuantity / ceiling) * 100));

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${isLow ? 'bg-status-pending' : 'bg-status-shipped'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`font-mono-data text-sm ${isLow ? 'text-status-pending' : 'text-ink'}`}
      >
        {product.stockQuantity}
      </span>
    </div>
  );
}
