FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/

RUN pnpm install --filter frontend...

COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN pnpm run build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app/frontend

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
