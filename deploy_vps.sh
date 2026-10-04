#!/bin/bash
# ==============================================================================
# 🚀 maeaco Full-Stack VPS 1-Click Automated Deployment Script
# ==============================================================================
# Hosts BOTH Frontend (Next.js on Port 3000) & Backend (FastAPI on Port 8000)
# on the SAME VPS Server with Caddy Automatic HTTPS SSL Certificates.
# ==============================================================================

set -e

echo "----------------------------------------------------------------------"
echo "🚀 Starting Full-Stack Automated Deployment (Frontend + Backend) for maeaco..."
echo "----------------------------------------------------------------------"

# 1. Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script as root (e.g. sudo bash deploy_vps.sh)"
  exit 1
fi

# Prompts for Domains
if [ -z "$FRONTEND_DOMAIN" ]; then
  read -p "Enter your Main/Frontend Domain (e.g. maeaco.com): " FRONTEND_DOMAIN
fi

if [ -z "$BACKEND_DOMAIN" ]; then
  read -p "Enter your Backend API Domain (e.g. api.maeaco.com): " BACKEND_DOMAIN
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
  POSTGRES_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 24)
  echo "🔑 Generated Secure PostgreSQL Password: $POSTGRES_PASSWORD"
fi

DB_NAME="maeaco_prod_db"
DB_USER="maeaco_admin"
ROOT_DIR=$(pwd)
FRONTEND_DIR="$ROOT_DIR/autonomous-marketing-frontend-main"

echo "📦 Installing system dependencies, Node.js, PostgreSQL & Redis..."
apt update && apt install -y curl debian-keyring debian-archive-keyring apt-transport-https python3 python3-pip python3-venv postgresql postgresql-contrib redis-server git

# Enable & Start Redis Server
systemctl start redis-server
systemctl enable redis-server

# Install Node.js 20.x (LTS) if not installed
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install Caddy Web Server if not installed
if ! command -v caddy &> /dev/null; then
    echo "🌐 Installing Caddy Web Server..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update && apt install -y caddy
fi

# 2. Setup PostgreSQL Database & User
echo "🗄️ Setting up PostgreSQL Database ($DB_NAME)..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$POSTGRES_PASSWORD';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 3. Setup Python Backend Environment
echo "🐍 Setting up Python Backend Virtual Environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create/Update Backend .env File
if [ ! -f ".env" ]; then
    cp .env.production.example .env
fi
PG_URL="postgresql://$DB_USER:$POSTGRES_PASSWORD@localhost:5432/$DB_NAME"
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$PG_URL|" .env
sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$BACKEND_DOMAIN|" .env
sed -i "s|^META_REDIRECT_URI=.*|META_REDIRECT_URI=https://$BACKEND_DOMAIN/api/v1/oauth/callback/meta|" .env

# 4. Setup Next.js Frontend Environment & Build
echo "⚛️ Building Next.js Frontend Application..."
cd "$FRONTEND_DIR"

cat <<EOF > .env.local
NEXT_PUBLIC_API_URL=https://$BACKEND_DOMAIN
NEXT_PUBLIC_META_REDIRECT_URI=https://$BACKEND_DOMAIN/api/v1/oauth/callback/meta
EOF

npm install
npm run build
cd "$ROOT_DIR"

# 5. Create Systemd Service for Backend (FastAPI on Port 8000)
echo "🛠️ Creating Backend Service (maeaco-backend.service)..."
cat <<EOF > /etc/systemd/system/maeaco-backend.service
[Unit]
Description=maeaco FastAPI Backend Service
After=network.target postgresql.service

[Service]
User=root
WorkingDirectory=$ROOT_DIR
ExecStart=$ROOT_DIR/venv/bin/python run_api.py
Restart=always
RestartSec=5
Environment=HOST=0.0.0.0
Environment=PORT=8000

[Install]
WantedBy=multi-user.target
EOF

# 6. Create Systemd Service for Frontend (Next.js on Port 3000)
echo "🛠️ Creating Frontend Service (maeaco-frontend.service)..."
cat <<EOF > /etc/systemd/system/maeaco-frontend.service
[Unit]
Description=maeaco Next.js Frontend Service
After=network.target

[Service]
User=root
WorkingDirectory=$FRONTEND_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable maeaco-backend maeaco-frontend
systemctl restart maeaco-backend maeaco-frontend

# 7. Configure Caddy Web Server for Dual Reverse Proxy & Auto-HTTPS
echo "🔒 Configuring Caddy Web Server for Dual Domains..."
cat <<EOF > /etc/caddy/Caddyfile
# Frontend Next.js Site
$FRONTEND_DOMAIN, www.$FRONTEND_DOMAIN {
    reverse_proxy 127.0.0.1:3000
}

# Backend FastAPI API Site
$BACKEND_DOMAIN {
    reverse_proxy 127.0.0.1:8000
}
EOF

systemctl restart caddy

echo "----------------------------------------------------------------------"
echo "✅ FULL-STACK VPS DEPLOYMENT COMPLETE!"
echo "----------------------------------------------------------------------"
echo "🌐 Frontend URL: https://$FRONTEND_DOMAIN"
echo "⚙️ Backend API URL: https://$BACKEND_DOMAIN"
echo "🗄️ PostgreSQL Database: $DB_NAME"
echo "🔒 SSL Certificates: Auto-issued by Caddy Server"
echo "🚀 Backend Status: active (systemctl status maeaco-backend)"
echo "🚀 Frontend Status: active (systemctl status maeaco-frontend)"
echo "----------------------------------------------------------------------"
