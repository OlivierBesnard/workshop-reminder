# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install

COPY . .

# Build frontend
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copier les dépendances
COPY package.json package-lock.json* ./
RUN npm install --production

# Copier le build frontend
COPY --from=builder /app/dist ./public
COPY server.ts .

# Créer un dossier pour les logs
RUN mkdir -p logs

# Exposer le port
EXPOSE 3565

# Santé check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3565/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Démarrer l'application
CMD ["node", "server.ts"]
