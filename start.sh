#!/bin/bash
set -e

echo "========================================"
echo "  CyberShield API - Starting Up"
echo "========================================"

cd Backend

export PORT="${PORT:-8000}"

if [ -d "/var/data" ]; then
    export DATABASE_PATH="/var/data/cybershield.db"
else
    export DATABASE_PATH="/tmp/cybershield.db"
fi

echo "Port: $PORT"
echo "Database: $DATABASE_PATH"

echo "Starting CyberShield API on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
