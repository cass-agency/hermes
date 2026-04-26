FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ wget

COPY package*.json ./
RUN npm ci --production=false

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Prune dev dependencies
RUN npm prune --production

EXPOSE 8080

ENV PORT=8080 \
    NODE_ENV=production

CMD ["node", "dist/server.js"]
