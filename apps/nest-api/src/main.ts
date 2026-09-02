import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // URI-based versioning: routes are reachable at /api/v1/... . Controllers that
  // don't declare a @Version() default to v1, so existing routes keep working.
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: process.env.DASHBOARD_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce Order Management API')
    .setDescription(
      'NestJS API for products, orders and auth. Order creation calls out to the ' +
        '.NET inventory microservice to validate and decrement stock.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth')
    .addTag('products')
    .addTag('orders')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}/v1`);
  Logger.log(`📘 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();
