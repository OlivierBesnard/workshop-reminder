# Déploiement sur EC2 - Guide Complet

## 📋 Vue d'ensemble

Ce guide explique comment déployer l'application **Workshop Reminder** sur une instance EC2 AWS avec Supabase (PostgreSQL) en un seul script.

## 🚀 Déploiement Rapide

### 1. Connexion à votre EC2

```bash
ssh -i "votre-clé.pem" ubuntu@votre-ip-ec2.com
```

### 2. Exécuter le script de déploiement

```bash
# Cloner le dépôt (si pas déjà fait)
git clone https://github.com/YOUR_USER/workshop-reminder.git
cd workshop-reminder

# Rendre le script exécutable
chmod +x deploy-complete.sh

# Exécuter le script (avec sudo)
sudo bash deploy-complete.sh
```

⏱️ **Durée estimée**: 5-10 minutes selon votre connexion

## 📝 Détails du Déploiement

### Qu'est-ce que le script fait?

Le script `deploy-complete.sh` effectue automatiquement:

1. ✅ **Mise à jour du système** - apt-get update/upgrade
2. ✅ **Installation de Docker** - Pour Supabase (PostgreSQL)
3. ✅ **Installation de Node.js 18** - Pour l'application
4. ✅ **Création de la structure** - Dossiers et configurations
5. ✅ **Récupération du code** - Clone Git ou pull
6. ✅ **Installation des dépendances** - npm ci
7. ✅ **Configuration Supabase** - PostgreSQL via Docker
8. ✅ **Démarrage de PostgreSQL** - Docker Compose
9. ✅ **Application des migrations** - Structure de base de données
10. ✅ **Build de l'application** - vite build
11. ✅ **Configuration systemd** - Service automatique
12. ✅ **Lancement de l'application** - Port 8082

### Configuration des Ports

- **Frontend**: Port `8082` ✓ (Libre)
- **Backend**: Port `8081` (Pour utilisation future)
- **PostgreSQL**: Port `5432` (Interne)
- **PgAdmin**: Port `8083` (Optionnel, pour administration)

### Structure de Répertoires

```
/opt/workshop-reminder/
├── src/                          # Code source React/TypeScript
├── public/                        # Assets statiques
├── supabase/
│   ├── migrations/               # Scripts SQL
│   └── config.toml
├── package.json
├── vite.config.ts
├── docker-compose.yml            # Configuration PostgreSQL
├── .env                          # Variables d'environnement
└── dist/                         # Build React
```

## 🔄 Gestion de l'Application

### Démarrer/Arrêter

```bash
# Statut
sudo systemctl status workshop-reminder

# Redémarrer
sudo systemctl restart workshop-reminder

# Arrêter
sudo systemctl stop workshop-reminder

# Voir les logs
sudo journalctl -u workshop-reminder -f

# Voir les 50 dernières lignes
sudo journalctl -u workshop-reminder -n 50
```

### Gestion de PostgreSQL

```bash
# Statut de Docker
docker-compose -f /opt/workshop-reminder/docker-compose.yml ps

# Logs PostgreSQL
docker-compose -f /opt/workshop-reminder/docker-compose.yml logs -f postgres

# Accéder à PostgreSQL
psql -h 127.0.0.1 -U postgres -d postgres
```

### Mise à Jour du Code

```bash
cd /opt/workshop-reminder
git pull
npm install
npm run build
sudo systemctl restart workshop-reminder
```

## 🔐 Variables d'Environnement

Le fichier `.env` contient:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
NODE_ENV=production
VITE_FRONTEND_PORT=8082
VITE_BACKEND_PORT=8081
```

**Modifier si besoin**:
```bash
sudo nano /opt/workshop-reminder/.env
sudo systemctl restart workshop-reminder
```

## 🐛 Dépannage

### L'application ne se lance pas

```bash
# Vérifier les logs
sudo journalctl -u workshop-reminder -f

# Vérifier que Node.js est installé
node --version

# Vérifier que Docker fonctionne
docker ps
```

### PostgreSQL n'est pas accessible

```bash
# Vérifier Docker
docker-compose -f /opt/workshop-reminder/docker-compose.yml ps

# Redémarrer Docker Compose
cd /opt/workshop-reminder
docker-compose restart

# Attendre 15 secondes et tester
psql -h 127.0.0.1 -U postgres -d postgres
```

### Port 8082 déjà utilisé

```bash
# Trouver le processus
sudo lsof -i :8082

# Modifier le port dans:
sudo nano /opt/workshop-reminder/.env
# Changer VITE_FRONTEND_PORT=8082 vers 8084

# Redémarrer
sudo systemctl restart workshop-reminder
```

## 📊 Monitoring

### Vérifier l'utilisation des ressources

```bash
# CPU et mémoire
docker stats

# Espace disque
df -h

# Logs PostgreSQL
docker-compose -f /opt/workshop-reminder/docker-compose.yml logs -f postgres
```

## 🔄 Mise à Jour Supabase

Si vous devez ajouter des migrations:

1. Créer le fichier SQL dans `supabase/migrations/`
2. Exécuter:
```bash
export PGPASSWORD=postgres
psql -h 127.0.0.1 -U postgres -d postgres -f /opt/workshop-reminder/supabase/migrations/NOUVEAU_FICHIER.sql
```

## 🎯 Accès à l'Application

**URL**: `http://votre-ip-ec2.com:8082`

### Utilisateurs Par Défaut (via migrations)

Les tâches de maintenance sont chargées automatiquement depuis la migration SQL.

## 📞 Support

En cas de problème:

1. Vérifier les logs: `sudo journalctl -u workshop-reminder -f`
2. Vérifier Docker: `docker ps`
3. Vérifier PostgreSQL: `psql -h 127.0.0.1 -U postgres`
4. Redémarrer le service: `sudo systemctl restart workshop-reminder`

## 📚 Fichiers Importants

- **Script déploiement**: `deploy-complete.sh`
- **Configuration Docker**: `docker-compose.yml`
- **Migrations BD**: `supabase/migrations/`
- **Logs**: `/var/log/journal` (systemd)
- **Configuration app**: `.env`
- **Service systemd**: `/etc/systemd/system/workshop-reminder.service`

## ✅ Checklist Post-Déploiement

- [ ] Application accessible sur port 8082
- [ ] PostgreSQL opérationnel (5432)
- [ ] Migrations appliquées
- [ ] Données de démonstration visibles
- [ ] Service systemd configuré
- [ ] Logs sans erreurs

---

**Déploiement complet en une seule commande!** 🎉
