# ---- Build stage ----
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install OS deps (optional but common)
RUN apk add --no-cache libc6-compat

# Leverage Docker layer caching: copy manifest files first
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install deps using the detected lockfile
# - prefers npm ci if package-lock.json present
# - otherwise pnpm or yarn if their lockfiles exist
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

# Copy the rest of the app
COPY . .

# Build (works for Vite `dist/` and CRA `build/`)
# You can pass ENV at build time, e.g.:
#   docker build --build-arg VITE_API_URL=https://api.example.com -t app .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN set -eux; \
    if [ -f package.json ]; then \
        if npm run | grep -q "build"; then npm run build; else echo "No build script"; fi; \
    fi

# Normalize build output to /out
RUN set -eux; \
    if [ -d dist ]; then cp -r dist /out; \
    elif [ -d build ]; then cp -r build /out; \
    else echo "ERROR: No dist/ or build/ directory found after build" && exit 1; fi


# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# Copy a basic SPA nginx config (handles client-side routing)
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Static files
COPY --from=builder /out /usr/share/nginx/html

# Non-root user for defense-in-depth (nginx image already uses 101)
USER 101

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
