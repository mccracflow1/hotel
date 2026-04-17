# ── Stage 1: instalar dependencias de producción ─────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# sharp necesita binarios nativos; instalar dependencias de compilación solo en esta etapa
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: imagen final (~180 MB) ──────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Usuario sin privilegios
RUN addgroup -S hotel && adduser -S hotel -G hotel

# Copiar dependencias ya compiladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente (el .dockerignore excluye lo innecesario)
COPY . .

# Crear directorios de almacenamiento local de medios
RUN mkdir -p storage/public/originals storage/public/thumbnails \
    && chown -R hotel:hotel /app

# Script de entrada: ejecuta migraciones y arranca el servidor
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER hotel

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
