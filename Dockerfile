# ---------- Build (Vite) ----------
FROM node:26-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
# Node 25+ no longer bundles corepack; install the pnpm pinned in packageManager
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")"
RUN pnpm install --frozen-lockfile
COPY . .
ARG BUILDTIME
ARG VERSION
ARG REVISION
ENV VITE_BUILDTIME=$BUILDTIME VITE_VERSION=$VERSION VITE_REVISION=$REVISION
RUN pnpm build

# ---------- Runtime (Static Web Server) ----------
FROM ghcr.io/static-web-server/static-web-server:latest
COPY --from=builder /app/dist /public
EXPOSE 8080
# NOTE: keep CMD on ONE line so linters don't misparse flags as instructions
CMD ["--root","/public","--host","0.0.0.0","--port","8080","--page-fallback","/index.html","--compression","true","--compression-static","true"]
