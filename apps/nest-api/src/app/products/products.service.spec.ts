import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('creates a product', async () => {
    const dto = {
      name: 'Widget',
      sku: 'SKU-1',
      price: 9.99,
      stockQuantity: 10,
    };
    prisma.product.create.mockResolvedValue({ id: 'p1', ...dto });

    const result = await service.create(dto);

    expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
    expect(result).toEqual({ id: 'p1', ...dto });
  });

  it('paginates and reports totalPages correctly', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    prisma.product.count.mockResolvedValue(25);

    const result = await service.findAll({ page: 2, limit: 10 });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('applies search and price-range filters', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.count.mockResolvedValue(0);

    await service.findAll({
      page: 1,
      limit: 10,
      search: 'mouse',
      minPrice: 10,
      maxPrice: 50,
    });

    const whereArg = prisma.product.findMany.mock.calls[0][0].where;
    expect(whereArg.name).toEqual({ contains: 'mouse', mode: 'insensitive' });
    expect(whereArg.price).toEqual({ gte: 10, lte: 50 });
  });

  it('throws NotFoundException for a missing product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates an existing product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Old' });
    prisma.product.update.mockResolvedValue({ id: 'p1', name: 'New' });

    const result = await service.update('p1', { name: 'New' });

    expect(result).toEqual({ id: 'p1', name: 'New' });
  });

  it('removes an existing product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.product.delete.mockResolvedValue({});

    const result = await service.remove('p1');

    expect(result).toEqual({ success: true });
  });
});
