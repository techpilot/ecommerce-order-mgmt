import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InventoryClientService } from './inventory-client/inventory-client.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>(
          'INVENTORY_SERVICE_URL',
          'http://localhost:5000',
        ),
        timeout: 5000, // fail fast rather than hang the order request on a stuck downstream call
        maxRedirects: 0,
      }),
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, InventoryClientService],
  exports: [OrdersService],
})
export class OrdersModule {}
