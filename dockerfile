# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies for native modules
RUN apk add --no-cache \
    bash \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs && chmod 755 logs

# Create non-root user for security
RUN addgroup -g 1001 -S playlister && \
    adduser -S playlister -u 1001 -G playlister

# Change ownership of app directory
RUN chown -R playlister:playlister /usr/src/app

# Switch to non-root user
USER playlister

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8888/health || exit 1

# Start application
CMD ["node", "src/index.js"]