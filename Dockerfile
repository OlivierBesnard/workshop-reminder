# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Installer bun
RUN npm install -g bun

# Copier les fichiers
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

# Build frontend
RUN bun run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g bun

# Copier les dépendances
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

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
CMD ["bun", "run", "server.ts"]
