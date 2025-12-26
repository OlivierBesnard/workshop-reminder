#!/bin/bash

# Script de mise à jour de l'application

echo "════════════════════════════════════════════════════════════"
echo "   Mise à Jour - Workshop Reminder"
echo "════════════════════════════════════════════════════════════"
echo ""

APP_DIR="/opt/workshop-reminder"

# Arrêter l'application
echo "→ Arrêt de l'application..."
sudo systemctl stop workshop-reminder.service
sleep 5

# Mettre à jour le code
echo "→ Récupération des mises à jour..."
cd ${APP_DIR}
git pull

# Installer les dépendances
echo "→ Installation des dépendances..."
npm ci --omit=dev -q

# Rebuild
echo "→ Construction de l'application..."
npm run build -q

# Redémarrer
echo "→ Redémarrage de l'application..."
sudo systemctl start workshop-reminder.service
sleep 5

# Vérifier le statut
if sudo systemctl is-active --quiet workshop-reminder.service; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "✓ Mise à jour réussie!"
    echo "════════════════════════════════════════════════════════════"
else
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "✗ Une erreur s'est produite"
    echo "════════════════════════════════════════════════════════════"
    sudo systemctl status workshop-reminder.service
fi
