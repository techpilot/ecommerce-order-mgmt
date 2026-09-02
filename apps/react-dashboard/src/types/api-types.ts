export interface ApiPaginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiProduct {
  id: string;
  name: string;
  sku: string;
  price: string;
  stockQuantity: number;
}

export interface ApiOrderItem {
  quantity: number;
  priceAtPurchase: string;
  product: ApiProduct;
}

export interface ApiOrder {
  id: string;
  customerName: string | null;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  items: ApiOrderItem[];
  createdAt: string;
}
