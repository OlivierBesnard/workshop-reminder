# 📁 Structure du Déploiement

## Fichiers de Déploiement Créés

### Scripts Principaux

```
deploy-complete.sh          🎯 SCRIPT PRINCIPAL - Tout en un (À exécuter)
  └── Installe tout automatiquement
      ├── Docker & Node.js
      ├── PostgreSQL via Docker
      ├── Migrations BD
      ├── Build de l'app
      └── Configuration systemd

setup.sh                    Initialisation simple (optionnel)
docker-compose.yml          Configuration PostgreSQL
.env.production            Variables d'environnement
Dockerfile                 Image Docker optional
```

### Scripts de Gestion (dans `scripts/`)

```
scripts/
├── start.sh               Redémarrer tous les services
├── stop.sh                Arrêter tous les services
├── diagnostics.sh         Vérifier l'état du système
├── update.sh              Mettre à jour l'application
├── backup.sh              Sauvegarder la base de données
└── restore.sh             Restaurer une sauvegarde
```

### Documentation

```
DEPLOYMENT.md              📖 Guide complet de déploiement
QUICK_START.md             ⚡ Guide rapide (3 commandes)
README_DEPLOYMENT.md       Cette documentation
```

## 🎯 Flux de Déploiement

### Phase 1: Installation (5-10 minutes)

```
┌─────────────────────────────────────────┐
│ EC2 Instance Ubuntu 20.04+              │
└─────────────────────────────────────────┘
           │
           ├─→ apt-get update/upgrade
           │
           ├─→ Installer Docker & Node.js 18
           │
           ├─→ Clone/Pull du code
           │
           ├─→ npm ci (dépendances)
           │
           └─→ Docker Compose up (PostgreSQL)
```

### Phase 2: Configuration BD (2-3 minutes)

```
┌─────────────────────────────────────────┐
│ PostgreSQL (Docker)                     │
│ Port: 5432                              │
└─────────────────────────────────────────┘
           │
           ├─→ CREATE TABLE maintenance_tasks
           │
           ├─→ CREATE TABLE maintenance_logs
           │
           └─→ INSERT sample data
```

### Phase 3: Application (1-2 minutes)

```
┌─────────────────────────────────────────┐
│ vite build                              │
│ npm run preview                         │
│ Port: 8082                              │
└─────────────────────────────────────────┘
           │
           └─→ systemd service créé et activé
```

## 📊 Architecture Finale

```
                    ┌──────────────────┐
                    │   Client Browser │
                    │  http://IP:8082  │
                    └────────┬─────────┘
                             │ HTTP/HTTPS
                    ┌────────▼─────────┐
                    │  Frontend        │
                    │  Port 8082       │
                    │  (Vite Preview)  │
                    └────────┬─────────┘
                             │ REST API
                    ┌────────▼─────────┐
                    │  PostgreSQL      │
                    │  Port 5432       │
                    │  (Docker)        │
                    └──────────────────┘
```

## 🔄 Services Systemd

```
/etc/systemd/system/workshop-reminder.service
├── Description: Workshop Reminder Application
├── Depends: network.target, docker.service
├── Executable: npm run preview
├── Port: 8082
├── Directory: /opt/workshop-reminder
├── User: root
├── Restart: always
└── Logs: journalctl -u workshop-reminder -f
```

## 📂 Répertories sur EC2

```
/opt/workshop-reminder/           ← App root
├── src/                          ← Code source React/TS
├── public/                       ← Assets statiques
├── supabase/
│   ├── migrations/              ← Scripts SQL
│   │   └── 20251210164958_*.sql ← Migration initiale
│   └── docker-compose.yml
├── dist/                        ← Build React (généré)
├── backups/                     ← Sauvegardes BD (généré)
├── package.json
├── docker-compose.yml
├── .env                         ← Variables d'env
└── vite.config.ts
```

## 🔐 Ports Utilisés

| Service        | Port  | Accès       | Status      |
|---|---|---|---|
| Frontend       | 8082  | Public      | ✅ Utilisé   |
| Backend        | 8081  | Internal    | ⏸️  Réservé  |
| PostgreSQL     | 5432  | Internal    | ✅ Docker   |
| PgAdmin        | 8083  | Public      | ⏸️  Optionnel|

## 🚀 Démarrage du Déploiement

### Option 1: Depuis votre machine locale

```bash
# Copier le script
scp deploy-complete.sh ubuntu@YOUR_EC2_IP:/tmp/

# Exécuter
ssh -i "votre-clé.pem" ubuntu@YOUR_EC2_IP \
  'sudo bash /tmp/deploy-complete.sh'
```

### Option 2: Sur l'EC2 directement

```bash
# SSH vers l'EC2
ssh -i "votre-clé.pem" ubuntu@YOUR_EC2_IP

# Exécuter
sudo bash deploy-complete.sh
```

### Option 3: Via Git

```bash
# Sur l'EC2
cd /tmp
git clone https://github.com/YOUR_USER/workshop-reminder.git
cd workshop-reminder
sudo bash deploy-complete.sh
```

## ✅ Vérification Post-Déploiement

```bash
# ✓ Frontend accessible
curl http://localhost:8082

# ✓ PostgreSQL prêt
psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT 1"

# ✓ Service actif
systemctl status workshop-reminder

# ✓ Données présentes
psql -h 127.0.0.1 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM maintenance_tasks"
```

## 📝 Variables Principales

| Variable | Valeur | Notes |
|---|---|---|
| APP_DIR | /opt/workshop-reminder | Répertoire racine |
| FRONTEND_PORT | 8082 | Port React |
| BACKEND_PORT | 8081 | Port réservé |
| DB_PORT | 5432 | PostgreSQL |
| DB_USER | postgres | Utilisateur |
| DB_PASS | postgres | Mot de passe |
| NODE_ENV | production | Mode production |

## 🔧 Maintenance

### Logs
```bash
# Application
journalctl -u workshop-reminder -f

# Docker/PostgreSQL
docker-compose -f /opt/workshop-reminder/docker-compose.yml logs -f
```

### Mises à jour
```bash
cd /opt/workshop-reminder
git pull
npm install
npm run build
systemctl restart workshop-reminder
```

### Backup/Restore
```bash
# Sauvegarde
bash /opt/workshop-reminder/scripts/backup.sh

# Restauration
bash /opt/workshop-reminder/scripts/restore.sh /path/to/backup.sql
```

---

**Déploiement entièrement automatisé!** 🎉
