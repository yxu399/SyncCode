# Multi-stage build for SyncCode Client
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for all workspaces
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/

# Install all dependencies (yarn doesn't support selective workspace installs in nodeLinker mode)
RUN yarn install --immutable

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/client/node_modules ./packages/client/node_modules

# Copy source code
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client

# Build shared package first
WORKDIR /app/packages/shared
RUN yarn build

# Build client
WORKDIR /app/packages/client

# Set build-time environment variables
ARG REACT_APP_API_URL=http://localhost:5000
ARG REACT_APP_WS_URL=ws://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_WS_URL=$REACT_APP_WS_URL

RUN yarn build

# Stage 3: Production with Nginx
FROM nginx:alpine AS runner

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy Nginx configuration
COPY packages/client/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/packages/client/build /usr/share/nginx/html

# Create non-root user
RUN addgroup --system --gid 1001 nginx-custom && \
    adduser --system --uid 1001 --ingroup nginx-custom synccode && \
    chown -R synccode:nginx-custom /usr/share/nginx/html && \
    chown -R synccode:nginx-custom /var/cache/nginx && \
    chown -R synccode:nginx-custom /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R synccode:nginx-custom /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 80

# Labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.title="SyncCode Client" \
      org.opencontainers.image.description="Real-time collaborative code editor client" \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.vendor="SyncCode" \
      org.opencontainers.image.source="https://github.com/yourusername/collaborative-editor"

# Switch to non-root user
USER synccode

# Start Nginx
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
