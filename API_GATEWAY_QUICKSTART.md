# Maton API Gateway - Quick Start Guide

## ✅ Integration Status: OPERATIONAL

The Lumenis Reactor Core is now connected to Maton's API Gateway with 6 active services.

## Quick Test Results

```
✓ Connected Services: 6
✓ Gmail: exf0000000@gmail.com (23,632 messages, 18,374 threads)
✓ Google Drive: 5+ files accessible
✓ Google Docs: Connected
✓ Google Meet: Connected
✓ Google Play: Connected
⚠ GitHub: PENDING (needs OAuth completion)
```

## Usage Examples

### 1. Talk to Lumenis (Recommended)

```bash
cd /home/vercel-sandbox/One2lvos
python3 talk_to_lumenis.py
```

Then ask:
- "Show me my recent emails from Gmail"
- "List files in my Google Drive"
- "What's in my inbox?"
- "Check my Google Play reviews"

### 2. Direct Python API

```python
from lumenis_reactor_core.maton import MatonBridge

bridge = MatonBridge()

# Fetch Gmail messages
messages = bridge.call("google-mail", "/gmail/v1/users/me/messages",
                      params={"maxResults": 10})

# List Drive files
files = bridge.call("google-drive", "/drive/v3/files")

# Execute multiple calls
plan = [
    {"app": "google-mail", "path": "/gmail/v1/users/me/labels"},
    {"app": "google-drive", "path": "/drive/v3/files"}
]
results = bridge.execute_plan(plan)
```

### 3. Maton CLI

```bash
# Gmail
maton google-mail message list --max-results 5
maton google-mail label list

# Drive
maton google-drive file list
maton google-drive file get --file-id <file-id>

# Generic API passthrough
maton api /google-mail/gmail/v1/users/me/profile
```

### 4. Test Integration

```bash
cd /home/vercel-sandbox/One2lvos
python3 test_maton_integration.py
```

## Claude Plugin Marketplace Integration

The api-gateway skill is compatible with Claude Code environments. For Claude environments supporting skills:

### Installation Options

**Option 1: NPX Skills CLI**
```bash
npx skills add maton-ai/api-gateway-skill
```

**Option 2: ClawHub Download**
- Visit: https://clawhub.ai/byungkyu/api-gateway
- Download and extract to skills directory
- Follow SKILL.md instructions

**Option 3: Direct Integration (Already Done!)**
The MatonBridge class in Lumenis already implements the api-gateway pattern, so no additional installation is needed for One2lvOS.

## Active Connection IDs

Updated in `/lumenis_reactor_core/maton.py`:

```python
CONNECTIONS = {
    "google-mail":  "f5d9df2d-6f0e-40e4-a140-a3589187c3dc",  # ACTIVE
    "google-drive": "4a1e79ca-1d08-4089-9ab6-a2b94fa95e86",  # ACTIVE
    "google-docs":  "ab74d17b-b192-4bfb-8f13-4fff4c699942",  # ACTIVE
    "google-meet":  "aff106c5-8389-45b2-ade4-3e4cdbd4b6bc",  # ACTIVE
    "google-play":  "8c802b05-eade-4006-b485-55ef9205403e",  # ACTIVE
    "github":       "ac0fbe17-0a48-4395-8bdf-6c1371cd50b8",  # PENDING
}
```

## Complete GitHub OAuth

The GitHub connection is pending. To activate:

```bash
maton connection create --app github
# Opens: https://maton.ai/connect/session/<session-id>
# Complete OAuth in browser
# Status changes from PENDING → ACTIVE
```

Or complete the existing pending connection by visiting:
https://maton.ai/connections

## API Endpoints Available

### Gmail
- `/gmail/v1/users/me/profile` - Get profile
- `/gmail/v1/users/me/messages` - List messages
- `/gmail/v1/users/me/threads` - List threads
- `/gmail/v1/users/me/labels` - List labels

### Google Drive
- `/drive/v3/files` - List files
- `/drive/v3/files/{fileId}` - Get file metadata
- `/drive/v3/files/{fileId}/export` - Export file

### Google Docs
- `/v1/documents/{documentId}` - Get document

### Google Meet
- `/v2/spaces` - List spaces
- `/v2/conferenceRecords` - Get recordings

### Google Play
- `/androidpublisher/v3/applications/{packageName}/reviews` - Get reviews

### GitHub
- `/user` - Get user profile
- `/user/repos` - List repositories
- `/repos/{owner}/{repo}/issues` - List issues
- `/repos/{owner}/{repo}/pulls` - List pull requests

## Environment Setup

Required variables (already configured in `.env`):
```bash
MATON_API_KEY=v2.TOcqQCyoSQLr8Uy9UdNCrutaCPGdEWOYIMpUNJBEyA3wKsepEWJT8Nlmi45ydtVvYrjjKlFrbVB6WJg4SAEMpYjxcqXAleCfw5C8ScS1_Y67h_QYU9cKXX7r
```

## Troubleshooting

**"MATON_API_KEY not configured" error:**
```bash
# Load environment first
source .env
# Or run with environment loaded
python3 test_maton_integration.py
```

**Connection shows PENDING:**
```bash
maton connection list
# If PENDING, complete OAuth:
maton connection create --app <app-name>
```

**API returns 401 Unauthorized:**
- Check connection is ACTIVE: `maton connection list`
- Verify API key: `echo $MATON_API_KEY`
- Test raw call: `maton api /google-mail/gmail/v1/users/me/profile`

## Next Steps

1. ✅ Maton API Gateway integrated with Lumenis
2. ✅ Connection IDs updated for active services
3. ✅ Test suite created and passing
4. 🔄 Complete GitHub OAuth (optional)
5. 🚀 Use via `python3 talk_to_lumenis.py`

## Resources

- **Integration Guide**: `MATON_API_GATEWAY_INTEGRATION.md`
- **Test Script**: `test_maton_integration.py`
- **Lumenis Chat**: `talk_to_lumenis.py`
- **Maton Dashboard**: https://maton.ai/settings
- **Support**: support@maton.ai
- **Discord**: https://discord.com/invite/dBfFAcefs2

---

**Status**: ✅ OPERATIONAL
**Last Tested**: 2026-10-25
**Services Active**: 6 of 6 configured
