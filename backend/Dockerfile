FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

# Install dependencies exclusively for the backend to prevent frontend devDeps bloat
RUN pnpm install --filter backend...

# Copy Prisma schema and code
COPY backend/prisma ./backend/prisma
COPY backend/tsconfig*.json ./backend/
COPY backend/src ./backend/src

# Generate Prisma Client and Build
WORKDIR /app/backend
RUN pnpm dlx prisma generate
RUN pnpm run build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

RUN pnpm install --prod --filter backend...

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/src/generated ./backend/src/generated

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
