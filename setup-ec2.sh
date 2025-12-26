#!/bin/bash

# Script de setup complet pour EC2
# Gère Docker, PostgreSQL sur port personnalisé, génère mot de passe sécurisé

set -e

echo "🚀 Setup Fulfiller sur EC2 - Démarrage"
echo "========================================"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_PORT=${1:-5433}
APP_DIR="./fulfiller-app"
ENV_FILE=".env.production"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Générer un mot de passe sécurisé
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Port PostgreSQL: $POSTGRES_PORT"
echo "Répertoire app: $APP_DIR"
echo "Mot de passe généré: ✓ (stocké dans $ENV_FILE)"
echo ""

# Étape 1: Arrêter les conteneurs existants
echo -e "${YELLOW}🛑 Étape 1: Arrêt des conteneurs existants...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Conteneurs arrêtés${NC}"
echo ""

# Étape 2: Créer/mettre à jour .env.production
echo -e "${YELLOW}📝 Étape 2: Configuration des variables d'environnement...${NC}"
cat > "$ENV_FILE" << EOF
# Production environment (pour EC2)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fulfiller
DB_USER=postgres
DB_PASSWORD=$POSTGRES_PASSWORD
PORT=3565
NODE_ENV=production

# Supabase (optionnel)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
EOF
echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
echo ""

# Étape 3: Créer/mettre à jour docker-compose.yml
echo -e "${YELLOW}🐳 Étape 3: Configuration Docker Compose...${NC}"
cat > "$DOCKER_COMPOSE_FILE" << 'COMPOSE_EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: fulfiller-db
    environment:
      POSTGRES_DB: fulfiller
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_EXTERNAL_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - fulfiller-network
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: fulfiller-app
    ports:
      - "8082:5173"
      - "3565:3565"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: fulfiller
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      PORT: 3565
      NODE_ENV: production
      VITE_API_URL: http://localhost:3565
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - ./logs:/app/logs
    networks:
      - fulfiller-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3565/health"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  fulfiller-network:
    driver: bridge
COMPOSE_EOF
echo -e "${GREEN}✅ Docker Compose configuré${NC}"
echo ""

# Étape 4: Créer un fichier .env pour docker-compose
echo -e "${YELLOW}🔧 Étape 4: Configuration des variables Docker...${NC}"
cat > .env << EOF
DB_PASSWORD=$POSTGRES_PASSWORD
DB_EXTERNAL_PORT=$POSTGRES_PORT
EOF
echo -e "${GREEN}✅ Variables Docker configurées${NC}"
echo ""

# Étape 5: Vérifier les prérequis
echo -e "${YELLOW}🔍 Étape 5: Vérification des prérequis...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi
echo "Docker: $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi
echo "Docker Compose: $(docker-compose --version)"

echo -e "${GREEN}✅ Tous les prérequis sont ok${NC}"
echo ""

# Étape 6: Lancer docker-compose avec retry
echo -e "${YELLOW}🚀 Étape 6: Lancement des conteneurs...${NC}"
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose up -d --build; then
        echo -e "${GREEN}✅ Conteneurs lancés${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⚠️  Build échoué, tentative $RETRY_COUNT/$MAX_RETRIES...${NC}"
            sleep 5
        else
            echo -e "${RED}❌ Impossible de lancer les conteneurs après $MAX_RETRIES tentatives${NC}"
            exit 1
        fi
    fi
done
echo ""

# Étape 7: Attendre que PostgreSQL soit prêt
echo -e "${YELLOW}⏳ Étape 7: Attente du démarrage de PostgreSQL...${NC}"
for i in {1..30}; do
    if docker exec fulfiller-db pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL est prêt${NC}"
        break
    fi
    echo "Tentative $i/30..."
    sleep 2
done
echo ""

# Étape 8: Vérifier l'application
echo -e "${YELLOW}🔍 Étape 8: Vérification de l'application...${NC}"
sleep 3

if curl -s http://localhost:3565 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application est accessible${NC}"
else
    echo -e "${YELLOW}⏳ Application en cours de démarrage...${NC}"
    sleep 5
fi
echo ""

# Résumé final
echo -e "${GREEN}========================================"
echo "✅ SETUP TERMINÉ AVEC SUCCÈS!"
echo "========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Informations de connexion:${NC}"
echo "Frontend:   http://localhost:8082"
echo "Backend:    http://localhost:3565"
echo ""
echo -e "${YELLOW}🗄️  Données PostgreSQL:${NC}"
echo "Host:     localhost"
echo "Port:     $POSTGRES_PORT"
echo "Database: fulfiller"
echo "User:     postgres"
echo "Password: (voir $ENV_FILE)"
echo ""
echo -e "${YELLOW}🐳 Commandes utiles:${NC}"
echo "Voir les logs:      docker-compose logs -f"
echo "Arrêter:            docker-compose down"
echo "Redémarrer:         docker-compose restart"
echo "SSH PostgreSQL:     psql -h localhost -p $POSTGRES_PORT -U postgres -d fulfiller"
echo ""
echo -e "${YELLOW}📁 Fichiers générés:${NC}"
echo "  - $ENV_FILE (variables d'environnement)"
echo "  - .env (variables Docker)"
echo "  - $DOCKER_COMPOSE_FILE (configuration Docker)"
echo ""
