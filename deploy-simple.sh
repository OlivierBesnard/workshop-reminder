#!/bin/bash

# Script simple et complet de déploiement - À exécuter en tant que root

set -e

# Configuration
FRONTEND_PORT=8082
BACKEND_PORT=8081
APP_DIR="/opt/workshop-reminder"
PROJECT_GIT_URL="${PROJECT_GIT_URL:-https://github.com/YOUR_USER/workshop-reminder.git}"

echo "════════════════════════════════════════════════════════════"
echo "   Workshop Reminder - Script de Déploiement Complet"
echo "════════════════════════════════════════════════════════════"
echo ""

# Fonction pour afficher les messages
log_step() {
    echo ""
    echo "→ $1"
}

log_success() {
    echo "  ✓ $1"
}

log_error() {
    echo "  ✗ ERREUR: $1"
    exit 1
}

# 1. Vérifications préalables
log_step "1. Vérifications système"
if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en tant que root (utilisez sudo)"
fi

# 2. Mise à jour du système
log_step "2. Mise à jour du système"
apt-get update -qq
apt-get upgrade -y -qq
log_success "Système à jour"

# 3. Installation des dépendances
log_step "3. Installation des dépendances système"
apt-get install -y -qq \
    curl \
    wget \
    git \
    postgresql-client \
    ca-certificates \
    gnupg \
    lsb-release

log_success "Dépendances système installées"

# 4. Installation de Docker
log_step "4. Installation de Docker & Docker Compose"
if ! command -v docker &> /dev/null; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
fi
log_success "Docker installé"

# 5. Installation de Node.js 18
log_step "5. Installation de Node.js 18"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y -qq nodejs
fi
log_success "Node.js installé (version: $(node -v))"

# 6. Créer la structure de répertoires
log_step "6. Création de la structure de répertoires"
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/supabase/migrations
mkdir -p /var/lib/workshop-reminder/postgres

log_success "Répertoires créés"

# 7. Cloner ou mettre à jour le projet
log_step "7. Récupération du code de l'application"
if [ -d "${APP_DIR}/.git" ]; then
    cd ${APP_DIR}
    git pull
else
    git clone ${PROJECT_GIT_URL} ${APP_DIR}
fi
log_success "Code de l'application disponible"

# 8. Installation des dépendances Node.js
log_step "8. Installation des dépendances Node.js"
cd ${APP_DIR}
npm ci --omit=dev
log_success "Dépendances installées"

# 9. Créer les fichiers d'environnement
log_step "9. Configuration des variables d'environnement"
cat > ${APP_DIR}/.env.production << EOF
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3RzcnduZGR4bWVxZHVncm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzI0MDI0MjMsImV4cCI6MjI0ODg2MjQyM30.5dPEsqSCpwAW2dSNcOPNmZvRTJvKlLmMkIDPvLLU4Lk
NODE_ENV=production
VITE_FRONTEND_PORT=${FRONTEND_PORT}
VITE_BACKEND_PORT=${BACKEND_PORT}
EOF

cp ${APP_DIR}/.env.production ${APP_DIR}/.env
log_success "Variables d'environnement configurées"

# 10. Créer docker-compose pour Supabase
log_step "10. Configuration de Supabase"
cat > ${APP_DIR}/docker-compose.yml << 'DOCKEREOF'
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: workshop-postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ${PWD}/supabase/migrations:/docker-entrypoint-initdb.d
    networks:
      - workshop
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -h 127.0.0.1"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  workshop:
    driver: bridge
DOCKEREOF

log_success "Docker Compose configuré"

# 11. Démarrer Supabase
log_step "11. Démarrage de Supabase..."
cd ${APP_DIR}
docker-compose down 2>/dev/null || true
docker-compose up -d
log_success "Supabase en cours de démarrage..."
sleep 20

# 12. Appliquer les migrations
log_step "12. Application des migrations de base de données"
export PGPASSWORD=postgres
psql -h 127.0.0.1 -U postgres -d postgres -f ${APP_DIR}/supabase/migrations/20251210164958_7a977278-a84b-4e78-9630-28ee6b163d0a.sql 2>/dev/null || log_error "Impossible d'appliquer les migrations"
log_success "Migrations appliquées"

# 13. Builder l'application
log_step "13. Construction de l'application"
cd ${APP_DIR}
npm run build
log_success "Application construite"

# 14. Créer le service systemd pour le frontend
log_step "14. Configuration des services systemd"
cat > /etc/systemd/system/workshop-reminder.service << EOF
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

[Install]
WantedBy=multi-user.target
EOF

log_success "Services configurés"

# 15. Recharger systemd et démarrer les services
log_step "15. Démarrage des services"
systemctl daemon-reload
systemctl enable workshop-reminder.service
systemctl start workshop-reminder.service
sleep 5

log_success "Services démarrés"

# 16. Afficher les informations de connexion
echo ""
echo "════════════════════════════════════════════════════════════"
echo "   ✓ Déploiement terminé avec succès!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Accès à l'application:"
echo "  Frontend:    http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
echo "  Base de données: localhost:5432"
echo ""
echo "Commandes utiles:"
echo "  Voir les logs:        tail -f /var/log/journal"
echo "  Status services:      systemctl status workshop-reminder"
echo "  Arrêter l'app:        systemctl stop workshop-reminder"
echo "  Redémarrer:           systemctl restart workshop-reminder"
echo "  Logs Docker:          docker-compose -f ${APP_DIR}/docker-compose.yml logs -f"
echo ""
echo "Variables d'environnement:"
echo "  Frontend port:  ${FRONTEND_PORT}"
echo "  Backend port:   ${BACKEND_PORT}"
echo "════════════════════════════════════════════════════════════"
