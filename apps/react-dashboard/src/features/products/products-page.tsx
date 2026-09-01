import { Topbar } from '../../components/layout/topbar';
import { StockBar } from '../../components/orders/stock-bar';
import { Button } from '../../components/ui/button';
import { MOCK_PRODUCTS } from '../../lib/mock-data';
import { formatCurrency } from '../../lib/format';

export function ProductsPage() {
  return (
    <>
      <Topbar
        title="Products"
        description="Stock levels sync from the inventory service"
        action={<Button>Add product</Button>}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-faint">
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCTS.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5 font-mono-data text-ink-soft">
                    {product.sku}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-ink">{product.name}</td>
                  <td className="px-5 py-3.5 font-mono-data text-ink">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StockBar product={product} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
