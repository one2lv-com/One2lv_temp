# 🌐 Interplanetar Integration

## Repository Link
**GitHub:** https://github.com/one2lv-com/interplanetar

## Overview
The Interplanetar repository is linked to the LUMENIS Reactor_Core workstation as an extended asset for cross-planetary network communication and distributed agent coordination.

## Integration Status
- **Status:** LINKED
- **Workstation:** Reactor_Core
- **Primary System:** LUMENIS ONE2LVOS
- **Integration Type:** External Asset

## Purpose
Interplanetar serves as:
- Cross-network communication layer
- Distributed agent coordination
- Extended planetary-scale operations
- Network protocol extensions

## Synchronization
The workstation sync script (`sync_workstation.js`) automatically registers this repository link in the Supabase database under the `reactor_core_state` configuration.

## Usage

### Manual Sync
```bash
npm run sync
```

This will:
1. Push changes to GitHub (both repositories)
2. Update Supabase with workstation state
3. Log sync events to memory_events table

### Check Status
The Reactor_Core manifest includes the interplanetar repository reference:
```bash
cat Reactor_Core/station_manifest.json
```

## Assets Registered
1. **flux_compass_a.tor** - Navigation and routing
2. **The_Innovative_Thought_Team** - Collaborative intelligence
3. **The_Registry_of_Thought** - Knowledge persistence
4. **Interplanetar Network** - Cross-system communication

## Technical Details

### Database Schema
The workstation state in Supabase includes:
```json
{
  "id": "reactor_core_state",
  "state": {
    "github_repo": "https://github.com/one2lv-com/lumenis-control",
    "interplanetar_repo": "https://github.com/one2lv-com/interplanetar",
    "station_name": "Reactor_Core",
    "resident_agent": "Lumenis_Agentic_Core"
  }
}
```

### Extension Ports
- FTPS Server: 2121
- WebDAV Server: 4443
- VLC Broadcast: 8443

## Maintenance
- Auto-synced on workstation boot
- Manual sync available via `npm run sync`
- State persisted in Supabase `runtime_states` table
- Events logged to `memory_events` table

---

**🌌 LUMENIS CORE**
**Reactor_Core Workstation**
**Status: ONLINE**
