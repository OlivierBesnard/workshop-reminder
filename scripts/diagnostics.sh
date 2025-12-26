#!/bin/bash

# Script de vérification et diagnostic de l'application

echo "════════════════════════════════════════════════════════════"
echo "   Diagnostic - Workshop Reminder"
echo "════════════════════════════════════════════════════════════"
echo ""

# Vérifier le service
echo "1. Statut du Service systemd"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo systemctl status workshop-reminder.service --no-pager
echo ""

# Vérifier Docker
echo "2. Conteneurs Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Vérifier PostgreSQL
echo "3. Connexion PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
export PGPASSWORD=postgres
if psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT 1" 2>/dev/null; then
    echo "✓ PostgreSQL est opérationnel"
    echo ""
    echo "Statistiques de la base:"
    psql -h 127.0.0.1 -U postgres -d postgres -c "
        SELECT 
            'maintenance_tasks' as table_name,
            count(*) as count
        FROM public.maintenance_tasks
        UNION ALL
        SELECT 
            'maintenance_logs',
            count(*)
        FROM public.maintenance_logs;"
else
    echo "✗ PostgreSQL n'est pas accessible"
fi
unset PGPASSWORD
echo ""

# Vérifier les logs
echo "4. Logs Récents (5 dernières lignes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo journalctl -u workshop-reminder.service -n 5 --no-pager
echo ""

# Vérifier l'accès HTTP
echo "5. Accès HTTP"
echo "━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:8082 > /dev/null; then
    echo "✓ Frontend accessible sur port 8082"
else
    echo "✗ Frontend non accessible sur port 8082"
fi
echo ""

# Vérifier l'utilisation des ressources
echo "6. Utilisation des Ressources"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Résumé
echo "════════════════════════════════════════════════════════════"
echo "   Fin du diagnostic"
echo "════════════════════════════════════════════════════════════"
