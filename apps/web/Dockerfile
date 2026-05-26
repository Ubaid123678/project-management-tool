FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/vite.config.ts apps/web/.eslintrc.cjs ./apps/web/
COPY apps/web/index.html ./apps/web/
COPY tsconfig.base.json ./
RUN npm ci
COPY apps/web/src ./apps/web/src
RUN npm run build -w @pmt/web

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
