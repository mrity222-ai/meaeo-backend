#!/bin/bash
# ==============================================================================
# 🚀 maeaco 1-Click Docker Automated Deployment Script
# ==============================================================================
# Deploys FULL-STACK System (Frontend + Backend + Postgres + Redis + Caddy)
# in isolated Docker Containers with Automatic HTTPS SSL Certificates.
# ==============================================================================

set -e

echo "----------------------------------------------------------------------"
echo "🚀 Starting 1-Click Docker Deployment for maeaco..."
echo "----------------------------------------------------------------------"

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script as root (e.g. sudo bash deploy_docker.sh)"
  exit 1
fi

# Prompts for Domains
if [ -z "$FRONTEND_DOMAIN" ]; then
  read -p "Enter your Main/Frontend Domain (e.g. maeaco.com): " FRONTEND_DOMAIN
fi

if [ -z "$BACKEND_DOMAIN" ]; then
  read -p "Enter your Backend API Domain (e.g. api.maeaco.com): " BACKEND_DOMAIN
fi

# 1. Install Docker & Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker Engine & Docker Compose..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 2. Setup Production Environment (.env)
if [ ! -f ".env" ]; then
    echo "⚙️ Creating production .env from template..."
    cp .env.production.example .env
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
  POSTGRES_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 24)
fi

# Set Environment Variables for Docker Compose
export FRONTEND_DOMAIN="$FRONTEND_DOMAIN"
export BACKEND_DOMAIN="$BACKEND_DOMAIN"
export POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
export POSTGRES_USER="maeaco_admin"
export POSTGRES_DB="maeaco_prod_db"

sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$BACKEND_DOMAIN|" .env
sed -i "s|^META_REDIRECT_URI=.*|META_REDIRECT_URI=https://$BACKEND_DOMAIN/api/v1/oauth/callback/meta|" .env

# Write Docker deployment env file
cat <<EOF > .env.docker
FRONTEND_DOMAIN=$FRONTEND_DOMAIN
BACKEND_DOMAIN=$BACKEND_DOMAIN
POSTGRES_USER=maeaco_admin
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=maeaco_prod_db
EOF

# 3. Build & Launch Docker Containers
echo "🐳 Building & Starting Docker Containers..."
docker compose --env-file .env.docker up -d --build

echo "----------------------------------------------------------------------"
echo "✅ DOCKER DEPLOYMENT COMPLETE!"
echo "----------------------------------------------------------------------"
echo "🌐 Frontend URL: https://$FRONTEND_DOMAIN"
echo "⚙️ Backend API URL: https://$BACKEND_DOMAIN"
echo "🗄️ PostgreSQL Container: active"
echo "⚡ Redis Container: active"
echo "🔒 Caddy SSL: Automatic (Managed by Caddy Container)"
echo "----------------------------------------------------------------------"
echo "💡 To view container logs: docker compose logs -f"
echo "----------------------------------------------------------------------"
