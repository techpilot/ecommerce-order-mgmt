FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx build nest-api --configuration=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /workspace/dist/apps/nest-api ./
COPY --from=build /workspace/apps/nest-api/prisma ./prisma
RUN npm install --omit=dev --prefix .
EXPOSE 3000
CMD ["node", "main.js"]
