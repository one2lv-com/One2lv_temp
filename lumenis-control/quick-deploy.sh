#!/bin/bash

echo "🌌 LUMENIS Quick Deploy - Using Supabase Client Libraries"
echo "=========================================================="

# Step 1: Install Dependencies
echo ""
echo "[1/3] Installing dependencies..."
npm install

# Step 2: Setup Python
echo ""
echo "[2/3] Setting up Python backend..."
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
cd ..

# Step 3: Deploy Schema via Supabase Client
echo ""
echo "[3/3] Deploying database schema..."

python3 <<'EOF'
from supabase import create_client, Client
import os

url = "https://pplbxjguhmfeuptyamic.supabase.co"
key = "<SUPABASE_SERVICE_ROLE_JWT>"

supabase: Client = create_client(url, key)

# Read schema
with open('supabase-schema.sql', 'r') as f:
    schema = f.read()

print("📋 Executing schema statements...")

# Execute via RPC if available
try:
    result = supabase.rpc('exec_sql', {'query': schema}).execute()
    print("✅ Schema deployed via RPC")
except Exception as e:
    print(f"⚠️  RPC method not available: {e}")
    print("\n📝 Manual Step Required:")
    print("=" * 50)
    print("1. Go to: https://supabase.com/dashboard/project/pplbxjguhmfeuptyamic/sql")
    print("2. Create a new query")
    print("3. Copy contents of 'supabase-schema.sql'")
    print("4. Paste and run")
    print("=" * 50)

print("\n✅ Setup complete!")
EOF

echo ""
echo "=========================================================="
echo "🚀 Ready to Launch!"
echo ""
echo "Run: ./start-all.sh"
echo ""
echo "Or manually deploy schema:"
echo "  1. Visit: https://supabase.com/dashboard/project/pplbxjguhmfeuptyamic/sql"
echo "  2. Copy contents of 'supabase-schema.sql'"
echo "  3. Paste and execute"
echo "  4. Run: ./start-all.sh"
echo "=========================================================="
