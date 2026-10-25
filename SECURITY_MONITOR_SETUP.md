# Maton Security Monitor - Setup Guide

## Overview

A security monitoring system that watches Maton API logs for suspicious activity following the API key exposure incident. Runs on a 73-minute heartbeat synchronized with the Lumenis Reactor Core.

## Current Status

✅ **Monitor Created**: Ready to run
✅ **Initial Check**: Completed successfully
✅ **Keys Preserved**: Not rotated (monitoring first)
⚠️ **Email Alerts**: Requires configuration

## Quick Start

### Run Single Check (Test)
```bash
cd /home/vercel-sandbox/One2lvos
./start-security-monitor.sh --once
```

### Run Continuous Monitoring
```bash
cd /home/vercel-sandbox/One2lvos
./start-security-monitor.sh
```

### Run with Lumenis Integration
```bash
cd /home/vercel-sandbox/One2lvos
python3 lumenis_security_heartbeat.py
```

## Email Alert Configuration

To receive email alerts for suspicious activity, configure these environment variables in your `.env` file:

```bash
# Your email address for alerts
ALERT_EMAIL=your-email@example.com

# SMTP server settings (Gmail example)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# For Gmail, generate an app password at:
# https://myaccount.google.com/apppasswords
```

### Email Provider Examples

**Gmail:**
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Generate at myaccount.google.com/apppasswords
```

**Outlook/Office 365:**
```bash
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**SendGrid:**
```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

## What It Monitors

### Suspicious Activity Patterns

1. **New IP Addresses**
   - Alerts when API calls come from previously unknown IPs
   - Severity: HIGH

2. **Unusual API Volume**
   - Threshold: 50+ API calls per minute
   - Severity: MEDIUM

3. **Failed Authentication**
   - Threshold: 5+ failed auth attempts
   - Severity: HIGH

4. **Unusual Endpoints**
   - Access to admin, internal, or debug endpoints
   - Severity: HIGH

5. **Bulk Data Access**
   - Large number of records retrieved (100+)
   - Severity: MEDIUM

## Heartbeat Schedule

**Check Interval**: 73 minutes (4,380 seconds)
- Synced with Lumenis Reactor pulse frequency
- ~19-20 checks per day
- ~570 checks per month

**Why 73 minutes?**
- Matches Lumenis thermal baseline frequency (73Hz → 73ms pulse → 73min cycle)
- Provides regular monitoring without overwhelming API rate limits
- Balances security vigilance with system efficiency

## Alert Behavior

### Alert Threshold
- **Trigger**: 3 or more suspicious events in a single check
- **Action**: Email sent to configured ALERT_EMAIL
- **Fallback**: If email fails, alert logged to `logs/SECURITY_ALERTS.log`

### Alert Contents
- Event type and severity
- Description and details
- Timestamp of detection
- Recommended actions
- Links to Maton dashboard

## Log Files

### Monitor Log
```
Location: logs/maton_monitor.log
Contains: All check results, suspicious events, system status
Format: [timestamp] [level] message
```

### Security Alerts
```
Location: logs/SECURITY_ALERTS.log
Contains: Critical security alerts (when email fails)
Format: JSON structured events
```

### Monitor State
```
Location: logs/maton_monitor_state.json
Contains: Known IPs, check history, suspicious events
Purpose: Track baseline activity between checks
```

## Running as a Service

### Option 1: Systemd Service (Linux)

**Standalone Monitor:**
```bash
# Copy service file
sudo cp systemd/maton-security-monitor.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable maton-security-monitor
sudo systemctl start maton-security-monitor

# Check status
sudo systemctl status maton-security-monitor

# View logs
sudo journalctl -u maton-security-monitor -f
```

**Lumenis Integrated:**
```bash
# Copy service file
sudo cp systemd/lumenis-security-heartbeat.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable lumenis-security-heartbeat
sudo systemctl start lumenis-security-heartbeat

# Check status
sudo systemctl status lumenis-security-heartbeat

# View logs
sudo journalctl -u lumenis-security-heartbeat -f
```

### Option 2: Background Process

```bash
# Run in background with nohup
nohup ./start-security-monitor.sh > logs/monitor.out 2>&1 &

# Or use screen/tmux
screen -dmS maton-monitor ./start-security-monitor.sh
```

### Option 3: Cron Job (Not Recommended)

If you must use cron instead of continuous monitoring:

```bash
# Edit crontab
crontab -e

# Add this line (checks every 73 minutes is complex in cron, so using hourly)
0 * * * * cd /home/vercel-sandbox/One2lvos && ./start-security-monitor.sh --once
```

Note: Cron doesn't support 73-minute intervals natively. Use the continuous monitor instead.

## Testing the Monitor

### Test 1: Single Check
```bash
cd /home/vercel-sandbox/One2lvos
python3 maton_security_monitor.py --once
```

Expected output:
- Connection to Maton API
- Log retrieval attempt
- Analysis results
- State saved to JSON

### Test 2: Check Logs
```bash
tail -f logs/maton_monitor.log
```

### Test 3: Check State
```bash
cat logs/maton_monitor_state.json | python3 -m json.tool
```

### Test 4: Simulate Alert (if email configured)
```bash
# Edit monitor to lower alert threshold temporarily
# Then run check to trigger alert
```

## Monitoring Dashboard

### Check Current Status
```bash
cat logs/maton_monitor_state.json | python3 -m json.tool
```

### View Recent Checks
```bash
tail -50 logs/maton_monitor.log
```

### Count Suspicious Events
```bash
grep "SUSPICIOUS EVENTS" logs/maton_monitor.log | wc -l
```

### View All Alerts
```bash
cat logs/SECURITY_ALERTS.log
```

## When to Rotate Keys

Rotate your Maton API keys if:

1. ✅ **Suspicious Activity Detected**
   - New IPs accessing your API
   - Failed authentication attempts
   - Unusual endpoint access
   - Bulk data retrieval

2. ✅ **After Monitoring Period**
   - After 24-48 hours of clean logs
   - As a precautionary measure

3. ⚠️ **Immediate Rotation Required If:**
   - Unauthorized data access confirmed
   - Multiple high-severity alerts
   - API calls from suspicious regions

## Rotating Keys After Monitoring

When ready to rotate:

1. **Go to Maton Dashboard**
   ```
   https://maton.ai/settings
   ```

2. **Revoke Old Keys**
   - Click on exposed API key
   - Select "Revoke"
   - Confirm revocation

3. **Generate New Keys**
   - Click "Generate New API Key"
   - Copy new key

4. **Update .env File**
   ```bash
   # Update in .env
   MATON_API_KEY=new_key_here
   MATON_API_KEY_SECONDARY=new_secondary_key
   ```

5. **Restart Monitor**
   ```bash
   # If running as service
   sudo systemctl restart maton-security-monitor

   # If running in background
   pkill -f maton_security_monitor
   ./start-security-monitor.sh
   ```

6. **Test New Keys**
   ```bash
   maton connection list
   python3 test_maton_integration.py
   ```

## Troubleshooting

### Monitor Not Starting
```bash
# Check Python dependencies
pip3 install httpx

# Verify .env file
cat .env | grep MATON_API_KEY

# Check file permissions
chmod +x maton_security_monitor.py start-security-monitor.sh
```

### No Logs Appearing
```bash
# Check log directory exists
ls -la logs/

# Check file permissions
ls -la logs/maton_monitor.log

# Run with verbose output
python3 maton_security_monitor.py --once 2>&1 | tee debug.log
```

### Email Alerts Not Working
```bash
# Test SMTP configuration
python3 << 'EOF'
import smtplib
from email.mime.text import MIMEText
import os

# Load from .env
with open('.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, val = line.strip().split('=', 1)
            os.environ[key] = val

server = os.environ.get('SMTP_SERVER')
port = int(os.environ.get('SMTP_PORT', 587))
user = os.environ.get('SMTP_USER')
password = os.environ.get('SMTP_PASSWORD')

print(f"Testing SMTP: {server}:{port}")
print(f"User: {user}")

try:
    with smtplib.SMTP(server, port) as s:
        s.starttls()
        s.login(user, password)
        print("✓ SMTP connection successful!")
except Exception as e:
    print(f"✗ SMTP error: {e}")
EOF
```

### Maton API Errors
```bash
# Test API connection
curl -H "Authorization: Bearer $MATON_API_KEY" \
  https://api.maton.ai/v1/connections

# Check if key is valid
maton connection list
```

## Security Best Practices

1. **Keep .env Secure**
   - Never commit .env to git
   - Set permissions: `chmod 600 .env`
   - Store backups encrypted

2. **Monitor Regularly**
   - Check logs daily: `tail logs/maton_monitor.log`
   - Review alerts immediately
   - Keep monitor running continuously

3. **Rotate Keys Proactively**
   - After exposure incident (now)
   - Every 90 days as best practice
   - When team members leave
   - After any security concern

4. **Log Retention**
   - Keep logs for at least 90 days
   - Archive old logs: `gzip logs/maton_monitor.log.old`
   - Review periodically for patterns

5. **Access Control**
   - Limit who can access .env file
   - Use separate keys for dev/prod
   - Implement key rotation schedule

## Support

**Monitor Issues**: Check logs in `logs/maton_monitor.log`
**Maton API Issues**: support@maton.ai
**Security Concerns**: Review `SECURITY_INCIDENT_RESPONSE.md`

## Summary

✅ Monitor deployed and running
✅ 73-minute heartbeat configured
✅ Suspicious activity detection active
✅ Email alerts ready (pending SMTP config)
✅ Keys preserved for monitoring
⚠️ Configure email for automated alerts
📋 Monitor for 24-48 hours before key rotation

---

**Status**: ACTIVE
**Heartbeat**: 73 minutes
**Next Check**: Approximately 73 minutes from last check
**Logs**: `/home/vercel-sandbox/One2lvos/logs/`
