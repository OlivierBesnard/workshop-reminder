#!/bin/bash

# Script de restauration de la base de données

BACKUP_FILE="${1}"
BACKUP_DIR="/opt/workshop-reminder/backups"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: ./restore.sh chemin/vers/backup.sql"
    echo ""
    echo "Sauvegardes disponibles:"
    ls -lh ${BACKUP_DIR}/backup_*.sql 2>/dev/null || echo "Aucune sauvegarde trouvée"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "✗ Erreur: Fichier de sauvegarde non trouvé: ${BACKUP_FILE}"
    exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "Restauration - Base de données"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  ATTENTION: Cette opération va remplacer la base de données actuelle"
echo "Fichier: ${BACKUP_FILE}"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non) " -n 3 -r
echo ""

if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "Opération annulée"
    exit 1
fi

echo ""
echo "→ Arrêt de l'application..."
sudo systemctl stop workshop-reminder.service
sleep 5

echo "→ Restauration en cours..."
export PGPASSWORD=postgres
psql -h 127.0.0.1 -U postgres -d postgres < "${BACKUP_FILE}"
unset PGPASSWORD

echo "→ Redémarrage de l'application..."
sudo systemctl start workshop-reminder.service
sleep 5

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✓ Restauration réussie"
echo "════════════════════════════════════════════════════════════"
