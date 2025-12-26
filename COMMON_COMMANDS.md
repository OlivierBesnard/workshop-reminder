# 🔧 COMMANDES COURANTES

Référence rapide pour gérer l'application déployée.

## 📋 Statut et Logs

```bash
# Voir le statut du service
sudo systemctl status workshop-reminder

# Voir les logs en temps réel
sudo journalctl -u workshop-reminder -f

# Voir les 50 derniers logs
sudo journalctl -u workshop-reminder -n 50

# Voir les logs d'aujourd'hui
sudo journalctl -u workshop-reminder --since today

# Voir les erreurs
sudo journalctl -u workshop-reminder -p err
```

## 🚀 Démarrage/Arrêt

```bash
# Redémarrer le service
sudo systemctl restart workshop-reminder

# Arrêter le service
sudo systemctl stop workshop-reminder

# Redémarrer après arrêt
sudo systemctl start workshop-reminder

# Redémarrer tout (app + DB)
cd /opt/workshop-reminder
docker-compose restart
sudo systemctl restart workshop-reminder
```

## 🐳 Docker & PostgreSQL

```bash
# Voir les conteneurs Docker
docker ps

# Voir tous les conteneurs
docker ps -a

# Logs PostgreSQL
docker logs workshop-postgres

# Logs PostgreSQL en temps réel
docker logs -f workshop-postgres

# Voir les statistiques Docker
docker stats

# Redémarrer PostgreSQL
docker-compose -f /opt/workshop-reminder/docker-compose.yml restart postgres
```

## 🗄️ Base de Données

```bash
# Se connecter à PostgreSQL
psql -h 127.0.0.1 -U postgres -d postgres

# Voir les tables
psql -h 127.0.0.1 -U postgres -d postgres -c "\dt"

# Compter les tâches
psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT COUNT(*) FROM maintenance_tasks;"

# Voir toutes les tâches
psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT * FROM maintenance_tasks;"

# Voir l'historique
psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT * FROM maintenance_logs;"

# Faire une requête personnalisée
psql -h 127.0.0.1 -U postgres -d postgres -c "VOTRE_REQUETE"
```

## 💾 Sauvegarde et Restauration

```bash
# Sauvegarder la BD
bash /opt/workshop-reminder/scripts/backup.sh

# Lister les sauvegardes
ls -lh /opt/workshop-reminder/backups/

# Restaurer une sauvegarde
bash /opt/workshop-reminder/scripts/restore.sh /opt/workshop-reminder/backups/backup_YYYYMMDD_HHMMSS.sql
```

## 🔄 Mise à Jour

```bash
# Mettre à jour le code
cd /opt/workshop-reminder
git pull

# Installer les dépendances
npm install

# Reconstruire
npm run build

# Redémarrer
sudo systemctl restart workshop-reminder

# OU en une seule commande:
bash /opt/workshop-reminder/scripts/update.sh
```

## 🔍 Diagnostics

```bash
# Diagnostics complets
bash /opt/workshop-reminder/scripts/diagnostics.sh

# Vérifier les ports
sudo lsof -i :8082  # Frontend
sudo lsof -i :5432  # PostgreSQL

# Voir l'utilisation disque
df -h

# Voir l'utilisation mémoire
free -h

# Voir l'utilisation CPU
top -b -n 1 | head -20
```

## 📂 Navigation

```bash
# Aller au répertoire de l'application
cd /opt/workshop-reminder

# Voir les fichiers
ls -la

# Voir le contenu du .env
cat .env

# Voir le docker-compose
cat docker-compose.yml

# Voir les migrations
ls supabase/migrations/

# Voir les logs systemd
sudo tail -f /var/log/syslog | grep workshop-reminder
```

## 🛠️ Configuration

```bash
# Modifier les variables d'environnement
sudo nano /opt/workshop-reminder/.env

# Modifier docker-compose
sudo nano /opt/workshop-reminder/docker-compose.yml

# Voir le service systemd
sudo cat /etc/systemd/system/workshop-reminder.service

# Recharger systemd après modification
sudo systemctl daemon-reload

# Redémarrer le service après modification
sudo systemctl restart workshop-reminder
```

## 🌐 Test de Connectivité

```bash
# Tester le frontend
curl http://localhost:8082

# Tester PostgreSQL
psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT 1"

# Tester le port 8082
nc -zv 127.0.0.1 8082

# Ping un hôte
ping -c 5 google.com
```

## 📊 Performance

```bash
# Voir l'espace utilisé par Docker
docker system df

# Nettoyer Docker
docker system prune  # Demande confirmation
docker system prune -f  # Sans confirmation

# Voir la taille des volumes Docker
docker volume ls

# Voir les logs du disque
df -h | grep /opt

# Voir l'utilisation CPU du service
ps aux | grep npm
```

## 🔐 Permissions

```bash
# Donner la permission d'exécution aux scripts
chmod +x /opt/workshop-reminder/scripts/*.sh
chmod +x /opt/workshop-reminder/deploy-complete.sh

# Voir les permissions
ls -la /opt/workshop-reminder/scripts/

# Changer le propriétaire
sudo chown -R ubuntu:ubuntu /opt/workshop-reminder
```

## 🚨 Résolution de Problèmes

```bash
# Port déjà utilisé
sudo lsof -i :8082  # Voir quel processus utilise le port
kill -9 <PID>       # Tuer le processus

# Service ne démarre pas
sudo systemctl status workshop-reminder  # Voir l'erreur
sudo journalctl -u workshop-reminder -f  # Voir les logs

# PostgreSQL ne répond pas
docker ps | grep postgres  # Voir si le conteneur tourne
docker logs workshop-postgres  # Voir les erreurs

# Espace disque plein
df -h  # Voir l'utilisation
docker system prune -f  # Nettoyer Docker
journalctl --vacuum-size=100M  # Nettoyer les logs

# Redémarrage complet
sudo systemctl stop workshop-reminder
docker-compose -f /opt/workshop-reminder/docker-compose.yml down
docker-compose -f /opt/workshop-reminder/docker-compose.yml up -d
sleep 10
sudo systemctl start workshop-reminder
```

## 📝 Édition de Fichiers

```bash
# Éditer avec nano
sudo nano /opt/workshop-reminder/.env

# Éditer avec vi/vim
sudo vi /opt/workshop-reminder/.env

# Voir le contenu sans éditer
cat /opt/workshop-reminder/.env

# Voir les 10 premières lignes
head -10 /opt/workshop-reminder/.env

# Voir les 10 dernières lignes
tail -10 /opt/workshop-reminder/.env

# Chercher une chaîne
grep "VITE_" /opt/workshop-reminder/.env
```

## 🔄 Cycles de Vie

```bash
# Démarrage complet
sudo systemctl start workshop-reminder
docker-compose -f /opt/workshop-reminder/docker-compose.yml up -d

# Arrêt complet
sudo systemctl stop workshop-reminder
docker-compose -f /opt/workshop-reminder/docker-compose.yml down

# Redémarrage complet
sudo systemctl stop workshop-reminder
docker-compose -f /opt/workshop-reminder/docker-compose.yml down
docker-compose -f /opt/workshop-reminder/docker-compose.yml up -d
sleep 15
sudo systemctl start workshop-reminder
```

## 📋 Commandes Utiles Combines

```bash
# Voir l'état complet du système
echo "=== SERVICE ===" && systemctl status workshop-reminder --no-pager && \
echo "=== DOCKER ===" && docker ps --filter name=workshop && \
echo "=== LOGS (5 dernières) ===" && journalctl -u workshop-reminder -n 5 --no-pager

# Sauvegarder et redémarrer
bash /opt/workshop-reminder/scripts/backup.sh && \
cd /opt/workshop-reminder && git pull && npm install && npm run build && \
sudo systemctl restart workshop-reminder

# Vérifier la santé complète
bash /opt/workshop-reminder/scripts/diagnostics.sh
```

---

**Astuce**: Créez des alias pour les commandes fréquentes:

```bash
# Ajouter à ~/.bashrc
alias wr-logs='sudo journalctl -u workshop-reminder -f'
alias wr-status='sudo systemctl status workshop-reminder'
alias wr-restart='sudo systemctl restart workshop-reminder'
alias wr-stop='sudo systemctl stop workshop-reminder'
alias wr-db='psql -h 127.0.0.1 -U postgres'
alias wr-app='cd /opt/workshop-reminder'
```

Puis source le fichier:
```bash
source ~/.bashrc
```

Maintenant vous pouvez utiliser: `wr-logs`, `wr-status`, etc.
