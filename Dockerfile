# syntax=docker/dockerfile:1

# Stage 1: install dependencies (including sequelize-cli for migrations)
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci \
    && npm install --no-save sequelize-cli@6.6.2

# Stage 2: build Next.js app
FROM node:20-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: production image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/DB ./DB

RUN mkdir -p /app/data/uploads/audio \
    && chown -R nextjs:nodejs /app

USER nextjs

CMD ["sh", "-c", "npx sequelize-cli db:migrate --env production && npm run start"]
