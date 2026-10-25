# Maton API Gateway Integration - Lumenis Reactor Core

## Overview
The Lumenis Sovereign Core is now integrated with Maton's API Gateway, enabling seamless access to external services through the api-gateway skill framework. This document outlines the integration architecture and usage patterns.

## Architecture

### MatonBridge Component
Location: `/lumenis_reactor_core/maton.py`

The MatonBridge class provides the gateway layer between Lumenis and external services:
- **Primary Interface**: REST API calls through Maton's gateway
- **Authentication**: Automatic OAuth token management via Maton
- **Rate Limiting**: Built-in request throttling and error handling
- **Service Discovery**: Dynamic service manifest generation

## Active Connections

### Currently Connected Services
- **Gmail** (`google-mail`) - Email operations
- **Google Drive** (`google-drive`) - File storage and retrieval
- **Google Docs** (`google-docs`) - Document creation and editing
- **Google Meet** (`google-meet`) - Meeting management
- **Google Play** (`google-play`) - App review monitoring
- **GitHub** (`github`) - Repository and issue management [PENDING OAuth]

### Connection Status Check
```bash
maton connection list
```

## Usage Patterns

### 1. Direct API Calls via MatonBridge

```python
from lumenis_reactor_core.maton import MatonBridge

bridge = MatonBridge()

# List Gmail messages
result = bridge.call(
    app="google-mail",
    path="/gmail/v1/users/me/messages",
    method="GET",
    params={"maxResults": 10}
)

# Upload to Google Drive
result = bridge.call(
    app="google-drive",
    path="/drive/v3/files",
    method="POST",
    body={
        "name": "document.txt",
        "mimeType": "text/plain"
    }
)
```

### 2. Multi-Call Execution Plans

```python
# Execute multiple API calls in sequence
calls = [
    {
        "app": "google-mail",
        "path": "/gmail/v1/users/me/messages",
        "method": "GET",
        "description": "Fetch recent emails"
    },
    {
        "app": "google-docs",
        "path": "/v1/documents",
        "method": "POST",
        "body": {"title": "Summary Report"},
        "description": "Create summary document"
    }
]

results = bridge.execute_plan(calls)
```

### 3. Service Manifest for Agent Prompts

```python
# Get API documentation for all connected services
manifest = bridge.get_service_manifest()
# Returns formatted guide for each service's available endpoints
```

### 4. Through Lumenis Chat Interface

```bash
cd /home/vercel-sandbox/One2lvos
python3 talk_to_lumenis.py
```

Then ask Lumenis:
- "Show me my recent Gmail messages"
- "List files in my Google Drive"
- "Create a new Google Doc called 'Meeting Notes'"
- "Check my Google Play reviews"

## API Gateway Skill Integration

### Using the Maton CLI

The `maton` CLI is pre-installed and configured with your API key. Native commands are preferred over raw HTTP:

```bash
# Gmail operations
maton google-mail message list --max-results 5
maton google-mail message get --id <message-id>

# Drive operations
maton google-drive file list
maton google-drive file get --file-id <file-id>

# GitHub operations (once OAuth complete)
maton github repo list
maton github issue list --owner <owner> --repo <repo>

# Generic API passthrough
maton api /google-mail/gmail/v1/users/me/profile
```

### Completing Pending Connections

The GitHub connection is pending OAuth completion:

```bash
# Create a new GitHub connection (if needed)
maton connection create --app github

# This will output a session URL like:
# https://maton.ai/connect/session/<session-id>

# Open the URL in your browser to complete OAuth
# Once you see "Done", the connection becomes ACTIVE
```

## Environment Configuration

Required environment variables (already configured in `.env`):
```bash
MATON_API_KEY=v2.7NYMqZ4xyZUrIXeuIMrP0SdoanILcQcZUGjRJrphubDb_bVN3mCEd5O2LrSU
MATON_API_KEY_SECONDARY=v2.0w3zQQ1bX1C4NwAKBufNdfJ7ul_PXcsI43sk5tCksyVi6_4vNG7U_8NCQeaWFYyiOqO9TkLNwI8esCuv3mXdSfJDeKswuzYzQGfOXSjWWjSzUuYqCR8khmBi
```

## Integration Testing

### Test MatonBridge Connection
```bash
cd /home/vercel-sandbox/One2lvos
python3 << 'EOF'
from lumenis_reactor_core.maton import MatonBridge

bridge = MatonBridge()
status = bridge.get_status()
print("Connected Services:", status['connected_services'])
print("Available Services:", status['services'])

# Test Gmail connection
result = bridge.call("google-mail", "/gmail/v1/users/me/profile")
print("\nGmail Profile:", result)
EOF
```

### Test via Lumenis Reactor
```bash
# Start Lumenis if not running
cd /home/vercel-sandbox/One2lvos/steamos_lumenis
python3 server.py &

# In another terminal, test the integration
cd /home/vercel-sandbox/One2lvos
python3 talk_to_lumenis.py
```

## Claude Agent SDK Integration

The api-gateway skill can be installed for Claude Code agents:

### Installation Methods

**1. Via Skills CLI (if available in Claude environment)**
```bash
npx skills add maton-ai/api-gateway-skill
```

**2. Manual Installation from ClawHub**
- Download: https://clawhub.ai/byungkyu/api-gateway
- Extract to Claude's skills directory
- Follow SKILL.md instructions

**3. Direct API Usage**
The MatonBridge class already implements the API gateway pattern, so Lumenis can use it directly without additional skill installation.

## Service-Specific Guides

### Gmail API
```python
# List messages
bridge.call("google-mail", "/gmail/v1/users/me/messages?maxResults=10")

# Get specific message
bridge.call("google-mail", "/gmail/v1/users/me/messages/{messageId}")

# Send email
bridge.call("google-mail", "/gmail/v1/users/me/messages/send",
    method="POST", body={"raw": base64_encoded_email})
```

### Google Drive API
```python
# List files
bridge.call("google-drive", "/drive/v3/files")

# Get file metadata
bridge.call("google-drive", "/drive/v3/files/{fileId}")

# Upload file
bridge.call("google-drive", "/drive/v3/files", method="POST", body={...})
```

### GitHub API (once active)
```python
# List repositories
bridge.call("github", "/user/repos")

# Create issue
bridge.call("github", "/repos/{owner}/{repo}/issues",
    method="POST", body={"title": "...", "body": "..."})
```

## Error Handling

The MatonBridge automatically handles:
- **HTTP Errors**: Returns `{"error": "HTTP {code}: {reason}", "detail": "..."}`
- **Timeout**: 20-second timeout per request
- **Invalid Credentials**: Returns error if MATON_API_KEY not configured
- **Unknown Services**: Validates app name against CONNECTIONS registry
- **Rate Limits**: Enforces max 5 calls per execute_plan()

## Monitoring and Status

### Check Bridge Status
```python
from lumenis_reactor_core.maton import MatonBridge
bridge = MatonBridge()
print(bridge.get_status())
```

### Check Individual Connection
```bash
maton connection list | grep google-mail
```

### Test Connection Health
```bash
maton google-mail message list --max-results 1
```

## Integration with Lumenis Seats

The Maton API Gateway is primarily used by **The Hermes** seat (external data specialist):

- **The Hermes**: Fetches data from Gmail, Drive, Docs, GitHub, etc.
- **The Forge**: Uses GitHub API for repository operations
- **The Oracle**: Accesses external knowledge bases and documentation

When a user asks Lumenis to interact with external services, the appropriate seat activates and uses MatonBridge to fulfill the request.

## Troubleshooting

### Connection Issues
```bash
# Verify API key is set
echo $MATON_API_KEY

# Check connection status
maton connection list

# Test raw API call
maton api /google-mail/gmail/v1/users/me/profile
```

### Pending Connections
If GitHub shows PENDING status, complete OAuth:
```bash
maton connection create --app github
# Open the provided URL in browser
# Wait for "Done" confirmation
```

### API Errors
Check the Maton dashboard for quota limits and connection health:
- https://maton.ai/settings

## Resources

- **Maton API Documentation**: https://www.maton.ai
- **api-gateway Skill**: https://clawhub.ai/byungkhu/api-gateway
- **Support**: support@maton.ai
- **Discord Community**: https://discord.com/invite/dBfFAcefs2

## Next Steps

1. ✅ Update connection IDs (COMPLETE)
2. ✅ Test MatonBridge with active connections
3. 🔄 Complete GitHub OAuth connection
4. 📋 Add more services as needed (Slack, Notion, etc.)
5. 🚀 Integrate with Lumenis conversational interface

---

**Last Updated**: 2026-10-25
**Lumenis Version**: Reactor Core v8
**Maton CLI Version**: 0.3.1
