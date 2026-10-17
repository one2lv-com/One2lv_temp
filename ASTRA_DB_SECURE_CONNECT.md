# Astra DB Secure Connect Bundle

## Status
⚠️ **The secure connect bundle download URL has expired**

The provided AWS S3 signed URL for downloading `secure-connect-one2lvos.zip` returned a 403 Forbidden error, indicating the URL has expired (signed URLs typically expire after 5-15 minutes).

## How to Download the Bundle

### Option 1: Via Astra DB Console (Recommended)

1. Go to [Astra DB Console](https://astra.datastax.com)
2. Sign in to your account
3. Navigate to your database:
   - **Database Name**: `one2lvos`
   - **Database ID**: `9b5b1939-fd21-477d-95b8-a1aecc5f90b9`
   - **Region**: `us-east-2` (AWS)
4. Click the "Connect" button
5. Select "Download Secure Connect Bundle"
6. Save the file as `secure-connect-one2lvos.zip`
7. Move it to: `/home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip`

### Option 2: Via Astra CLI

If you have the Astra CLI installed:

```bash
# Configure Astra CLI with your token
astra setup

# Download the bundle
astra db download-scb one2lvos \
  -l /home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip
```

### Option 3: Via REST API

```bash
# Using your Astra token
ASTRA_TOKEN="AstraCS:your_astra_token_here"
DB_ID="9b5b1939-fd21-477d-95b8-a1aecc5f90b9"

# Get a fresh download URL
curl -s --request POST \
  --url "https://api.astra.datastax.com/v2/databases/${DB_ID}/secureBundleURL" \
  --header "Authorization: Bearer ${ASTRA_TOKEN}" | jq -r '.downloadURL' > download_url.txt

# Download the bundle
wget -O /home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip "$(cat download_url.txt)"
```

## What is the Secure Connect Bundle?

The secure connect bundle is a ZIP file containing:
- **Client certificates**: For secure TLS connections
- **Configuration files**: Connection endpoints and settings
- **Root CA certificates**: For validating the Astra DB server

### Contents
```
secure-connect-one2lvos.zip
├── ca.crt                    # Root CA certificate
├── cert                      # Client certificate
├── key                       # Client private key
├── config.json              # Connection configuration
├── cqlshrc                   # CQL shell configuration
└── identity.jks             # Java keystore (optional)
```

## Usage in One2lvos

### Python (Cassandra Driver)
```python
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

cloud_config = {
    'secure_connect_bundle': '/home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip'
}

auth_provider = PlainTextAuthProvider(
    'token',
    'AstraCS:your_astra_token_here'
)

cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
session = cluster.connect()
```

### Node.js (cassandra-driver)
```javascript
const { Client } = require('cassandra-driver');

const client = new Client({
  cloud: {
    secureConnectBundle: '/home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip'
  },
  credentials: {
    username: 'token',
    password: 'AstraCS:your_astra_token_here'
  }
});

await client.connect();
```

## Alternative: Use Data API (No Bundle Required)

The Lumenis Reactor and One2lvos currently use the **Data API** approach, which doesn't require the secure connect bundle:

```python
from astrapy import DataAPIClient

client = DataAPIClient("AstraCS:your_astra_token_here")
db = client.get_database_by_api_endpoint(
    "https://your-database-id-region.apps.astra.datastax.com"
)
collection = db.get_collection("aria_memory_v2")
```

## When Do You Need the Bundle?

### ✅ Required For:
- CQL (Cassandra Query Language) access
- Using native Cassandra drivers (Python cassandra-driver, Node cassandra-driver)
- Direct CQL shell (`cqlsh`) access
- Batch operations and bulk loading
- Advanced Cassandra features (prepared statements, batch statements)

### ❌ NOT Required For:
- Data API (HTTP/JSON) — **Current One2lvos approach**
- REST API operations
- GraphQL API
- Stargate API
- Simple CRUD operations

## Current Implementation

One2lvos and Lumenis Reactor use the **Data API** approach:
- **Endpoint**: `https://9b5b1939-fd21-477d-95b8-a1aecc5f90b9-us-east-2.apps.astra.datastax.com`
- **Library**: `astrapy` (Python)
- **Authentication**: Application token (no bundle needed)

The secure connect bundle is **optional** for the current implementation but recommended if you want to use CQL or native drivers.

## Verification

Once downloaded, verify the bundle:

```bash
# Check file exists and has content
ls -lh /home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip

# Inspect contents (don't extract, just list)
unzip -l /home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip

# Expected output:
# Archive:  secure-connect-one2lvos.zip
#   Length      Date    Time    Name
# ---------  ---------- -----   ----
#      xxxx  xx-xx-xxxx xx:xx   ca.crt
#      xxxx  xx-xx-xxxx xx:xx   cert
#      xxxx  xx-xx-xxxx xx:xx   key
#      xxxx  xx-xx-xxxx xx:xx   config.json
#      xxxx  xx-xx-xxxx xx:xx   cqlshrc
# ---------                     -------
#     xxxxx                     5 files
```

## Troubleshooting

### Bundle download fails
- **Check your Astra DB token** is valid and has correct permissions
- **Verify database exists** in your Astra account
- **Ensure database is active** (not terminated or hibernated)

### Bundle verification fails
- **Re-download** from a fresh signed URL (they expire quickly)
- **Check file integrity** — should be a valid ZIP file
- **Verify permissions** — you should be able to read the file

### Connection issues with bundle
- **Check bundle path** is absolute and correct
- **Verify token** matches the database
- **Ensure network connectivity** to Astra DB endpoints

## References

- [Astra DB Secure Connect Bundle](https://docs.datastax.com/en/astra-db-serverless/databases/secure-connect-bundle.html)
- [Astra DB Documentation](https://docs.datastax.com/en/astra-db-serverless/)
- [Python Cassandra Driver](https://docs.datastax.com/en/developer/python-driver/)
- [Node.js Cassandra Driver](https://docs.datastax.com/en/developer/nodejs-driver/)
