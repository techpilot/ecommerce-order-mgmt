export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled';

export interface OrderItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
}
