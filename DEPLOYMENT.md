# Guide de Déploiement sur AWS EC2

## ✅ Architecture

```
┌─────────────────────────────────────┐
│         Client (React)              │
│         :3000 (dev)                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│       Nginx (Reverse Proxy)         │
│         :80 (HTTP)                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│      Express.js Backend             │
│         :3565                       │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│      PostgreSQL (Docker)            │
│        :5432                        │
└─────────────────────────────────────┘
```

## 🚀 Déploiement Rapide (Localement d'abord)

### 1. **Setup local avec Docker**

```bash
# Installer les dépendances
bun install

# Démarrer tout (BD + API + Frontend)
docker-compose up

# L'application sera disponible sur http://localhost:3565
```

### 2. **Test en mode développement**

```bash
# Terminal 1 - Backend
bun run server

# Terminal 2 - Frontend
bun run dev
```

## 🌍 Déploiement sur AWS EC2

### Préalables

1. **Instance EC2** (Amazon Linux 2 ou Ubuntu)
2. **Clé SSH** (.pem file)
3. **Security Group** ouvert sur les ports 22, 80, 443, 3565
4. **GitHub Repository** (code poussé)

### Configuration de l'EC2

```bash
# 1. Se connecter
ssh -i "your-key.pem" ec2-user@your-ec2-ip

# 2. Installer Docker
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 3. Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Cloner le projet
git clone https://github.com/YOUR_USERNAME/fulfiller.git
cd fulfiller
```

### Déploiement automatisé

```bash
# Sur votre machine locale
chmod +x deploy.sh
./deploy.sh
# Le script vous demandera: EC2_USER, EC2_HOST, EC2_KEY
```

Ou manuellement :

```bash
# Sur l'EC2
cd fulfiller

# Créer .env.production avec les credentials sécurisés
cat > .env.production << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fulfiller
DB_USER=postgres
DB_PASSWORD=$(openssl rand -base64 32)
PORT=3565
NODE_ENV=production
EOF

cp .env.production .env

# Démarrer les conteneurs
docker-compose up -d

# Vérifier
docker-compose ps
curl http://localhost:3565/health
```

### Configurer Nginx (Reverse Proxy)

```bash
# Installer Nginx
sudo yum install -y nginx

# Créer la config
sudo tee /etc/nginx/conf.d/fulfiller.conf > /dev/null << 'EOF'
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
    }
}
EOF

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### SSL avec Let's Encrypt (Recommandé)

```bash
# Installer certbot
sudo yum install -y certbot python3-certbot-nginx

# Générer le certificat (remplacer votre-domaine.com)
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo systemctl start certbot-renew
```

## 📊 Gestion de l'Application

### Vérifier les logs

```bash
# Tous les services
docker-compose logs -f

# Juste le backend
docker-compose logs -f app

# Juste la BD
docker-compose logs -f postgres
```

### Redémarrer

```bash
# Redémarrer tous les conteneurs
docker-compose restart

# Rebuild et redémarrer
docker-compose up -d --build
```

### Backup de la BD

```bash
# Créer un backup
docker-compose exec postgres pg_dump -U postgres fulfiller > backup.sql

# Restaurer
docker-compose exec -T postgres psql -U postgres fulfiller < backup.sql
```

### Arrêter l'application

```bash
docker-compose down

# Avec suppression de la BD
docker-compose down -v
```

## 🔒 Points de sécurité

- [ ] Changer le mot de passe PostgreSQL
- [ ] Configurer les secrets dans AWS Secrets Manager
- [ ] Mettre en place des logs centralisés (CloudWatch)
- [ ] Configurer une politique de sauvegarde
- [ ] Utiliser HTTPS (Let's Encrypt)
- [ ] Limiter les accès SSH (Security Group)

## 📈 Scaling (Optionnel)

Pour augmenter la capacité :

1. **Auto-scaling**: Utiliser AWS Auto Scaling Group
2. **Load Balancer**: AWS ALB/NLB
3. **RDS**: Migrer PostgreSQL vers AWS RDS
4. **Cache**: Ajouter Redis
5. **CDN**: CloudFront pour les assets statiques

## 🆘 Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs app

# Vérifier la connexion DB
docker-compose exec app nc -zv postgres 5432
```

### Erreur de connexion DB

```bash
# Vérifier que PostgreSQL est up
docker-compose ps

# Redémarrer
docker-compose restart postgres
sleep 10
docker-compose restart app
```

### Port déjà utilisé

```bash
# Changer le port dans docker-compose.yml
# Ou tuer le processus
sudo lsof -i :3565
sudo kill -9 <PID>
```

## 📞 Support

Pour plus d'aide:
- Docs Docker: https://docs.docker.com
- Docs AWS EC2: https://docs.aws.amazon.com/ec2
- Issues GitHub: https://github.com/YOUR_USERNAME/fulfiller/issues
