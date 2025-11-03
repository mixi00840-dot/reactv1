# Multi-stage Dockerfile for Mixillo Backend (Node.js + Express)
# Base with apt to install ffmpeg for media-related features
FROM node:18-bullseye-slim AS base

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Install system dependencies (ffmpeg for fluent-ffmpeg; tini for proper PID 1)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg tini \
  && rm -rf /var/lib/apt/lists/*

# Only copy package manifests first for better caching
COPY package*.json ./

# Install prod dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Create uploads directories (ephemeral in container; prefer S3 for persistence)
RUN mkdir -p uploads/avatars uploads/documents uploads/products uploads/sounds uploads/stores uploads/temp uploads/videos || true

# Expose port
EXPOSE 5000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start the server
CMD ["node", "src/server-simple.js"]
