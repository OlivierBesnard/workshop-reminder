#!/bin/bash

# Script de déploiement sur AWS EC2
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 Déploiement FulFiller sur EC2"

# Variables
EC2_USER=${EC2_USER:-"ec2-user"}
EC2_HOST=${EC2_HOST:-"your-ec2-ip"}
EC2_KEY=${EC2_KEY:-"your-key.pem"}
APP_DIR="/home/$EC2_USER/fulfiller"

echo "📦 Étape 1: Préparation..."

# Se connecter et configurer l'EC2
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
  # Mettre à jour le système
  sudo yum update -y
  
  # Installer Docker
  sudo yum install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  
  # Installer Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
  # Ajouter l'utilisateur au groupe docker
  sudo usermod -aG docker $USER
  
  # Installer Git
  sudo yum install -y git
  
  echo "✅ EC2 configurée"
EOF

echo "📥 Étape 2: Clonage du code..."

# Cloner le repository
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << EOF
  if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin main
  else
    git clone https://github.com/YOUR_USERNAME/fulfiller.git "$APP_DIR"
    cd "$APP_DIR"
  fi
EOF

echo "⚙️  Étape 3: Configuration..."

# Configurer les variables d'environnement
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << EOF
  cd "$APP_DIR"
  
  # Créer le fichier .env.production s'il n'existe pas
  if [ ! -f .env.production ]; then
    cat > .env.production << 'ENVFILE'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fulfiller
DB_USER=postgres
DB_PASSWORD=\$(openssl rand -base64 32)
PORT=3565
NODE_ENV=production
ENVFILE
  fi
EOF

echo "🐳 Étape 4: Démarrage des conteneurs..."

# Démarrer les conteneurs
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << EOF
  cd "$APP_DIR"
  
  # Créer le fichier .env pour docker-compose
  cp .env.production .env
  
  # Démarrer avec docker-compose
  docker-compose up -d
  
  # Attendre que l'application démarre
  sleep 10
  
  # Vérifier la santé
  curl http://localhost:3565/health || echo "Application en cours de démarrage..."
EOF

echo "🔒 Étape 5: Configuration Nginx (reverse proxy)..."

ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
  # Installer Nginx
  sudo yum install -y nginx
  
  # Configurer Nginx
  sudo tee /etc/nginx/conf.d/fulfiller.conf > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3565;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3565;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINX
  
  # Redémarrer Nginx
  sudo systemctl start nginx
  sudo systemctl enable nginx
EOF

echo "✅ Déploiement réussi!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurer un domaine/DNS"
echo "2. Installer Let's Encrypt SSL: sudo certbot --nginx -d your-domain.com"
echo "3. Vérifier les logs: ssh -i '$EC2_KEY' '$EC2_USER@$EC2_HOST' 'cd $APP_DIR && docker-compose logs -f'"
echo ""
echo "🌐 L'application est accessible à: http://$EC2_HOST"
