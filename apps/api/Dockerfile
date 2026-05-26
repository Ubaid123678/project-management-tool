FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY tsconfig.base.json ./
RUN npm ci
COPY apps/api/prisma ./apps/api/prisma
RUN npm run db:generate -w @pmt/api
COPY apps/api/src ./apps/api/src
RUN npm run build -w @pmt/api

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/server.js"]
