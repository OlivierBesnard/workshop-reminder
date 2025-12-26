#!/bin/bash

# Script de sauvegarde de la base de données

echo "Sauvegarde de la base de données PostgreSQL..."

BACKUP_DIR="/opt/workshop-reminder/backups"
BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"

# Créer le répertoire de backup s'il n'existe pas
mkdir -p ${BACKUP_DIR}

# Effectuer la sauvegarde
echo "→ Sauvegarde en cours..."
export PGPASSWORD=postgres
pg_dump -h 127.0.0.1 -U postgres -d postgres > ${BACKUP_FILE}
unset PGPASSWORD

if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo "✓ Sauvegarde réussie"
    echo "  Fichier: ${BACKUP_FILE}"
    echo "  Taille: ${SIZE}"
else
    echo "✗ Erreur lors de la sauvegarde"
    exit 1
fi

# Afficher les 5 dernières sauvegardes
echo ""
echo "Sauvegardes existantes:"
ls -lh ${BACKUP_DIR}/backup_*.sql | tail -5
