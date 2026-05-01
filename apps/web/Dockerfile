FROM node:20-alpine
WORKDIR /app

# Instalar dependências
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci

# Copiar código
COPY . .

# NEXT_PUBLIC_API_URL é necessário em build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

RUN npm run build --workspace=apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
