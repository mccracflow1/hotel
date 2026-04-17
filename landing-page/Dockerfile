# Landing page estática — servida por nginx
FROM nginx:1.27-alpine AS runtime

# Copiar todos los archivos estáticos de la landing
COPY . /usr/share/nginx/html

# Configuración de nginx con proxy al backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1
