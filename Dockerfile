# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install Chromium dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Set environment variable for Playwright
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PLAYWRIGHT_BROWSERS_PATH=/usr/bin/chromium

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/config ./config
COPY --from=builder /app/blueprint ./blueprint
COPY --from=builder /app/agents ./agents
COPY --from=builder /app/parsers ./parsers
COPY --from=builder /app/output ./output
COPY --from=builder /app/rag ./rag
COPY --from=builder /app/services ./services
COPY --from=builder /app/mcp ./mcp
COPY --from=builder /app/frontend ./frontend

# Create necessary directories
RUN mkdir -p /app/data/cache /app/data/historico /app/output

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/blueprint/schema', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "web"]