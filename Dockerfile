FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@11.10.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/ backend/
COPY prisma/ prisma/

WORKDIR /app/backend
RUN npx prisma generate
RUN pnpm run build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@11.10.0
# Add a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

RUN pnpm install --prod --frozen-lockfile --filter backend...

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/src/generated ./backend/src/generated

RUN chown -R appuser:appgroup /app
USER appuser

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
