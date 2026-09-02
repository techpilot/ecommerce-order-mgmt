import { useState } from 'react';
import { Topbar } from '../../components/layout/topbar';
import { StockBar } from '../../components/orders/stock-bar';
import { Button } from '../../components/ui/button';
import { formatCurrency } from '../../lib/format';
import { AddProductModal } from './add-product-modal';
import { useProducts } from './use-products';

export function ProductsPage() {
  const { data: products = [], isLoading, isError } = useProducts();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <>
      <Topbar
        title="Products"
        description="Stock levels sync from the inventory service"
        action={<Button onClick={() => setIsAddOpen(true)}>Add product</Button>}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-faint">
                <th className="px-4 py-3 font-medium sm:px-5">SKU</th>
                <th className="px-4 py-3 font-medium sm:px-5">Name</th>
                <th className="px-4 py-3 font-medium sm:px-5">Price</th>
                <th className="px-4 py-3 font-medium sm:px-5">Stock</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-ink-faint"
                  >
                    Loading products…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-status-cancelled"
                  >
                    Couldn't load products.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-3.5 font-mono-data text-ink-soft sm:px-5">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink sm:px-5">
                      {product.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono-data text-ink sm:px-5">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <StockBar product={product} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && <AddProductModal onClose={() => setIsAddOpen(false)} />}
    </>
  );
}
