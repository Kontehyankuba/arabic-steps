FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:26-alpine AS runtime
RUN echo "os-refresh 2026-11-28" && apk upgrade --no-cache
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
COPY --from=build /app/dist ./dist
COPY server.mjs ./
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
