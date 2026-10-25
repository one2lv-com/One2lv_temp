#!/usr/bin/env python3
"""
Maton Gmail Alerter - Send security alerts via Maton Gmail API
Uses existing Gmail connection instead of SMTP
"""

import base64
import json
import os
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from typing import Dict, List


class MatonGmailAlerter:
    """Send email alerts using Maton Gmail API"""

    def __init__(self):
        self.api_key = os.environ.get("MATON_API_KEY", "")
        self.alert_email = os.environ.get("ALERT_EMAIL", "exf0000000@gmail.com")
        self.from_email = "exf0000000@gmail.com"
        self.maton_api_base = "https://api.maton.ai"

    def send_alert(self, subject: str, body: str) -> bool:
        """Send alert email via Maton Gmail API"""
        if not self.api_key:
            print("ERROR: MATON_API_KEY not configured")
            return False

        try:
            # Create email message
            message = MIMEText(body)
            message['To'] = self.alert_email
            message['From'] = self.from_email
            message['Subject'] = subject

            # Encode to base64 (Gmail API format)
            raw_message = base64.urlsafe_b64encode(
                message.as_bytes()
            ).decode('utf-8')

            # Send via Maton Gmail API
            payload = {
                "raw": raw_message
            }

            url = f"{self.maton_api_base}/google-mail/gmail/v1/users/me/messages/send"
            data = json.dumps(payload).encode('utf-8')

            req = urllib.request.Request(url, data=data, method='POST')
            req.add_header("Authorization", f"Bearer {self.api_key}")
            req.add_header("Content-Type", "application/json")
            req.add_header("Accept", "application/json")

            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read())
                print(f"✓ Alert email sent via Maton Gmail API (ID: {result.get('id', 'unknown')})")
                return True

        except urllib.error.HTTPError as e:
            error_body = ""
            try:
                error_body = e.read().decode()
            except Exception:
                pass
            print(f"ERROR: Failed to send email via Maton API: {e.code} {e.reason}")
            print(f"Details: {error_body}")
            return False
        except Exception as e:
            print(f"ERROR: Failed to send alert email: {str(e)}")
            return False

    def send_security_alert(self, suspicious_events: List[Dict]) -> bool:
        """Send formatted security alert"""
        subject = "🚨 SECURITY ALERT: Suspicious Maton API Activity Detected"

        body = f"""
SECURITY ALERT - MATON API KEY MONITORING
==========================================

Suspicious activity detected on Maton API following key exposure incident.

SUSPICIOUS EVENTS DETECTED: {len(suspicious_events)}
{'='*60}

"""

        for i, event in enumerate(suspicious_events, 1):
            body += f"""
Event {i}:
  Type: {event['type']}
  Severity: {event['severity']}
  Description: {event['description']}
  Timestamp: {event['timestamp']}
"""
            if 'details' in event:
                body += f"  Details: {json.dumps(event['details'], indent=2)}\n"

        body += f"""

RECOMMENDED ACTIONS:
{'='*60}
1. Review Maton dashboard immediately: https://maton.ai/logs
2. Check for unauthorized API calls or data access
3. Rotate Maton API keys: https://maton.ai/settings
4. Review connected services for suspicious activity

This is an automated alert from the Lumenis Security Monitor.
Monitor logs: /home/vercel-sandbox/One2lvos/logs/maton_monitor.log
"""

        return self.send_alert(subject, body)


# Test function
def test_gmail_alerter():
    """Test the Gmail alerter"""
    alerter = MatonGmailAlerter()

    test_events = [{
        "type": "test",
        "severity": "INFO",
        "description": "Test alert from Maton Security Monitor",
        "timestamp": "2026-10-25T19:40:00Z"
    }]

    success = alerter.send_security_alert(test_events)
    if success:
        print("✓ Test alert sent successfully")
    else:
        print("✗ Test alert failed")


if __name__ == "__main__":
    test_gmail_alerter()
