# Astra CLI - Quick Reference Guide

## ✅ Installation Complete

**Version**: 0.6 (Legacy)
**Location**: `~/.astra/cli`
**Status**: Configured with your credentials

## Database Information

| Property | Value |
|----------|-------|
| **Database Name** | one2lvOS |
| **Database ID** | 9b5b1939-fd21-477d-95b8-a1aecc5f90b9 |
| **Region** | us-east-2 (AWS) |
| **Status** | ✅ ACTIVE |
| **Keyspace** | one2lvOS |
| **Collection** | aria_memory |

## Quick Commands

### Database Management

```bash
# List all databases
astra db list

# Show database details
astra db get one2lvOS

# List keyspaces
astra db list-keyspaces -id 9b5b1939-fd21-477d-95b8-a1aecc5f90b9

# Create a new keyspace (if needed)
astra db create-keyspace one2lvOS -id 9b5b1939-fd21-477d-95b8-a1aecc5f90b9 --keyspace one2lvOS

# Download secure connect bundle
astra db download-scb one2lvOS
```

### Configuration

```bash
# View current configuration
astra config list

# Show help
astra help

# Show specific command help
astra help db
```

### Token Management

```bash
# List tokens
astra token list

# Create new token
astra token create --role "Organization Administrator"

# Revoke token
astra token revoke <token-id>
```

### Organization Info

```bash
# Show organization details
astra org

# List users
astra user list

# List roles
astra role list
```

## Environment Variables

The Astra CLI uses your token from `.env.master`:

```env
ASTRA_DB_API_ENDPOINT=https://9b5b1939-fd21-477d-95b8-a1aecc5f90b9-us-east-2.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:wdhjJlzIvxbEWgIWnNApOWDA:...
ASTRA_DB_KEYSPACE=one2lvOS
COLLECTION_NAME=aria_memory
```

## Integration with Sovereign Architecture

The Astra CLI complements the Sovereign Architecture deployment:

### 1. Verify Database Before Deployment
```bash
# Check database is active
astra db list

# Ensure keyspace exists
astra db list-keyspaces -id 9b5b1939-fd21-477d-95b8-a1aecc5f90b9
```

### 2. Monitor During Operation
```bash
# Check database status
astra db get one2lvOS

# View organization usage
astra org
```

### 3. Backup and Recovery
```bash
# Download secure connect bundle for backup
astra db download-scb one2lvOS -d ~/backups/

# List available backups (if configured)
# Note: Automated backups are managed through Astra DB console
```

## Working with Vector Collections

While the Astra CLI v0.6 has limited vector collection support, you can manage collections via the API or console:

### Via Python (in your deployment)
```python
from astrapy import DataAPIClient

client = DataAPIClient(token)
db = client.get_database_by_api_endpoint(endpoint)

# List collections
collections = db.list_collection_names()
print(collections)

# Get collection info
collection = db.get_collection("aria_memory")
info = collection.info()
print(info)
```

### Via Astra DB Console
1. Go to https://astra.datastax.com
2. Select your database: **one2lvOS**
3. Navigate to Data Explorer
4. View/manage collections

## Common Tasks

### Create a New Collection
```python
# In Python (part of deployment)
collection = db.create_collection(
    "new_collection",
    dimension=1024,
    metric="cosine"
)
```

### Query Vector Data
```python
# Search by vector similarity
results = collection.find(
    {},
    sort={"$vector": query_vector},
    limit=5
)
```

### Insert Memory
```python
# Add new memory with vector
collection.insert_one({
    "$vector": embedding_vector,
    "content": "Memory content",
    "metadata": {"type": "conversation"}
})
```

## Troubleshooting

### CLI Not Found
```bash
# Add to PATH
export PATH=$PATH:~/.astra/cli

# Or reload shell config
source ~/.bashrc
```

### Authentication Issues
```bash
# Re-setup with new token
astra setup --token YOUR_NEW_TOKEN

# Verify configuration
astra config list
```

### Connection Problems
```bash
# Check database status
astra db list

# Verify token is valid
astra org
# If this fails, token may be expired
```

### Database Not Responding
1. Check status: `astra db list`
2. Verify region is correct: `us-east-2`
3. Check Astra DB console for maintenance
4. Try re-downloading secure connect bundle

## Advanced Usage

### Scripting with Astra CLI

Create automation scripts:

```bash
#!/bin/bash
# check-astra-status.sh

DB_STATUS=$(astra db list | grep "one2lvOS" | awk '{print $NF}')

if [ "$DB_STATUS" = "ACTIVE" ]; then
    echo "✅ Database is active"
    exit 0
else
    echo "❌ Database is not active: $DB_STATUS"
    exit 1
fi
```

### Monitoring Script

```bash
#!/bin/bash
# monitor-astra.sh

while true; do
    clear
    echo "=== Astra DB Status ==="
    astra db list
    echo ""
    echo "=== Organization Info ==="
    astra org
    sleep 30
done
```

## Security Best Practices

### Token Management
- ✅ **DO** rotate tokens regularly
- ✅ **DO** use different tokens for dev/prod
- ✅ **DO** keep tokens in `.env.master` (not in code)
- ❌ **DON'T** commit tokens to git
- ❌ **DON'T** share tokens in chat/email

### Access Control
- Use role-based tokens (Organization Admin, Database Admin, etc.)
- Revoke unused tokens immediately
- Monitor token usage in Astra console

## Upgrading to Astra CLI v1.0

The current installation is v0.6 (legacy). To upgrade to v1.0:

```bash
# Install new version
sh -c "$(curl -fsSL ibm.biz/get-astra-cli)"

# Verify new version
astra version

# Configure with token
astra config create --token YOUR_TOKEN
```

**Note**: v1.0 has breaking changes. Test thoroughly before upgrading production systems.

## Integration with Deployment Script

The deployment script (`deploy-sovereign.sh`) uses the Astra DB credentials from `.env.master`. The CLI provides additional management capabilities:

```bash
# Before deployment - verify database
astra db list

# Deploy system
./deploy-sovereign.sh

# During operation - monitor
astra db get one2lvOS

# After deployment - check logs
tail -f ∆Gemini_Root∆/logs/core.log
```

## Resources

### Official Documentation
- Astra DB Docs: https://docs.datastax.com/en/astra/
- CLI Reference: https://docs.datastax.com/en/astra-cli/
- Vector Search: https://docs.datastax.com/en/astra-db-serverless/

### Support
- Astra DB Console: https://astra.datastax.com
- Community Forum: https://community.datastax.com
- GitHub Issues: https://github.com/datastax/astra-cli

### Related Files
- `.env.master` - Database credentials
- `SOVEREIGN_ARCHITECTURE.md` - System architecture
- `ENV_SETUP.md` - Environment configuration
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## Quick Reference Card

| Task | Command |
|------|---------|
| List databases | `astra db list` |
| Get DB details | `astra db get one2lvOS` |
| List keyspaces | `astra db list-keyspaces -id <db-id>` |
| Show org info | `astra org` |
| List tokens | `astra token list` |
| View config | `astra config list` |
| Help | `astra help` |
| Version | `astra --version` |

## Summary

✅ **Installed**: Astra CLI v0.6
✅ **Configured**: With your token from `.env.master`
✅ **Verified**: Connected to **one2lvOS** database
✅ **Status**: Database is ACTIVE in us-east-2
✅ **Ready**: Use `astra` commands from any terminal

---

**🌷 Astra CLI is ready to manage your vector database! 🚀**

*"Command your data with confidence"*
