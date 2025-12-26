# Migration de Supabase à PostgreSQL

## Configuration PostgreSQL

### 1. Installer PostgreSQL
- **Windows**: Télécharger depuis [postgresql.org](https://www.postgresql.org/download/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE maintenance_db;

# Quitter
\q
```

### 3. Exécuter les migrations

```bash
# Depuis le répertoire du projet
psql -U postgres -d maintenance_db -f server/migrations/001_init_schema.sql
```

### 4. Configurer les variables d'environnement

Éditer le fichier `.env` :

```
VITE_API_URL="http://localhost:3000"

DB_USER="postgres"
DB_PASSWORD="your_password"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="maintenance_db"

API_PORT="3000"
```

### 5. Installation des dépendances

```bash
npm install
```

### 6. Lancer le serveur et l'app

**Option 1 : Deux terminaux**
```bash
# Terminal 1 - Serveur backend
npm run dev:server

# Terminal 2 - Frontend Vite
npm run dev
```

**Option 2 : Un terminal**
```bash
npm run dev:all
```

## Structure

- `/src` - Frontend React/Vite
- `/server` - Backend Express + PostgreSQL
- `/server/migrations` - Fichiers de migration SQL

## API Endpoints

- `GET /api/tasks` - Récupérer toutes les tâches
- `GET /api/tasks/active` - Récupérer les tâches actives
- `GET /api/logs` - Récupérer les logs de maintenance
- `POST /api/tasks` - Créer une tâche
- `POST /api/tasks/:id/complete` - Marquer une tâche comme complétée
- `PUT /api/tasks/:id` - Mettre à jour une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche
