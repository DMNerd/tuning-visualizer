# ---------- Build (Vite) ----------
FROM node:22-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
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
CMD ["--root","/public","--host","0.0.0.0","--port","8080","--page-fallback","/index.html"]
