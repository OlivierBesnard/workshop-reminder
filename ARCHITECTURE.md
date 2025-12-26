# 🏗️ ARCHITECTURE - Workshop Reminder sur EC2

## 📐 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     EC2 Instance (Ubuntu)                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Systemd Services                      │  │
│  │                                                          │  │
│  │  workshop-reminder (npm run preview)                    │  │
│  │  ├─ Port: 8082                                          │  │
│  │  ├─ Process: Node.js                                    │  │
│  │  ├─ Auto-restart: Enabled                               │  │
│  │  └─ Logs: journalctl -u workshop-reminder              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Docker                             │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │     Container: workshop-postgres              │    │  │
│  │  │                                                │    │  │
│  │  │  PostgreSQL 15                                 │    │  │
│  │  │  ├─ Port: 5432                                │    │  │
│  │  │  ├─ User: postgres                            │    │  │
│  │  │  ├─ Password: postgres                        │    │  │
│  │  │  └─ Volumes:                                  │    │  │
│  │  │     ├─ postgres_data/ (persistant)           │    │  │
│  │  │     └─ migrations/ (auto-apply)              │    │  │
│  │  │                                                │    │  │
│  │  │  Tables:                                       │    │  │
│  │  │  ├─ maintenance_tasks                         │    │  │
│  │  │  └─ maintenance_logs                          │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Network Stack                         │  │
│  │                                                          │  │
│  │  ├─ Docker Network: workshop (bridge)                  │  │
│  │  ├─ Host Network: 0.0.0.0:8082 (frontend)            │  │
│  │  └─ Internal Network: postgres:5432                   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP/HTTPS
                              │
                    ┌─────────┴─────────┐
                    │  Client Browser  │
                    │                  │
                    │ http://IP:8082   │
                    └──────────────────┘
```

## 🔄 Flux de Requête

```
Client Browser
     │
     │ HTTP GET http://IP:8082/
     │
     ▼
Frontend (Vite)
     │ 192.168.X.X:8082
     │
     ├─ Sert HTML/CSS/JS
     │
     └─ Affiche l'interface React
           │
           │ API Calls (REST)
           │ (si backend présent)
           │
           ▼
PostgreSQL Database
     │ 127.0.0.1:5432
     │
     ├─ maintenance_tasks
     │  └─ SELECT * FROM maintenance_tasks
     │
     └─ maintenance_logs
        └─ INSERT INTO maintenance_logs
```

## 📦 Structure des Fichiers Déployés

```
/opt/workshop-reminder/
│
├─ Application React (Frontend)
│  ├─ src/
│  │  ├─ App.tsx                    (Composant principal)
│  │  ├─ main.tsx                   (Point d'entrée)
│  │  ├─ components/
│  │  │  ├─ TaskCard.tsx            (Affiche une tâche)
│  │  │  ├─ TaskFormDialog.tsx      (Formulaire)
│  │  │  ├─ StatusSummary.tsx       (Résumé statut)
│  │  │  ├─ Header.tsx              (En-tête)
│  │  │  └─ ui/                     (Composants ShadCN)
│  │  │
│  │  ├─ pages/
│  │  │  ├─ Index.tsx               (Page d'accueil)
│  │  │  ├─ Admin.tsx               (Page admin)
│  │  │  ├─ History.tsx             (Historique)
│  │  │  └─ NotFound.tsx            (404)
│  │  │
│  │  ├─ hooks/
│  │  │  └─ useTasks.ts             (Custom hook BD)
│  │  │
│  │  ├─ integrations/
│  │  │  └─ supabase/
│  │  │     ├─ client.ts            (Connexion BD)
│  │  │     └─ types.ts             (Types TypeScript)
│  │  │
│  │  └─ lib/
│  │     └─ utils.ts                (Utilitaires)
│  │
│  ├─ dist/                          (Build produit)
│  │  ├─ index.html
│  │  ├─ assets/
│  │  │  ├─ js/
│  │  │  ├─ css/
│  │  │  └─ fonts/
│  │  └─ ...
│  │
│  ├─ public/                        (Ressources statiques)
│  │  └─ robots.txt
│  │
│  └─ package.json                   (Dépendances Node.js)
│
├─ Database (PostgreSQL)
│  │
│  └─ supabase/
│     ├─ config.toml                (Config Supabase)
│     │
│     ├─ migrations/                (Scripts SQL)
│     │  └─ 20251210164958_*.sql   (Migration initiale)
│     │     ├─ CREATE TABLE maintenance_tasks
│     │     ├─ CREATE TABLE maintenance_logs
│     │     ├─ ALTER TABLE ... ENABLE RLS
│     │     ├─ CREATE POLICIES
│     │     └─ INSERT INTO ... (données initiales)
│     │
│     └─ docker-compose.yml         (Config Docker)
│
├─ Configuration
│  ├─ .env                          (Variables d'environnement)
│  ├─ vite.config.ts               (Config Vite)
│  ├─ tsconfig.json                (Config TypeScript)
│  ├─ tailwind.config.ts           (Config Tailwind)
│  ├─ postcss.config.js            (Config PostCSS)
│  ├─ components.json              (Config ShadCN)
│  └─ eslint.config.js             (Config ESLint)
│
├─ Déploiement
│  ├─ docker-compose.yml           (Service Docker)
│  ├─ Dockerfile                   (Image Docker optional)
│  ├─ deploy-complete.sh           (Script principal)
│  ├─ setup.sh                     (Initialisation)
│  ├─ validate.sh                  (Validation)
│  │
│  ├─ scripts/
│  │  ├─ start.sh                  (Démarrage)
│  │  ├─ stop.sh                   (Arrêt)
│  │  ├─ diagnostics.sh            (Diagnostics)
│  │  ├─ update.sh                 (Mise à jour)
│  │  ├─ backup.sh                 (Sauvegarde BD)
│  │  └─ restore.sh                (Restauration BD)
│  │
│  └─ Documentation/
│     ├─ DEPLOYMENT.md             (Guide complet)
│     ├─ QUICK_START.md            (Démarrage rapide)
│     ├─ README_DEPLOYMENT.md      (Structure)
│     ├─ DEPLOYMENT_SUMMARY.md     (Résumé)
│     ├─ ARCHITECTURE.md           (Cet fichier)
│     └─ README.md                 (Doc générale)
│
└─ Runtime Data
   ├─ backups/                      (Sauvegardes BD)
   │  └─ backup_YYYYMMDD_HHMMSS.sql
   │
   └─ logs/                         (Journaux)
      └─ journalctl
```

## 🔐 Sécurité

### Row Level Security (RLS)
```sql
-- Activé sur les tables
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Anyone can view active tasks"
  ON public.maintenance_tasks FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tasks"
  ON public.maintenance_tasks FOR INSERT WITH CHECK (true);
```

### Environment Variables
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1...
```

### Docker Isolation
- PostgreSQL s'exécute dans un conteneur isolé
- Réseau Docker interne
- Volume persistent pour les données

## 🚀 Processus de Déploiement

```
1. Script Launch
   └─ deploy-complete.sh (bash)
      │
      ├─ System Update
      │  ├─ apt-get update
      │  └─ apt-get upgrade
      │
      ├─ Install Dependencies
      │  ├─ Docker Engine
      │  ├─ Docker Compose
      │  └─ Node.js 18
      │
      ├─ Prepare Application
      │  ├─ Clone/Pull Code
      │  ├─ npm ci
      │  ├─ Configure .env
      │  └─ Setup docker-compose
      │
      ├─ Start Database
      │  ├─ docker-compose up -d
      │  ├─ Wait for PostgreSQL
      │  └─ Apply Migrations
      │
      ├─ Build Frontend
      │  ├─ npm run build
      │  └─ Generate dist/
      │
      └─ Start Services
         ├─ Create systemd service
         ├─ systemctl start
         └─ Verify Status
```

## 🔄 Services Systemd

```
/etc/systemd/system/workshop-reminder.service

[Unit]
Description=Workshop Reminder Application
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/workshop-reminder
Environment="NODE_ENV=production"
ExecStart=npm run preview -- --host 0.0.0.0 --port 8082
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 📊 Performance

### Startup Time
- Total: ~5-10 minutes (first run)
- Subsequent: ~1-2 minutes
- PostgreSQL ready: ~15 seconds

### Resource Usage
- Frontend: ~50 MB RAM (Vite)
- PostgreSQL: ~200 MB RAM
- Total: ~250-300 MB

### Scalability
- Single instance sufficient for workshop
- Can be expanded with load balancer if needed

## 🛠️ Maintenance Hooks

### Backup Schedule
```bash
# Daily backup at midnight
0 0 * * * /opt/workshop-reminder/scripts/backup.sh
```

### Log Rotation
```bash
# systemd handles journalctl rotation automatically
journalctl --vacuum-size=500M
```

### Updates
```bash
# Weekly updates
0 3 * * 0 cd /opt/workshop-reminder && git pull && npm install && npm run build && systemctl restart workshop-reminder
```

## 📈 Monitoring

### Key Metrics
- Service uptime
- Database connection pool
- API response times
- Disk usage
- Memory usage
- CPU usage

### Log Sources
```bash
# Application logs
journalctl -u workshop-reminder -f

# Docker logs
docker-compose logs -f

# PostgreSQL logs
docker logs workshop-postgres -f

# System logs
dmesg
```

## 🔗 Dependencies Graph

```
Browser
  │
  └─→ Vite Frontend (Port 8082)
       │
       ├─→ React 18
       ├─→ TypeScript
       ├─→ ShadCN UI Components
       ├─→ Tailwind CSS
       └─→ Supabase Client
            │
            └─→ PostgreSQL (Port 5432)
                 │
                 └─→ PostgreSQL 15
                      │
                      ├─→ maintenance_tasks table
                      └─→ maintenance_logs table
```

## 📝 Configuration Files Reference

| Fichier | Rôle | Modifié | Notes |
|---------|------|---------|-------|
| package.json | Dépendances | Non | Généré par npm |
| vite.config.ts | Config Vite | Oui | Ports dynamiques |
| .env.production | Variables | Oui | Config déploiement |
| docker-compose.yml | Docker | Oui | PostgreSQL config |
| supabase/migrations/ | BD Schema | Oui | Tables & données |
| deploy-complete.sh | Déploiement | Oui | Automation |
| DEPLOYMENT.md | Documentation | Oui | Guides |

## 🎯 Checklist d'Architecture

- ✅ Frontend: React + Vite sur port 8082
- ✅ Backend: PostgreSQL sur port 5432
- ✅ Service: Systemd avec auto-restart
- ✅ Database: Migrations automatiques
- ✅ Logs: Centralisés avec journalctl
- ✅ Security: RLS activé
- ✅ Backup: Scripts inclus
- ✅ Monitoring: Diagnostics script

---

**Architecture complète et production-ready!** ✅
