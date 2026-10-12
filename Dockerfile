FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* bun.lock* ./

# Install npm dependencies
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend
RUN npm run build

# Expose Web & WebSocket port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start server with tsx
CMD ["npx", "tsx", "server.ts"]
