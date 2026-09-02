import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryClientService } from './inventory-client/inventory-client.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryClient: InventoryClientService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Product(s) not found: ${missing.join(', ')}`,
      );
    }

    const productById = new Map(products.map((p) => [p.id, p]));

    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
    const reservedSkus: string[] = [];

    // Reserved sequentially and deliberately: the inventory service only exposes a
    // one-way "reserve" endpoint (no compensating "release"), so if an item further
    // down the list fails, stock already decremented for earlier items in this loop
    // stays decremented. Acceptable for this exercise's scope; a production version
    // would add an idempotent release endpoint (or a saga/outbox) to unwind partial
    // reservations on failure.
    try {
      for (const item of dto.items) {
        const product = productById.get(item.productId)!;
        await this.inventoryClient.reserve(product.sku, item.quantity);
        reservedSkus.push(product.sku);

        totalAmount = totalAmount.add(product.price.mul(item.quantity));
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }
    } catch (err) {
      if (reservedSkus.length > 0) {
        this.logger.warn(
          `Order creation for user ${userId} failed after reserving stock for [${reservedSkus.join(', ')}]. ` +
            'These reservations were not rolled back (see InventoryClientService docstring).',
        );
      }
      throw err;
    }

    return this.prisma.order.create({
      data: {
        userId,
        customerName: dto.customerName,
        totalAmount,
        status: 'confirmed',
        items: { createMany: { data: orderItemsData } },
      },
      include: { items: { include: { product: true } } },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }
    return order;
  }
}
