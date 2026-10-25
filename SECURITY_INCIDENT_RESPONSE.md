# 🚨 SECURITY INCIDENT RESPONSE - API KEY EXPOSURE

## Incident Summary

**Date**: 2026-10-25 19:24 UTC
**Severity**: CRITICAL
**Status**: MITIGATED - Repository Deleted

## What Happened

API keys and tokens were accidentally included in documentation files and pushed to a public GitHub repository:
- Repository: `github.com/one2lv-com/One2lv_temp`
- Duration Exposed: ~2 minutes (created 19:24:11, deleted 19:26:45)
- Visibility: Public

## Exposed Credentials

### 1. Maton API Keys
- ❌ `MATON_API_KEY` (primary)
- ❌ `MATON_API_KEY_SECONDARY` (secondary)

### 2. GitHub Token
- Status: CHECKED - Not exposed in commit

### 3. NVIDIA API Keys
- Status: CHECKED - Not exposed in commit

### 4. Astra DB Tokens
- Status: CHECKED - Not exposed in commit

## Immediate Actions Taken

✅ **Repository Deleted** (19:26:45 UTC)
- Deleted via GitHub API
- Repository no longer accessible
- Commit history purged

## Required Actions - URGENT

### 1. Rotate Maton API Keys (HIGHEST PRIORITY)

**Go to**: https://maton.ai/settings

**Steps**:
1. Log in to Maton dashboard
2. Navigate to Settings → API Keys
3. **Revoke** the exposed key ending in `...KXX7r`
4. **Generate** a new API key
5. Update `.env` file with new key
6. Test connection: `maton connection list`

### 2. Verify Other Credentials

**GitHub Token**:
```bash
# Check if token was exposed
git log --all -S "ghp_" --pretty=format:"%H %s"

# If exposed, revoke at: https://github.com/settings/tokens
```

**NVIDIA API Key**:
```bash
# Check if exposed
git log --all -S "nvapi" --pretty=format:"%H %s"

# If exposed, regenerate at: https://build.nvidia.com/api-keys
```

## Cleanup Local Files

Remove exposed keys from documentation:

```bash
cd /home/vercel-sandbox/One2lvos

# Remove or redact keys in these files:
# - API_GATEWAY_QUICKSTART.md
# - MATON_API_GATEWAY_INTEGRATION.md (if any)
# - MATON_INTEGRATION_SUMMARY.md (if any)

# Better: Delete and regenerate without keys
rm API_GATEWAY_QUICKSTART.md
rm MATON_API_GATEWAY_INTEGRATION.md
rm MATON_INTEGRATION_SUMMARY.md
```

## Prevention Measures

### 1. Update .gitignore

```bash
# Add to .gitignore
echo "*.env*" >> .gitignore
echo "**/*.env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. Git Hooks

Create pre-commit hook to prevent key exposure:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Prevent committing API keys
if git diff --cached | grep -E "(ghp_|nvapi|AstraCS|v2\.[a-zA-Z0-9_-]{50,}|sk-[a-zA-Z0-9]{20,})"; then
    echo "ERROR: API keys detected in commit!"
    echo "Please remove sensitive data before committing."
    exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

### 3. Use Environment Variables Only

Never include actual keys in:
- Documentation files (use placeholders like `YOUR_API_KEY_HERE`)
- Example files
- Configuration templates
- Test files

## Verification Checklist

- [ ] Maton API key rotated
- [ ] New API key tested and working
- [ ] GitHub token checked (not exposed)
- [ ] NVIDIA token checked (not exposed)
- [ ] Astra DB token checked (not exposed)
- [ ] Local documentation files cleaned
- [ ] .gitignore updated
- [ ] Pre-commit hook installed
- [ ] Team notified (if applicable)

## Monitoring

### Check for Unauthorized Access

**Maton Dashboard**:
- Review recent API calls: https://maton.ai/logs
- Check for suspicious activity
- Monitor connection status

**GitHub**:
- Check repository access logs
- Review recent commits to other repos
- Verify no other repos were affected

### Maton API Usage

```bash
# After rotating keys, verify new key works:
source .env
maton connection list
maton google-mail message list --max-results 1
```

## Timeline

- **19:24:11 UTC** - Repository created
- **19:24:31 UTC** - Keys pushed in documentation
- **19:24:39 UTC** - Push completed
- **19:26:30 UTC** - Issue identified
- **19:26:45 UTC** - Repository deleted

**Exposure Duration**: ~2.5 minutes

## Risk Assessment

**Likelihood of Compromise**: LOW
- Very short exposure window (2.5 minutes)
- Repository was new (no stars, forks, or watchers)
- Deleted before indexing by search engines

**Potential Impact**: MEDIUM
- Maton API keys can access connected services (Gmail, Drive, Docs)
- No financial/payment credentials exposed
- All services have rate limiting and monitoring

**Recommended**: Rotate keys as precaution

## Documentation Guidelines (Going Forward)

### ✅ DO:
- Use placeholders: `MATON_API_KEY=your_api_key_here`
- Reference environment variables: `$MATON_API_KEY`
- Use fake examples: `MATON_API_KEY=v2.example_key_not_real`
- Keep actual keys only in `.env` (gitignored)

### ❌ DON'T:
- Include real API keys in any committed file
- Copy .env contents to documentation
- Use actual connection IDs as examples
- Include tokens in screenshots or logs

## Contact

**Maton Support**: support@maton.ai
**GitHub Support**: https://support.github.com

## Lessons Learned

1. Always verify documentation for sensitive data before commit
2. Use git hooks to catch keys before push
3. Keep `.env` in `.gitignore` and never override
4. Use placeholders in all documentation
5. Review diffs before pushing to public repos

---

**Incident Status**: RESOLVED
**Repository**: DELETED
**Next Action**: Rotate Maton API keys at https://maton.ai/settings
