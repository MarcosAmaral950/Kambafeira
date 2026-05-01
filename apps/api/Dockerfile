FROM node:20-alpine
WORKDIR /app

# Instalar dependências (aproveita cache do Docker)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci

# Copiar código e compilar TypeScript
COPY . .
RUN npm run build --workspace=apps/api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
