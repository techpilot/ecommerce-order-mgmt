import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import request from 'supertest';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { InventoryClientService } from './inventory-client/inventory-client.service';
import { OrdersModule } from './orders.module';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

const TEST_USER = { userId: 'user-1', email: 'amara@example.com' };

/**
 * Minimal in-memory stand-in for PrismaService — just enough of the Product/Order
 * surface that OrdersService touches, so this test exercises the real HTTP stack
 * (guard -> pipe -> controller -> service) without needing a live Postgres.
 */
class FakePrismaService {
  private readonly products = [
    {
      id: 'prod-a',
      sku: 'SKU-A',
      name: 'Widget A',
      price: new Prisma.Decimal('10.00'),
    },
    {
      id: 'prod-b',
      sku: 'SKU-B',
      name: 'Widget B',
      price: new Prisma.Decimal('5.50'),
    },
  ];

  product = {
    findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
      this.products.filter((p) => where.id.in.includes(p.id)),
  };

  order = {
    create: async ({ data }: { data: Record<string, any> }) => ({
      id: 'order-123',
      userId: data.userId,
      customerName: data.customerName,
      totalAmount: data.totalAmount,
      status: data.status,
      createdAt: new Date().toISOString(),
      items: data.items.createMany.data.map((item: Record<string, any>) => ({
        ...item,
        product: this.products.find((p) => p.id === item.productId),
      })),
    }),
  };
}

class FakeInventoryClientService {
  reserve = jest
    .fn()
    .mockResolvedValue({ sku: 'SKU-A', stockQuantity: 9, reserved: 1 });
}

describe('Orders (integration)', () => {
  let app: INestApplication;
  let inventoryClient: FakeInventoryClientService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        OrdersModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useClass(FakePrismaService)
      .overrideProvider(InventoryClientService)
      .useClass(FakeInventoryClientService)
      .overrideGuard(JwtAccessGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = TEST_USER;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    inventoryClient = moduleRef.get(InventoryClientService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders reserves stock for each item and returns the persisted order', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerName: 'Amara Chukwu',
        items: [
          { productId: 'prod-a', quantity: 2 },
          { productId: 'prod-b', quantity: 1 },
        ],
      })
      .expect(201);

    expect(inventoryClient.reserve).toHaveBeenNthCalledWith(1, 'SKU-A', 2);
    expect(inventoryClient.reserve).toHaveBeenNthCalledWith(2, 'SKU-B', 1);

    expect(response.body).toMatchObject({
      id: 'order-123',
      customerName: 'Amara Chukwu',
      status: 'confirmed',
    });
    expect(response.body.items).toHaveLength(2);
  });

  it('POST /orders returns a validated 400 for an empty items array', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({ customerName: 'Amara Chukwu', items: [] })
      .expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
  });

  it('POST /orders returns 404 when a product does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerName: 'Amara Chukwu',
        items: [{ productId: 'does-not-exist', quantity: 1 }],
      })
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });
});
