FROM node:20-alpine

WORKDIR /app

# Build tools for better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts=false

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 8080

ENV PORT=8080 NODE_ENV=production

CMD ["node", "dist/server.js"]
