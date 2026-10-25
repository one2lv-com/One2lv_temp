#!/usr/bin/env python3
"""
Lumenis Security Heartbeat - Integrated Monitoring System
Syncs security monitoring with Lumenis Reactor Core pulse (73 minutes)
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from lumenis_reactor_core.reactor import LumenisReactor
from maton_security_monitor import MatonMonitor

PULSE_INTERVAL_MS = 73  # 73ms heartbeat
SECURITY_CHECK_INTERVAL = 73 * 60  # 73 minutes in seconds


class LumenisSecurityHeartbeat:
    """
    Security monitoring integrated with Lumenis Reactor Core.
    Checks Maton logs on 73-minute intervals synchronized with reactor pulse.
    """

    def __init__(self):
        self.reactor = None
        self.monitor = MatonMonitor()
        self.pulse_count = 0
        self.last_security_check = 0
        self.security_checks_performed = 0

    async def start(self):
        """Initialize Lumenis reactor and start monitoring"""
        self.reactor = LumenisReactor()
        await self.reactor.start()

        # Register pulse callback
        @self.reactor.on_pulse
        async def on_pulse(status):
            self.pulse_count += 1

            # Check if 73 minutes have elapsed
            current_time = time.time()
            if current_time - self.last_security_check >= SECURITY_CHECK_INTERVAL:
                await self.perform_security_check()
                self.last_security_check = current_time

        print("╔═══════════════════════════════════════════════════════════╗")
        print("║   Lumenis Security Heartbeat - ACTIVE                    ║")
        print("║   Monitoring Maton API for suspicious activity           ║")
        print("╚═══════════════════════════════════════════════════════════╝")
        print(f"\n✓ Reactor Core: Online")
        print(f"✓ Security Monitor: Active")
        print(f"✓ Check Interval: 73 minutes")
        print(f"✓ Pulse Frequency: {self.reactor.status.frequency_hz:.2f} Hz")
        print(f"✓ Thermal Baseline: {self.reactor.status.temperature}°")
        print(f"\nNext security check in 73 minutes...")
        print(f"Monitor logs: /home/vercel-sandbox/One2lvos/logs/maton_monitor.log\n")

        # Perform initial check
        await self.perform_security_check()
        self.last_security_check = time.time()

    async def perform_security_check(self):
        """Run security check synchronized with reactor pulse"""
        self.security_checks_performed += 1

        print(f"\n{'='*60}")
        print(f"Security Check #{self.security_checks_performed}")
        print(f"Reactor Pulse Count: {self.pulse_count:,}")
        print(f"Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"{'='*60}\n")

        # Run security check
        suspicious_detected = self.monitor.run_check()

        # Update reactor status
        if suspicious_detected:
            print("\n⚠️  SECURITY ALERT: Suspicious activity detected!")
            print("Review logs immediately: /home/vercel-sandbox/One2lvos/logs/maton_monitor.log")
        else:
            print("\n✓ Security check complete - No suspicious activity")

        print(f"\nNext check in 73 minutes (at pulse ~{self.pulse_count + 60000:,})")

    def get_status(self) -> dict:
        """Get combined reactor and security monitor status"""
        reactor_status = self.reactor.get_status() if self.reactor else {}

        return {
            "reactor": reactor_status,
            "security": {
                "active": True,
                "check_interval_minutes": 73,
                "checks_performed": self.security_checks_performed,
                "pulse_count": self.pulse_count,
                "last_check": self.monitor.state.get("last_check"),
                "suspicious_events_total": len(self.monitor.state.get("suspicious_events", []))
            }
        }


async def main():
    """Run integrated security monitoring"""
    heartbeat = LumenisSecurityHeartbeat()

    try:
        await heartbeat.start()

        # Keep running
        while True:
            await asyncio.sleep(1)

    except KeyboardInterrupt:
        print("\n\nShutting down Lumenis Security Heartbeat...")
        if heartbeat.reactor:
            await heartbeat.reactor.stop()
        print("✓ Shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
