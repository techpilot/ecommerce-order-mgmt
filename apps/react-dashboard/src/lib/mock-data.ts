import type { Order, Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', sku: 'SKU-001', name: 'Wireless Mouse', price: 24.99, stockQuantity: 50, lowStockThreshold: 15 },
  { id: '2', sku: 'SKU-002', name: 'Mechanical Keyboard', price: 89.0, stockQuantity: 30, lowStockThreshold: 15 },
  { id: '3', sku: 'SKU-003', name: 'USB-C Hub', price: 34.5, stockQuantity: 75, lowStockThreshold: 20 },
  { id: '4', sku: 'SKU-004', name: '27in Monitor', price: 249.0, stockQuantity: 15, lowStockThreshold: 15 },
  { id: '5', sku: 'SKU-005', name: 'Webcam 1080p', price: 45.0, stockQuantity: 40, lowStockThreshold: 20 },
  { id: '9', sku: 'SKU-009', name: 'Ergonomic Chair', price: 320.0, stockQuantity: 10, lowStockThreshold: 12 },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_8f21c4',
    customerName: 'Amara Chukwu',
    items: [
      { productName: 'Mechanical Keyboard', sku: 'SKU-002', quantity: 1, unitPrice: 89.0 },
      { productName: 'Wireless Mouse', sku: 'SKU-001', quantity: 2, unitPrice: 24.99 },
    ],
    totalAmount: 138.98,
    status: 'pending',
    createdAt: '2026-09-01T09:12:00Z',
  },
  {
    id: 'ord_7a93e0',
    customerName: 'David Okafor',
    items: [{ productName: '27in Monitor', sku: 'SKU-004', quantity: 1, unitPrice: 249.0 }],
    totalAmount: 249.0,
    status: 'confirmed',
    createdAt: '2026-09-01T08:47:00Z',
  },
  {
    id: 'ord_6c10b8',
    customerName: 'Ngozi Umeh',
    items: [{ productName: 'Ergonomic Chair', sku: 'SKU-009', quantity: 1, unitPrice: 320.0 }],
    totalAmount: 320.0,
    status: 'shipped',
    createdAt: '2026-08-31T16:20:00Z',
  },
  {
    id: 'ord_5d84f2',
    customerName: 'Tunde Bakare',
    items: [{ productName: 'USB-C Hub', sku: 'SKU-003', quantity: 3, unitPrice: 34.5 }],
    totalAmount: 103.5,
    status: 'cancelled',
    createdAt: '2026-08-31T11:05:00Z',
  },
  {
    id: 'ord_4b62a1',
    customerName: 'Fatima Bello',
    items: [
      { productName: 'Webcam 1080p', sku: 'SKU-005', quantity: 1, unitPrice: 45.0 },
      { productName: 'Wireless Mouse', sku: 'SKU-001', quantity: 1, unitPrice: 24.99 },
    ],
    totalAmount: 69.99,
    status: 'confirmed',
    createdAt: '2026-08-31T09:30:00Z',
  },
];
