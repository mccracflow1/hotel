# ── Stage 1: compilar la aplicación Angular ──────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Compilar en modo producción (usa environment.production.ts)
RUN npm run build -- --configuration production

# ── Stage 2: servir con nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Angular 17+ (application builder) genera en dist/<project>/browser/
COPY --from=builder /app/dist/admin-portal/browser /usr/share/nginx/html

# Configuración de nginx con proxy al backend y soporte SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1
