// Isolates "what the API actually returns" from your existing Product/Order UI types.
import type { ApiProduct, ApiOrder } from '../types/api-types';
import type { Product, Order } from '../types';

const DEFAULT_LOW_STOCK_THRESHOLD = 15;

export function toProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    sku: api.sku,
    name: api.name,
    price: Number(api.price),
    stockQuantity: api.stockQuantity,
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  };
}

export function toOrder(api: ApiOrder): Order {
  return {
    id: api.id,
    customerName: api.customerName ?? 'Unknown customer',
    items: api.items.map((item) => ({
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: Number(item.priceAtPurchase),
    })),
    totalAmount: Number(api.totalAmount),
    status: api.status,
    createdAt: api.createdAt,
  };
}
