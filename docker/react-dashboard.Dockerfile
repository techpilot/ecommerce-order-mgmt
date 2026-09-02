FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx build react-dashboard --configuration=production

FROM node:22-alpine AS runtime
COPY --from=build /workspace/dist/apps/react-dashboard /usr/share/nginx/html
EXPOSE 80
