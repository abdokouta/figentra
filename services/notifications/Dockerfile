# syntax=docker/dockerfile:1.7
# =============================================================================
# @file services/notifications/Dockerfile
# @description Production multi-stage image for @figentra/notifications.
#
# The repository uses pnpm as its package manager. Docker builds are frozen
# against the committed pnpm-lock.yaml and workspace catalog.
#
# @security No secrets are copied into the image. Runtime credentials are
# injected by the deployment platform.
# =============================================================================

FROM node:24.18.0-bookworm-slim AS build
WORKDIR /workspace

# Root and workspace manifests are copied before source for dependency caching.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps ./apps
COPY services ./services
COPY workers ./workers
COPY packages ./packages

# pnpm is the canonical package manager. Never use --no-frozen-lockfile, --force, or peer-resolution bypasses.
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate && pnpm install --frozen-lockfile --filter @figentra/notifications...

# Copy only the selected service source after dependency installation.
COPY services/notifications services/notifications
RUN pnpm --filter @figentra/notifications build
RUN pnpm prune --prod --ignore-scripts

FROM node:24.18.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy the workspace runtime graph and only the selected service artifact.
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages ./packages
COPY --from=build /workspace/services/notifications/dist ./dist
COPY --from=build /workspace/services/notifications/package.json ./package.json

USER node
EXPOSE 3000

# Every HTTP service must expose the standardized liveness endpoint.
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
