#!/usr/bin/env python3
"""
Maton Security Monitor - API Key Exposure Response System
Monitors Maton API logs for suspicious activity following key exposure incident
Runs on 73-minute heartbeat (synced with Lumenis pulse interval)
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import urllib.request
import urllib.error

# Import Maton Gmail alerter
try:
    from maton_gmail_alerter import MatonGmailAlerter
    GMAIL_API_AVAILABLE = True
except ImportError:
    GMAIL_API_AVAILABLE = False
    print("Warning: maton_gmail_alerter not found, alerts will be logged to file only")

# ─── Configuration ───────────────────────────────────────────────────────────
MATON_API_BASE = "https://api.maton.ai"
HEARTBEAT_INTERVAL = 73 * 60  # 73 minutes in seconds
LOG_FILE = "/home/vercel-sandbox/One2lvos/logs/maton_monitor.log"
STATE_FILE = "/home/vercel-sandbox/One2lvos/logs/maton_monitor_state.json"
ALERT_THRESHOLD = 3  # Number of suspicious events before alerting

# Email configuration (using Maton Gmail API)
ALERT_EMAIL = os.environ.get("ALERT_EMAIL", "exf0000000@gmail.com")
USE_MATON_GMAIL_API = True  # Use Maton Gmail API instead of SMTP

# Exposure incident details
EXPOSURE_TIME = "2026-10-25T19:24:00Z"
MONITORING_START = "2026-10-25T19:26:00Z"

# ─── Suspicious Activity Patterns ────────────────────────────────────────────
SUSPICIOUS_PATTERNS = {
    "unusual_volume": {
        "threshold": 50,  # API calls per minute
        "description": "Unusually high API call rate"
    },
    "new_ip": {
        "description": "API calls from new/unknown IP addresses"
    },
    "failed_auth": {
        "threshold": 5,
        "description": "Multiple failed authentication attempts"
    },
    "unusual_endpoint": {
        "endpoints": ["/admin", "/internal", "/debug"],
        "description": "Access to unusual API endpoints"
    },
    "bulk_data_access": {
        "threshold": 100,  # Large number of records retrieved
        "description": "Bulk data retrieval attempt"
    }
}


class MatonMonitor:
    """Monitor Maton API for suspicious activity"""

    def __init__(self):
        self.api_key = os.environ.get("MATON_API_KEY", "")
        self.state = self.load_state()
        self.alerts = []
        # Initialize Gmail alerter if available
        self.gmail_alerter = MatonGmailAlerter() if GMAIL_API_AVAILABLE else None

    def load_state(self) -> Dict:
        """Load previous monitoring state"""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "last_check": None,
            "known_ips": [],
            "total_checks": 0,
            "suspicious_events": [],
            "last_alert_sent": None
        }

    def save_state(self):
        """Save monitoring state"""
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        with open(STATE_FILE, 'w') as f:
            json.dump(self.state, f, indent=2)

    def log(self, message: str, level: str = "INFO"):
        """Log message to file and console"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        log_entry = f"[{timestamp}] [{level}] {message}"

        print(log_entry)

        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, 'a') as f:
            f.write(log_entry + "\n")

    def fetch_maton_logs(self, since: Optional[str] = None) -> List[Dict]:
        """Fetch logs from Maton API"""
        if not self.api_key:
            self.log("MATON_API_KEY not configured", "ERROR")
            return []

        # Build URL with time filter
        url = f"{MATON_API_BASE}/v1/logs"
        if since:
            url += f"?since={since}"

        try:
            req = urllib.request.Request(url)
            req.add_header("Authorization", f"Bearer {self.api_key}")
            req.add_header("Accept", "application/json")

            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read())
                return data.get("logs", [])

        except urllib.error.HTTPError as e:
            if e.code == 404:
                # Logs endpoint might not exist, try alternative
                self.log("Logs endpoint not available, checking via activity API", "WARN")
                return self.fetch_activity_logs(since)
            else:
                self.log(f"HTTP Error fetching logs: {e.code} {e.reason}", "ERROR")
                return []
        except Exception as e:
            self.log(f"Error fetching logs: {str(e)}", "ERROR")
            return []

    def fetch_activity_logs(self, since: Optional[str] = None) -> List[Dict]:
        """Fetch activity via connections API calls"""
        logs = []

        # Get recent API calls for each connection
        try:
            req = urllib.request.Request(f"{MATON_API_BASE}/v1/connections")
            req.add_header("Authorization", f"Bearer {self.api_key}")
            req.add_header("Accept", "application/json")

            with urllib.request.urlopen(req, timeout=30) as response:
                connections = json.loads(response.read())

                for conn in connections.get("connections", []):
                    # Simulate log entry from connection activity
                    logs.append({
                        "timestamp": conn.get("lastUsedAt", conn.get("createdAt")),
                        "connection": conn.get("app"),
                        "status": conn.get("status"),
                        "type": "connection_check"
                    })

        except Exception as e:
            self.log(f"Error fetching activity logs: {str(e)}", "WARN")

        return logs

    def analyze_logs(self, logs: List[Dict]) -> List[Dict]:
        """Analyze logs for suspicious patterns"""
        suspicious_events = []

        if not logs:
            self.log("No logs to analyze", "INFO")
            return suspicious_events

        # Extract IPs from logs
        ips_in_logs = set()
        for log in logs:
            if "ip" in log:
                ips_in_logs.add(log["ip"])

        # Check for new IPs
        known_ips = set(self.state.get("known_ips", []))
        new_ips = ips_in_logs - known_ips

        if new_ips:
            suspicious_events.append({
                "type": "new_ip",
                "severity": "HIGH",
                "description": f"API calls from {len(new_ips)} new IP address(es)",
                "details": {"ips": list(new_ips)},
                "timestamp": datetime.utcnow().isoformat()
            })
            self.log(f"⚠️  New IPs detected: {new_ips}", "WARN")

        # Update known IPs
        self.state["known_ips"] = list(ips_in_logs)

        # Check API call rate
        recent_logs = [log for log in logs
                      if self._is_recent(log.get("timestamp"), minutes=60)]

        call_rate = len(recent_logs)
        if call_rate > SUSPICIOUS_PATTERNS["unusual_volume"]["threshold"]:
            suspicious_events.append({
                "type": "unusual_volume",
                "severity": "MEDIUM",
                "description": f"High API call rate: {call_rate} calls in last hour",
                "timestamp": datetime.utcnow().isoformat()
            })
            self.log(f"⚠️  High API volume: {call_rate} calls/hour", "WARN")

        # Check for failed authentications
        failed_auths = [log for log in logs
                       if log.get("status") in ["401", "403", "UNAUTHORIZED"]]

        if len(failed_auths) > SUSPICIOUS_PATTERNS["failed_auth"]["threshold"]:
            suspicious_events.append({
                "type": "failed_auth",
                "severity": "HIGH",
                "description": f"{len(failed_auths)} failed authentication attempts",
                "timestamp": datetime.utcnow().isoformat()
            })
            self.log(f"⚠️  Multiple failed auth attempts: {len(failed_auths)}", "WARN")

        # Check for unusual endpoints
        unusual_endpoints = []
        for log in logs:
            endpoint = log.get("endpoint", "")
            for pattern in SUSPICIOUS_PATTERNS["unusual_endpoint"]["endpoints"]:
                if pattern in endpoint:
                    unusual_endpoints.append(endpoint)

        if unusual_endpoints:
            suspicious_events.append({
                "type": "unusual_endpoint",
                "severity": "HIGH",
                "description": f"Access to unusual endpoints: {set(unusual_endpoints)}",
                "timestamp": datetime.utcnow().isoformat()
            })
            self.log(f"⚠️  Unusual endpoint access: {unusual_endpoints}", "WARN")

        return suspicious_events

    def _is_recent(self, timestamp: Optional[str], minutes: int = 60) -> bool:
        """Check if timestamp is within recent window"""
        if not timestamp:
            return False
        try:
            log_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            threshold = datetime.utcnow() - timedelta(minutes=minutes)
            return log_time > threshold
        except Exception:
            return False

    def send_alert(self, suspicious_events: List[Dict]):
        """Send email alert about suspicious activity via Maton Gmail API"""
        if not self.gmail_alerter:
            self.log("Gmail alerter not available, logging to file", "WARN")
            self._log_alert_to_file(suspicious_events)
            return

        # Send via Maton Gmail API
        try:
            success = self.gmail_alerter.send_security_alert(suspicious_events)

            if success:
                self.log(f"✉️  Alert email sent to {ALERT_EMAIL} via Maton Gmail API", "INFO")
                self.state['last_alert_sent'] = datetime.utcnow().isoformat()
            else:
                self.log("Failed to send email via Maton Gmail API, logging to file", "ERROR")
                self._log_alert_to_file(suspicious_events)

        except Exception as e:
            self.log(f"Failed to send email via Maton Gmail API: {str(e)}", "ERROR")
            self._log_alert_to_file(suspicious_events)

    def _log_alert_to_file(self, suspicious_events: List[Dict]):
        """Log alert to file when email fails"""
        alert_file = "/home/vercel-sandbox/One2lvos/logs/SECURITY_ALERTS.log"
        os.makedirs(os.path.dirname(alert_file), exist_ok=True)

        with open(alert_file, 'a') as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"ALERT: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
            f.write(f"{'='*60}\n")
            for event in suspicious_events:
                f.write(json.dumps(event, indent=2) + "\n")
            f.write("\n")

        self.log(f"Alert logged to {alert_file}", "INFO")

    def run_check(self):
        """Run a single monitoring check"""
        self.log("="*60, "INFO")
        self.log("Starting Maton Security Monitor Check", "INFO")
        self.log(f"Heartbeat Interval: 73 minutes | Check #{self.state['total_checks'] + 1}", "INFO")

        # Determine time window for logs
        since = self.state.get("last_check", MONITORING_START)
        self.log(f"Checking logs since: {since}", "INFO")

        # Fetch logs
        logs = self.fetch_maton_logs(since)
        self.log(f"Retrieved {len(logs)} log entries", "INFO")

        # Analyze for suspicious activity
        suspicious_events = self.analyze_logs(logs)

        if suspicious_events:
            self.log(f"⚠️  {len(suspicious_events)} SUSPICIOUS EVENTS DETECTED", "WARN")
            self.state["suspicious_events"].extend(suspicious_events)

            # Send alert if threshold exceeded
            if len(suspicious_events) >= ALERT_THRESHOLD:
                self.log("🚨 Alert threshold exceeded, sending notification", "ERROR")
                self.send_alert(suspicious_events)
            else:
                self.log(f"Suspicious events logged (threshold: {ALERT_THRESHOLD})", "WARN")
        else:
            self.log("✓ No suspicious activity detected", "INFO")

        # Update state
        self.state["last_check"] = datetime.utcnow().isoformat()
        self.state["total_checks"] += 1
        self.save_state()

        self.log("Monitor check complete", "INFO")
        self.log("="*60, "INFO")

        return len(suspicious_events) > 0


def main():
    """Main monitoring loop"""
    monitor = MatonMonitor()

    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        # Run single check
        monitor.run_check()
    else:
        # Run continuous monitoring loop
        monitor.log("Maton Security Monitor started", "INFO")
        monitor.log(f"Monitoring interval: {HEARTBEAT_INTERVAL // 60} minutes", "INFO")
        monitor.log(f"Alert email: {ALERT_EMAIL}", "INFO")

        while True:
            try:
                monitor.run_check()
                monitor.log(f"Next check in {HEARTBEAT_INTERVAL // 60} minutes", "INFO")
                time.sleep(HEARTBEAT_INTERVAL)
            except KeyboardInterrupt:
                monitor.log("Monitor stopped by user", "INFO")
                break
            except Exception as e:
                monitor.log(f"Error in monitoring loop: {str(e)}", "ERROR")
                time.sleep(300)  # Wait 5 minutes on error


if __name__ == "__main__":
    main()
