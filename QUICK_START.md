# 🚀 GUIDE DE DÉPLOIEMENT RAPIDE

## En 3 Commandes

```bash
# 1. Copier les fichiers (déjà fait ou via git clone)
ssh ubuntu@votre-ip-ec2.com 'mkdir -p /opt/workshop-reminder'

# 2. Copier le script de déploiement
scp deploy-complete.sh ubuntu@votre-ip-ec2.com:/tmp/

# 3. Exécuter le déploiement
ssh ubuntu@votre-ip-ec2.com 'sudo bash /tmp/deploy-complete.sh'
```

## Ou en Une Seule Ligne

```bash
sudo bash deploy-complete.sh
```

## Points Clés

✅ **Frontend**: http://ip-ec2:8082  
✅ **PostgreSQL**: Automatiquement lancé via Docker  
✅ **Base de données**: Migrations appliquées automatiquement  
✅ **Service**: Workshop Reminder configuré en tant que service systemd  
✅ **Logs**: Accessible via `journalctl -u workshop-reminder -f`  

## Après le Déploiement

```bash
# Vérifier le statut
sudo systemctl status workshop-reminder

# Voir les logs
sudo journalctl -u workshop-reminder -f

# Arrêter/Redémarrer
sudo systemctl restart workshop-reminder
```

---

**Durée d'installation**: ~5 minutes  
**Temps d'attente**: Environ 15 sec pour que PostgreSQL soit prêt
