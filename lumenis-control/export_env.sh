#!/bin/bash

echo "🌌 Exporting System Configuration to Drive..."

# Define the target Drive path
# Maps to Termux's shared storage gateway
DRIVE_TARGET="$HOME/storage/shared/∆Gemini_Root∆/Backups/Env_Configs"

# Ensure the directory exists
mkdir -p "$DRIVE_TARGET"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=".env.backup_$TIMESTAMP"

# Copy the file securely
if cp .env "$DRIVE_TARGET/$BACKUP_NAME"; then
    echo "------------------------------------------------"
    echo "✅ SECURE EXPORT COMPLETE"
    echo "📁 Destination: ∆Gemini_Root∆/Backups/Env_Configs/$BACKUP_NAME"
    echo "------------------------------------------------"
else
    echo "❌ Backup Failed. Make sure Termux has storage permissions (run 'termux-setup-storage')."
fi
