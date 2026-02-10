FROM node:20-alpine

WORKDIR /app

# Copy workspace root package.json and package-lock
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/ ./server/

RUN npm install --workspace=server --workspace=shared

EXPOSE 3001

CMD ["npx", "-w", "server", "tsx", "src/index.ts"]
