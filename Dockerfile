# Use Node.js alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install Python and necessary build tools for pdf-parse
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY docker-processor/ ./docker-processor/

# Create input and output directories
RUN mkdir -p /app/input /app/output

# Set executable permissions
RUN chmod +x /app/docker-processor/process.js

# Command to run the processor
CMD ["node", "/app/docker-processor/process.js"]