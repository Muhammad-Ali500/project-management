# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage: static files served by nginx ----
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -g 1001 -S appgroup \
    && adduser -u 1001 -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && chown -R appuser:appgroup /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R appuser:appgroup /var/run/nginx.pid

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
