#!/bin/bash

# Script de déploiement complet pour Workshop Reminder sur EC2
# Ce script configure Supabase, installe les dépendances et lance l'application

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=8082
BACKEND_PORT=8081
SUPABASE_DB_PORT=5432
APP_DIR="/opt/workshop-reminder"
SUPABASE_DIR="${APP_DIR}/supabase"

echo -e "${YELLOW}=== Déploiement de Workshop Reminder ===${NC}"

# Vérifier si l'application est déjà déployée
if [ -d "${APP_DIR}" ]; then
    echo -e "${YELLOW}Dossier d'application existe déjà. Nettoyage...${NC}"
    systemctl stop workshop-reminder-frontend 2>/dev/null || true
    systemctl stop workshop-reminder-backend 2>/dev/null || true
    systemctl stop supabase 2>/dev/null || true
fi

# 1. Créer le répertoire d'application
echo -e "${YELLOW}1. Création de la structure de répertoires...${NC}"
mkdir -p ${APP_DIR}
mkdir -p ${SUPABASE_DIR}/migrations
mkdir -p ${SUPABASE_DIR}/logs

# 2. Copier les fichiers de l'application (À faire manuellement ou via git clone)
echo -e "${YELLOW}2. L'application doit être copiée dans ${APP_DIR}${NC}"
echo -e "${YELLOW}   Continuez si vous avez déjà copié les fichiers...${NC}"

# 3. Installer Node.js et npm si non présents
echo -e "${YELLOW}3. Vérification des outils système...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}   Installation de Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}   Installation de Docker...${NC}"
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $(whoami)
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}   Installation de npm...${NC}"
    sudo apt-get install -y npm
fi

# 4. Installer les dépendances de l'application
echo -e "${YELLOW}4. Installation des dépendances Node.js...${NC}"
cd ${APP_DIR}
npm install

# 5. Créer le fichier d'environnement
echo -e "${YELLOW}5. Configuration des variables d'environnement...${NC}"
cat > ${APP_DIR}/.env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3RzcnduZGR4bWVxZHVncm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzI0MDI0MjMsImV4cCI6MjI0ODg2MjQyM30.5dPEsqSCpwAW2dSNcOPNmZvRTJvKlLmMkIDPvLLU4Lk

# Server Configuration
VITE_API_BASE_URL=http://localhost:${BACKEND_PORT}
VITE_FRONTEND_PORT=${FRONTEND_PORT}
VITE_BACKEND_PORT=${BACKEND_PORT}
VITE_DB_PORT=${SUPABASE_DB_PORT}

NODE_ENV=production
EOF

# 6. Configurer Supabase avec Docker
echo -e "${YELLOW}6. Configuration de Supabase via Docker...${NC}"

# Créer docker-compose pour Supabase
cat > ${SUPABASE_DIR}/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: workshop-reminder-db
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_INITDB_ARGS: "--locale=en_US.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - workshop-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: workshop-reminder-pgbouncer
    environment:
      PGBOUNCER_DATABASES: "postgres=host=postgres port=5432 dbname=postgres user=postgres password=postgres"
      PGBOUNCER_POOL_MODE: "transaction"
      PGBOUNCER_MAX_CLIENT_CONN: "1000"
      PGBOUNCER_DEFAULT_POOL_SIZE: "25"
    ports:
      - "6432:6432"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - workshop-network
    volumes:
      - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini

  # Supabase API Mock (simplifié)
  supabase-rest:
    image: node:18
    container_name: workshop-reminder-supabase-rest
    working_dir: /app
    command: node /app/supabase-rest-mock.js
    ports:
      - "54321:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./:/app
    networks:
      - workshop-network
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: postgres

volumes:
  postgres_data:
    driver: local

networks:
  workshop-network:
    driver: bridge
EOF

# 7. Créer un serveur REST mock pour Supabase
cat > ${SUPABASE_DIR}/supabase-rest-mock.js << 'EOF'
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
});

// REST API endpoints
app.get('/rest/v1/maintenance_tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.maintenance_tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/rest/v1/maintenance_tasks', async (req, res) => {
  try {
    const { title, description, frequency_days, next_due_date, is_active } = req.body;
    const result = await pool.query(
      'INSERT INTO public.maintenance_tasks (title, description, frequency_days, next_due_date, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, frequency_days, next_due_date, is_active !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/rest/v1/maintenance_logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.maintenance_logs ORDER BY completed_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/rest/v1/maintenance_logs', async (req, res) => {
  try {
    const { task_id, completed_by, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO public.maintenance_logs (task_id, completed_by, notes) VALUES ($1, $2, $3) RETURNING *',
      [task_id, completed_by, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Supabase REST API mock running on port 3000');
});
EOF

# 8. Créer la configuration pgbouncer
cat > ${SUPABASE_DIR}/pgbouncer.ini << 'EOF'
[databases]
postgres = host=postgres port=5432 dbname=postgres user=postgres password=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
max_user_connections = 100
server_lifetime = 3600
server_idle_timeout = 600
EOF

# 9. Installer les dépendances pour le serveur REST
echo -e "${YELLOW}7. Installation des dépendances Supabase...${NC}"
cd ${SUPABASE_DIR}
npm init -y 2>/dev/null || true
npm install express cors pg --save 2>/dev/null || true

# 10. Lancer Supabase via Docker Compose
echo -e "${YELLOW}8. Démarrage de Supabase...${NC}"
docker-compose -f ${SUPABASE_DIR}/docker-compose.yml down 2>/dev/null || true
docker-compose -f ${SUPABASE_DIR}/docker-compose.yml up -d

# Attendre que Supabase soit prêt
echo -e "${YELLOW}9. Attente du démarrage de la base de données...${NC}"
sleep 15

# 11. Appliquer les migrations
echo -e "${YELLOW}10. Application des migrations...${NC}"
PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -f ${APP_DIR}/supabase/migrations/20251210164958_7a977278-a84b-4e78-9630-28ee6b163d0a.sql

# 12. Builder l'application
echo -e "${YELLOW}11. Construction de l'application frontend...${NC}"
cd ${APP_DIR}
npm run build

# 13. Créer les services systemd
echo -e "${YELLOW}12. Configuration des services systemd...${NC}"

# Service pour le frontend
sudo tee /etc/systemd/system/workshop-reminder-frontend.service > /dev/null << EOF
[Unit]
Description=Workshop Reminder Frontend
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${APP_DIR}
ExecStart=$(which npm) run preview -- --host 0.0.0.0 --port ${FRONTEND_PORT}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Service pour Supabase
sudo tee /etc/systemd/system/supabase.service > /dev/null << EOF
[Unit]
Description=Supabase Database
After=network.target
Requires=docker.service
After=docker.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${SUPABASE_DIR}
ExecStart=$(which docker-compose) -f docker-compose.yml up
ExecStop=$(which docker-compose) -f docker-compose.yml down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 14. Recharger systemd et démarrer les services
echo -e "${YELLOW}13. Démarrage des services...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable supabase.service
sudo systemctl start supabase.service
sleep 5

sudo systemctl enable workshop-reminder-frontend.service
sudo systemctl start workshop-reminder-frontend.service

# 15. Afficher le statut
echo -e "${GREEN}=== Déploiement terminé ===${NC}"
echo -e "${GREEN}Frontend accessible sur: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}Supabase DB sur: localhost:${SUPABASE_DB_PORT}${NC}"
echo -e "${YELLOW}Vérifie le statut avec:${NC}"
echo "sudo systemctl status workshop-reminder-frontend"
echo "sudo systemctl status supabase"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "sudo journalctl -u workshop-reminder-frontend -f"
echo "sudo journalctl -u supabase -f"
