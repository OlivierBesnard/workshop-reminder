#!/bin/bash

################################################################################
#
#  SETUP.SH - Installation initiale complète
#  
#  Ce script prépare une EC2 pour recevoir l'application
#
################################################################################

set -e

echo "🔧 Préparation de l'EC2..."

# Vérifier root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Exécuter avec: sudo bash setup.sh"
    exit 1
fi

# Mise à jour
apt-get update -qq
apt-get upgrade -y -qq

echo "✓ EC2 prête pour le déploiement"
echo ""
echo "Prochaine étape:"
echo "  sudo bash deploy-complete.sh"
