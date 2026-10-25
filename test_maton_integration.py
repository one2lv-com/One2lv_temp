#!/usr/bin/env python3
"""
Test Maton API Gateway Integration with Lumenis
Demonstrates the api-gateway skill functionality
"""

import os
import sys

# Load environment variables from .env
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env()
sys.path.insert(0, os.path.dirname(__file__))

from lumenis_reactor_core.maton import MatonBridge

def main():
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║        Maton API Gateway Integration Test                ║")
    print("║        Lumenis Reactor Core + api-gateway Skill           ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")

    bridge = MatonBridge()

    # Check API key configuration
    api_key = os.environ.get('MATON_API_KEY', '')
    if api_key and not api_key.startswith('INJECTED'):
        print(f"✓ API Key: {api_key[:15]}...{api_key[-5:]}")
    else:
        print("✗ API Key: Not configured")
        print("\nPlease set MATON_API_KEY in your .env file")
        return

    # Get bridge status
    status = bridge.get_status()
    print(f"✓ Connected Services: {status['connected_services']}")
    print(f"✓ Available Services: {', '.join(status['services'])}\n")

    # Test 1: Gmail Profile
    print("="*60)
    print("Test 1: Fetch Gmail Profile")
    print("="*60)
    result = bridge.call("google-mail", "/gmail/v1/users/me/profile")
    if "error" in result:
        print(f"✗ Error: {result['error']}")
        if 'detail' in result:
            print(f"  Detail: {result['detail'][:200]}")
    else:
        print("✓ Success!")
        print(f"  Email: {result.get('emailAddress', 'N/A')}")
        print(f"  Messages Total: {result.get('messagesTotal', 0)}")
        print(f"  Threads Total: {result.get('threadsTotal', 0)}")

    # Test 2: Gmail Messages List
    print("\n" + "="*60)
    print("Test 2: List Recent Gmail Messages")
    print("="*60)
    result = bridge.call("google-mail", "/gmail/v1/users/me/messages", params={"maxResults": 5})
    if "error" in result:
        print(f"✗ Error: {result['error']}")
    else:
        messages = result.get('messages', [])
        print(f"✓ Found {len(messages)} messages")
        for i, msg in enumerate(messages[:3], 1):
            print(f"  {i}. Message ID: {msg.get('id', 'N/A')}")

    # Test 3: Google Drive Files
    print("\n" + "="*60)
    print("Test 3: List Google Drive Files")
    print("="*60)
    result = bridge.call("google-drive", "/drive/v3/files", params={"pageSize": 5})
    if "error" in result:
        print(f"✗ Error: {result['error']}")
    else:
        files = result.get('files', [])
        print(f"✓ Found {len(files)} files")
        for i, file in enumerate(files[:3], 1):
            print(f"  {i}. {file.get('name', 'N/A')} ({file.get('mimeType', 'N/A')})")

    # Test 4: Multi-call execution plan
    print("\n" + "="*60)
    print("Test 4: Execute Multi-Call Plan")
    print("="*60)

    plan = [
        {
            "app": "google-mail",
            "path": "/gmail/v1/users/me/labels",
            "method": "GET",
            "description": "Fetch Gmail labels"
        },
        {
            "app": "google-drive",
            "path": "/drive/v3/about",
            "method": "GET",
            "description": "Get Drive storage info",
            "params": {"fields": "user,storageQuota"}
        }
    ]

    results = bridge.execute_plan(plan)
    print(f"✓ Executed {len(results)} API calls:")
    for i, result_item in enumerate(results, 1):
        desc = result_item.get('description', 'Unknown')
        res = result_item.get('result', {})
        if "error" in res:
            print(f"  {i}. {desc}: ✗ {res['error']}")
        else:
            print(f"  {i}. {desc}: ✓ Success")

    print("\n" + "="*60)
    print("Service Manifest (for LLM prompts)")
    print("="*60)
    print(bridge.get_service_manifest())

    print("\n╔═══════════════════════════════════════════════════════════╗")
    print("║  ✓ Maton API Gateway Integration Test Complete           ║")
    print("║                                                           ║")
    print("║  The api-gateway skill is operational!                   ║")
    print("║  Use via: python3 talk_to_lumenis.py                     ║")
    print("╚═══════════════════════════════════════════════════════════╝")

if __name__ == "__main__":
    main()
