import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryClientService } from './inventory-client/inventory-client.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    product: { findMany: jest.Mock };
    order: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock };
  };
  let inventoryClient: { reserve: jest.Mock; getStock: jest.Mock };

  const productA = {
    id: 'prod-a',
    sku: 'SKU-A',
    price: new Prisma.Decimal('10.00'),
  };
  const productB = {
    id: 'prod-b',
    sku: 'SKU-B',
    price: new Prisma.Decimal('5.50'),
  };

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn() },
      order: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    };
    inventoryClient = { reserve: jest.fn(), getStock: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryClientService, useValue: inventoryClient },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('reserves stock for every item, computes the total, and persists the order', async () => {
    prisma.product.findMany.mockResolvedValue([productA, productB]);
    inventoryClient.reserve.mockResolvedValue({
      sku: 'SKU-A',
      stockQuantity: 4,
      reserved: 1,
    });
    prisma.order.create.mockResolvedValue({ id: 'order-1' });

    const dto = {
      customerName: 'Amara Chukwu',
      items: [
        { productId: 'prod-a', quantity: 2 },
        { productId: 'prod-b', quantity: 3 },
      ],
    };

    await service.create('user-1', dto as never);

    // Reserved in order, against the SKU (not the internal productId).
    expect(inventoryClient.reserve).toHaveBeenNthCalledWith(1, 'SKU-A', 2);
    expect(inventoryClient.reserve).toHaveBeenNthCalledWith(2, 'SKU-B', 3);

    const createArg = prisma.order.create.mock.calls[0][0];
    // 2*10.00 + 3*5.50 = 36.50
    expect(createArg.data.totalAmount.toString()).toBe('36.5');
    expect(createArg.data.customerName).toBe('Amara Chukwu');
    expect(createArg.data.status).toBe('confirmed');
    expect(createArg.data.items.createMany.data).toHaveLength(2);
  });

  it('throws NotFoundException and never calls the inventory service when a product does not exist', async () => {
    prisma.product.findMany.mockResolvedValue([productA]); // only one of two requested ids found

    const dto = {
      customerName: 'Amara Chukwu',
      items: [
        { productId: 'prod-a', quantity: 1 },
        { productId: 'missing-id', quantity: 1 },
      ],
    };

    await expect(service.create('user-1', dto as never)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(inventoryClient.reserve).not.toHaveBeenCalled();
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('stops and rethrows on the first failed reservation without creating the order', async () => {
    prisma.product.findMany.mockResolvedValue([productA, productB]);
    inventoryClient.reserve
      .mockResolvedValueOnce({ sku: 'SKU-A', stockQuantity: 4, reserved: 1 }) // item A succeeds
      .mockRejectedValueOnce(new Error('Insufficient stock for SKU "SKU-B".')); // item B fails

    const dto = {
      customerName: 'Amara Chukwu',
      items: [
        { productId: 'prod-a', quantity: 1 },
        { productId: 'prod-b', quantity: 100 },
      ],
    };

    await expect(service.create('user-1', dto as never)).rejects.toThrow(
      'Insufficient stock',
    );
    expect(inventoryClient.reserve).toHaveBeenCalledTimes(2);
    // Known limitation: item A's reservation is not rolled back here (see service docstring).
    expect(prisma.order.create).not.toHaveBeenCalled();
  });
});
