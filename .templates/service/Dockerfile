# =============================================================================
# @file Dockerfile
# @description Multi-stage Dockerfile for the {{SLUG}} NestJS service.
#
#   Stages:
#     1. deps    — install production deps only (lockfile-driven).
#     2. build   — compile TypeScript via nest build (SWC).
#     3. runtime — minimal production image (node:24-alpine, no devDeps).
#
# @security
#   - Runs as non-root `node` user.
#   - No secrets baked into the image — runtime secrets come from Doppler.
#   - No dev tooling in the runtime stage.
# =============================================================================

# ── Stage 1: dependency install ──────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ── Stage 3: production runtime ──────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only production deps + compiled output.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Non-root user for security.
USER node

# Health check — the container platform probes this endpoint.
HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:{{PORT}}/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

EXPOSE {{PORT}}
CMD ["node", "dist/main.js"]
