#!/bin/bash

# Script d'arrêt complet de l'application et des services

echo "Arrêt de Workshop Reminder..."

# Arrêter le service
echo "→ Arrêt du service systemd..."
sudo systemctl stop workshop-reminder.service

# Arrêter Docker Compose
echo "→ Arrêt des conteneurs Docker..."
cd /opt/workshop-reminder
docker-compose down

echo "✓ Tous les services sont arrêtés"
echo ""
echo "Pour redémarrer:"
echo "  sudo bash /opt/workshop-reminder/start.sh"
