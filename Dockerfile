# ---- Build stage ----
FROM docker.io/library/node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Install deps with lockfile detection for caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable; corepack prepare pnpm@latest --activate; \
    pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    corepack enable; corepack prepare yarn@stable --activate; \
    yarn install --frozen-lockfile; \
  else \
    npm install; \
  fi

# App sources + build
COPY . .
RUN npm run build
RUN cp -r dist /out

# ---- Runtime stage ----
FROM docker.io/library/nginx:1.27-alpine AS runtime

# Prepare writable dirs for non-root nginx user
RUN set -eux; \
  mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx /run /run/nginx; \
  chown -R nginx:nginx /var/cache/nginx /var/run/nginx /var/log/nginx /run /etc/nginx

# Your SPA config MUST listen on 8080 inside the container
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Static files
COPY --from=builder /out /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

# Drop privileges (uid 101)
USER nginx

# Rootless-friendly port
EXPOSE 8080

# IMPORTANT: no custom pid override here (avoids duplicate 'pid' directive)
CMD ["nginx", "-g", "daemon off;"]
