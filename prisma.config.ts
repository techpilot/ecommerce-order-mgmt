import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'apps/nest-api/prisma/schema.prisma',

  migrations: {
    path: 'apps/nest-api/prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
