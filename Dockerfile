# Minimal Dockerfile for Node backend
# Uses Node 18 LTS and runs server.js as the start command

FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (package.json + package-lock.json)
# This allows Docker layer caching when dependencies don't change
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
