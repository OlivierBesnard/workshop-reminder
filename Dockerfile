FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci --omit=dev

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Exposer le port
EXPOSE 8082

# Lancer l'application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8082"]
