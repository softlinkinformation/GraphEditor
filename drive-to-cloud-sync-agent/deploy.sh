#!/bin/bash

# Drive to Cloud Storage Sync Agent - Deployment Script
# This script helps you deploy the agent quickly

set -e

echo "🚀 Drive to Cloud Storage Sync Agent - Deployment"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration"
    echo ""
    echo "Required steps:"
    echo "  1. Set GOOGLE_DRIVE_FOLDER_ID"
    echo "  2. Set GCS_PROJECT_ID"
    echo "  3. Set GCS_BUCKET_NAME"
    echo "  4. Place credentials in ./credentials/ directory"
    echo ""
    read -p "Press Enter after configuring .env file..."
fi

# Check if credentials directory exists
if [ ! -d "credentials" ]; then
    echo "📁 Creating credentials directory..."
    mkdir -p credentials
    echo "⚠️  Please place your credential files in ./credentials/"
    echo "   - google-drive-credentials.json"
    echo "   - gcs-service-account.json"
    echo ""
    read -p "Press Enter after placing credential files..."
fi

# Verify credentials exist
if [ ! -f "credentials/google-drive-credentials.json" ]; then
    echo "❌ Missing: credentials/google-drive-credentials.json"
    exit 1
fi

if [ ! -f "credentials/gcs-service-account.json" ]; then
    echo "❌ Missing: credentials/gcs-service-account.json"
    exit 1
fi

echo "✅ Credential files found"
echo ""

# Run test sync
echo "🧪 Running test sync..."
echo ""
npm test

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test sync successful!"
    echo ""
    echo "Deployment options:"
    echo ""
    echo "1. Run in foreground (for testing):"
    echo "   npm start"
    echo ""
    echo "2. Run in background with PM2:"
    echo "   npm install -g pm2"
    echo "   pm2 start sync-agent.js --name drive-sync-agent"
    echo "   pm2 save"
    echo "   pm2 startup"
    echo ""
    echo "3. Run with Docker:"
    echo "   docker-compose up -d"
    echo ""
    echo "4. Run as systemd service:"
    echo "   See SETUP.md for instructions"
    echo ""
    
    read -p "Start the agent now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting agent..."
        npm start
    fi
else
    echo ""
    echo "❌ Test sync failed. Please check the errors above and:"
    echo "   1. Verify your .env configuration"
    echo "   2. Check credential files are valid"
    echo "   3. Ensure APIs are enabled in GCP Console"
    echo "   4. Verify Drive folder is shared with service account"
    echo ""
    exit 1
fi
