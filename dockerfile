# Dockerfile
# Base image ships Chromium + all its system deps pre-installed, needed
# because Songkick's bot protection 406s plain HTTP clients (axios/curl)
# on venue/artist pages - only a real browser engine gets through.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (skip re-downloading browsers, already in base image)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create logs and data directories
RUN mkdir -p logs data && chmod 755 logs data

# Run as the base image's existing non-root user (uid 1000, already set up
# for the Chromium sandbox) instead of a new one - it also happens to match
# the host uid that owns the bind-mounted logs/data volumes.
RUN chown -R pwuser:pwuser /usr/src/app
USER pwuser

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8888/health || exit 1

# Start application
CMD ["node", "src/index.js"]