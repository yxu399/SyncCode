# Multi-stage build for SyncCode Server
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files for all workspaces
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install all dependencies
# Using frozen-lockfile instead of immutable for Docker compatibility
RUN yarn install --frozen-lockfile || yarn install

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Copy source code
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Build shared package first
WORKDIR /app/packages/shared
RUN yarn build

# Build server
WORKDIR /app/packages/server
RUN yarn build

# Generate Prisma Client
RUN npx prisma generate

# Stage 3: Production dependencies
FROM node:18-alpine AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files for all workspaces
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
# Using frozen-lockfile instead of immutable for Docker compatibility
RUN yarn install --frozen-lockfile --production || yarn install --production

# Stage 4: Runner
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 synccode

# Copy production dependencies
COPY --from=prod-deps --chown=synccode:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=synccode:nodejs /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=prod-deps --chown=synccode:nodejs /app/packages/server/node_modules ./packages/server/node_modules

# Copy built application
COPY --from=builder --chown=synccode:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=synccode:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=synccode:nodejs /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=synccode:nodejs /app/packages/server/package.json ./packages/server/
COPY --from=builder --chown=synccode:nodejs /app/packages/server/prisma ./packages/server/prisma

# Copy Prisma generated client
COPY --from=builder --chown=synccode:nodejs /app/packages/server/node_modules/.prisma ./packages/server/node_modules/.prisma

# Set user
USER synccode

# Set working directory to server
WORKDIR /app/packages/server

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Environment variables
ENV NODE_ENV=production \
    PORT=5000

# Expose port
EXPOSE 5000

# Labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.title="SyncCode Server" \
      org.opencontainers.image.description="Real-time collaborative code editor server" \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.vendor="SyncCode" \
      org.opencontainers.image.source="https://github.com/yourusername/collaborative-editor"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
