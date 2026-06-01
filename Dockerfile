FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

# # 1. 이미지 빌드
# docker build -t derguil/forum_docker_hub_repository:latest .

# # 2. Docker Hub에 푸시
# docker push derguil/forum_docker_hub_repository:latest

# # 3. 컨테이너에서 새 이미지 pull 후 재시작
# docker compose pull
# docker compose up -d