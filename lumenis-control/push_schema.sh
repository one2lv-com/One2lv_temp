#!/bin/bash

echo "🌌 LUMENIS Supabase SQL Pusher"
echo "------------------------------------------------"

# 1. Install PostgreSQL client if missing
if ! command -v psql &> /dev/null; then
    echo "📦 'psql' not found. Installing PostgreSQL client..."
    # Check if running in Termux
    if command -v pkg &> /dev/null; then
        pkg install postgresql -y
    # Check if running on standard Linux/Ubuntu
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install postgresql-client -y
    else
        echo "❌ Package manager not recognized. Please install 'psql' manually."
        exit 1
    fi
else
    echo "✅ PostgreSQL client is ready."
fi

# 2. Verify the SQL file exists
SQL_FILE="supabase-schema.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: $SQL_FILE not found in the current directory."
    echo "Make sure you are running this script from the project root."
    exit 1
fi

# 3. Prompt for the Supabase DB URL
echo ""
echo "🔑 We need your direct Supabase Database Connection URI."
echo "   Find this in your Supabase Dashboard: "
echo "   Settings -> Database -> Connection String -> URI"
echo "   (Make sure to replace [YOUR-PASSWORD] with your actual database password)"
echo ""
read -p "Paste Database URI: " DB_URI

if [ -z "$DB_URI" ]; then
    echo "❌ Process aborted. Database URI cannot be empty."
    exit 1
fi

# 4. Push the SQL Schema
echo ""
echo "🚀 Connecting to Supabase and pushing $SQL_FILE..."
psql "$DB_URI" -f "$SQL_FILE"

# 5. Check Result
if [ $? -eq 0 ]; then
    echo "------------------------------------------------"
    echo "✨ SUCCESS: Schema successfully pushed to Supabase!"
    echo "Your runtime_states and memory tables are ready."
else
    echo "------------------------------------------------"
    echo "❌ FAILED: There was an error pushing the schema."
    echo "Check your password, network connection, and ensure the URI is correct."
fi
