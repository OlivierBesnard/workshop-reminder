#!/bin/bash

# Script de démarrage complet de l'application et des services

echo "Démarrage de Workshop Reminder..."

# Démarrer Docker Compose
echo "→ Démarrage des conteneurs Docker (PostgreSQL)..."
cd /opt/workshop-reminder
docker-compose up -d
sleep 10

# Démarrer le service
echo "→ Démarrage du service systemd..."
sudo systemctl start workshop-reminder.service

echo "✓ Tous les services sont démarrés"
echo ""
echo "Application disponible sur: http://localhost:8082"
echo "Vérifier le statut:"
echo "  systemctl status workshop-reminder"
echo "  docker-compose ps"
