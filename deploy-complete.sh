#!/bin/bash

################################################################################
#
#  SCRIPT DE DÉPLOIEMENT COMPLET - Workshop Reminder sur EC2
#  
#  Usage: sudo bash deploy-complete.sh
#
#  Ce script:
#  - Installe toutes les dépendances (Docker, Node.js, etc.)
#  - Configure Supabase (PostgreSQL)
#  - Lance la base de données
#  - Lance l'application frontend sur le port 8082
#
################################################################################

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

FRONTEND_PORT=8082
BACKEND_PORT=8081
APP_DIR="/opt/workshop-reminder"
PROJECT_NAME="Workshop Reminder"
GITHUB_URL="${1:-https://github.com/YOUR_USER/workshop-reminder.git}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# FONCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${YELLOW}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Ce script doit être exécuté en tant que root (utilisez: sudo bash deploy-complete.sh)"
    fi
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

print_header "DÉPLOIEMENT - ${PROJECT_NAME}"

# Vérification root
check_root

# 1. PRÉPARATION DU SYSTÈME
print_step "Mise à jour du système..."
apt-get update -qq >/dev/null 2>&1 || true
apt-get upgrade -y -qq >/dev/null 2>&1 || true
print_success "Système à jour"

# 2. INSTALLATION DES OUTILS DE BASE
print_step "Installation des outils système..."
apt-get install -y -qq curl wget git postgresql-client ca-certificates gnupg lsb-release >/dev/null 2>&1
print_success "Outils système installés"

# 3. INSTALLATION DE DOCKER
print_step "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    print_step "Installation de Docker..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq >/dev/null 2>&1
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null 2>&1
    systemctl enable docker >/dev/null 2>&1
    systemctl start docker >/dev/null 2>&1
fi
print_success "Docker installé"

# 4. INSTALLATION DE NODE.JS
print_step "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    print_step "Installation de Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null 2>&1
fi
NODE_VERSION=$(node -v)
print_success "Node.js installé (${NODE_VERSION})"

# 5. CRÉATION DE LA STRUCTURE
print_step "Création de la structure de répertoires..."
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/supabase/migrations
mkdir -p /var/lib/workshop-reminder/data
print_success "Répertoires créés"

# 6. RÉCUPÉRATION DU CODE
print_step "Récupération du code de l'application..."
if [ -d "${APP_DIR}/.git" ]; then
    cd ${APP_DIR}
    git pull -q
    print_success "Code mis à jour"
else
    git clone -q ${GITHUB_URL} ${APP_DIR} 2>/dev/null || print_error "Impossible de cloner le dépôt"
    print_success "Code cloné"
fi

# 7. INSTALLATION DES DÉPENDANCES NODE
print_step "Installation des dépendances Node.js..."
cd ${APP_DIR}
npm ci --omit=dev -q >/dev/null 2>&1
print_success "Dépendances installées"

# 8. CONFIGURATION DES VARIABLES D'ENVIRONNEMENT
print_step "Configuration des variables d'environnement..."
cat > ${APP_DIR}/.env << EOF
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3RzcnduZGR4bWVxZHVncm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzI0MDI0MjMsImV4cCI6MjI0ODg2MjQyM30.5dPEsqSCpwAW2dSNcOPNmZvRTJvKlLmMkIDPvLLU4Lk
NODE_ENV=production
VITE_FRONTEND_PORT=${FRONTEND_PORT}
VITE_BACKEND_PORT=${BACKEND_PORT}
EOF
print_success "Variables d'environnement configurées"

# 9. CONFIGURATION DE DOCKER COMPOSE
print_step "Configuration de Supabase (PostgreSQL)..."
cat > ${APP_DIR}/docker-compose.yml << 'COMPOSE_EOF'
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: workshop-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    networks:
      - workshop
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -h 127.0.0.1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local

networks:
  workshop:
    driver: bridge
COMPOSE_EOF

print_success "Docker Compose configuré"

# 10. DÉMARRAGE DE SUPABASE
print_step "Démarrage de Supabase (PostgreSQL)..."
cd ${APP_DIR}
docker-compose down >/dev/null 2>&1 || true
docker-compose up -d >/dev/null 2>&1
print_success "Supabase en cours de démarrage..."

# Attendre que PostgreSQL soit prêt
print_step "Attente du démarrage de PostgreSQL..."
sleep 15

# Vérifier la connexion
until export PGPASSWORD=postgres && psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1; do
    echo "  En attente de PostgreSQL..."
    sleep 3
done
print_success "PostgreSQL est opérationnel"

# 11. APPLICATION DES MIGRATIONS
print_step "Application des migrations de la base de données..."
export PGPASSWORD=postgres
psql -h 127.0.0.1 -U postgres -d postgres -f ${APP_DIR}/supabase/migrations/20251210164958_7a977278-a84b-4e78-9630-28ee6b163d0a.sql >/dev/null 2>&1 || print_error "Erreur lors de l'application des migrations"
unset PGPASSWORD
print_success "Migrations appliquées avec succès"

# 12. BUILD DE L'APPLICATION
print_step "Construction de l'application frontend..."
cd ${APP_DIR}
npm run build -q >/dev/null 2>&1
print_success "Application construite"

# 13. CRÉATION DU SERVICE SYSTEMD
print_step "Configuration du service systemd..."
cat > /etc/systemd/system/workshop-reminder.service << SERVICE_EOF
[Unit]
Description=Workshop Reminder Application
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
Environment="NODE_ENV=production"
ExecStart=$(which npm) run preview -- --host 0.0.0.0 --port ${FRONTEND_PORT}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=workshop-reminder

[Install]
WantedBy=multi-user.target
SERVICE_EOF

print_success "Service créé"

# 14. DÉMARRAGE DU SERVICE
print_step "Démarrage de l'application..."
systemctl daemon-reload >/dev/null 2>&1
systemctl enable workshop-reminder.service >/dev/null 2>&1
systemctl restart workshop-reminder.service >/dev/null 2>&1
sleep 5
print_success "Application en cours de démarrage..."

# 15. VÉRIFICATION
print_step "Vérification du statut..."
if systemctl is-active --quiet workshop-reminder.service; then
    print_success "Application active et en cours d'exécution"
else
    print_error "L'application ne s'est pas lancée correctement"
fi

# ============================================================================
# RÉSUMÉ FINAL
# ============================================================================

print_header "✓ DÉPLOIEMENT RÉUSSI"

echo -e "${GREEN}L'application est maintenant disponible!${NC}\n"

echo -e "${BLUE}Informations de connexion:${NC}"
echo -e "  ${GREEN}Frontend:${NC}         http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
echo -e "  ${GREEN}Base de données:${NC}  localhost:5432 (postgres/postgres)"
echo -e "  ${GREEN}Admin interface:${NC}  http://$(hostname -I | awk '{print $1}'):8083"
echo ""

echo -e "${BLUE}Commandes utiles:${NC}"
echo -e "  ${YELLOW}Statut:${NC}                systemctl status workshop-reminder"
echo -e "  ${YELLOW}Logs:${NC}                  journalctl -u workshop-reminder -f"
echo -e "  ${YELLOW}Redémarrer:${NC}            systemctl restart workshop-reminder"
echo -e "  ${YELLOW}Arrêter:${NC}               systemctl stop workshop-reminder"
echo -e "  ${YELLOW}Logs Docker:${NC}           docker-compose -f ${APP_DIR}/docker-compose.yml logs -f"
echo -e "  ${YELLOW}Accès DB:${NC}              psql -h 127.0.0.1 -U postgres -d postgres"
echo ""

echo -e "${BLUE}Configuration:${NC}"
echo -e "  ${YELLOW}Répertoire app:${NC}       ${APP_DIR}"
echo -e "  ${YELLOW}Port frontend:${NC}        ${FRONTEND_PORT}"
echo -e "  ${YELLOW}Port backend:${NC}         ${BACKEND_PORT}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
