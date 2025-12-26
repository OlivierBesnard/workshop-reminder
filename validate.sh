#!/bin/bash

################################################################################
#
#  validate.sh - Valider que le projet est prêt pour le déploiement
#
################################################################################

set -e

ERRORS=0
WARNINGS=0

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 - MANQUANT"
        ((ERRORS++))
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Dossier $1"
        return 0
    else
        echo -e "${RED}✗${NC} Dossier $1 - MANQUANT"
        ((ERRORS++))
        return 1
    fi
}

check_json() {
    if command -v node &> /dev/null; then
        node -e "JSON.parse(require('fs').readFileSync('$1', 'utf8'))" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} $1 - JSON valide"
            return 0
        else
            echo -e "${RED}✗${NC} $1 - JSON invalide"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${YELLOW}⚠${NC} Node.js non trouvé, validation JSON skippée"
        ((WARNINGS++))
        return 0
    fi
}

# Header
print_header "VALIDATION - Workshop Reminder Deployment"

# 1. Vérifier les fichiers principaux
echo -e "${YELLOW}1. Fichiers Principaux${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "package.json"
check_file "vite.config.ts"
check_file "tsconfig.json"
check_file "index.html"
check_file "src/App.tsx"
check_file "src/main.tsx"
echo ""

# 2. Vérifier les dossiers
echo -e "${YELLOW}2. Dossiers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_dir "src"
check_dir "src/components"
check_dir "src/pages"
check_dir "src/hooks"
check_dir "public"
check_dir "supabase"
check_dir "supabase/migrations"
echo ""

# 3. Vérifier les fichiers de déploiement
echo -e "${YELLOW}3. Scripts de Déploiement${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "deploy-complete.sh"
check_file "docker-compose.yml"
check_file ".env.production"
check_file "supabase/docker-compose.yml"
echo ""

# 4. Vérifier les migrations
echo -e "${YELLOW}4. Migrations Base de Données${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
    if [ $MIGRATION_COUNT -gt 0 ]; then
        echo -e "${GREEN}✓${NC} $MIGRATION_COUNT migration(s) trouvée(s)"
        ls supabase/migrations/*.sql | while read f; do
            echo "  - $(basename $f)"
        done
    else
        echo -e "${RED}✗${NC} Aucune migration trouvée"
        ((ERRORS++))
    fi
fi
echo ""

# 5. Vérifier la configuration JSON
echo -e "${YELLOW}5. Validation des Fichiers JSON${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_json "package.json"
check_json "tsconfig.json"
echo ""

# 6. Vérifier les dépendances critiques
echo -e "${YELLOW}6. Dépendances Critiques (package.json)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dependency() {
    if grep -q "\"$1\"" package.json; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 - MANQUANT"
        ((ERRORS++))
        return 1
    fi
}

check_dependency "react"
check_dependency "typescript"
check_dependency "vite"
check_dependency "@supabase/supabase-js"
echo ""

# 7. Vérifier les scripts npm
echo -e "${YELLOW}7. Scripts NPM${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_script() {
    if grep -q "\"$1\"" package.json; then
        echo -e "${GREEN}✓${NC} npm run $1"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} npm run $1 - manquant (optionnel)"
        ((WARNINGS++))
        return 1
    fi
}

check_script "build"
check_script "dev"
check_script "preview"
echo ""

# 8. Vérifier les fichiers d'environnement
echo -e "${YELLOW}8. Configuration d'Environnement${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production existe"
    # Vérifier les variables critiques
    if grep -q "VITE_SUPABASE_URL" .env.production; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL configurée"
    else
        echo -e "${YELLOW}⚠${NC} VITE_SUPABASE_URL manquante"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} .env.production - MANQUANT"
    ((ERRORS++))
fi
echo ""

# 9. Vérifier les permissions des scripts
echo -e "${YELLOW}9. Permissions des Scripts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -x "deploy-complete.sh" ]; then
    echo -e "${GREEN}✓${NC} deploy-complete.sh exécutable"
else
    echo -e "${YELLOW}⚠${NC} deploy-complete.sh non exécutable (sera dans git)"
fi
echo ""

# 10. Vérifier la structure des composants
echo -e "${YELLOW}10. Composants React${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
COMPONENT_COUNT=$(ls src/components/*.tsx src/components/*.ts 2>/dev/null | wc -l)
echo -e "${GREEN}✓${NC} $COMPONENT_COUNT fichier(s) composant(s)"
echo ""

# Résumé final
print_header "RÉSUMÉ DE LA VALIDATION"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ TOUT EST BON! Prêt pour le déploiement 🚀${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  ✓ Validation réussie avec $WARNINGS avertissement(s)${NC}"
    echo -e "${YELLOW}  La déploiement devrait fonctionner${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ $ERRORS erreur(s) détectée(s)${NC}"
    echo -e "${RED}  Veuillez corriger avant le déploiement${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    exit 1
fi
