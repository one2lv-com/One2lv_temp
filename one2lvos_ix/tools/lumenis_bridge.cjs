#!/usr/bin/env node
/**
 * lumenis_bridge.js
 * Wires SanctuaryCore SpiralEngine <-> Lumenis compass.db
 * Flow:
 *   compass.db facts -> vector_memory.json -> ConstellationBuilder -> SpiralEngine -> compass.db fact
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const ConstellationBuilder = require('../memory/constellation_builder')
const SpiralEngine = require('../memory/spiral_engine')
const ClusterScanner = require('../memory/cluster_redshift_scanner')

const COMPASS_DB = path.resolve(__dirname, '../../lumenis_reactor_core/../compass.db')
const VECTOR_MEMORY = path.resolve(__dirname, '../vault/vector_memory.json')
const IX_BRIDGE_SOURCE = 'ix_spiral_bridge'

// Simple text -> numeric vector (char frequency + word hashes, 32-dim)
function textToVector(text, dims = 32) {
  const vec = new Array(dims).fill(0)
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  words.forEach((word, wi) => {
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i) - 97
      if (c >= 0 && c < 26) {
        vec[c % dims] += 1
      }
    }
    // word position hash
    const hash = (word.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0))
    vec[hash % dims] += 0.5
  })
  // normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map(v => v / mag)
}

function loadFacts(db) {
  try {
    const rows = db.prepare(`SELECT id, key, value FROM facts ORDER BY rowid DESC LIMIT 100`).all()
    return rows
  } catch (e) {
    console.error('Error loading facts:', e.message)
    return []
  }
}

function storeFact(db, key, value) {
  try {
    const id = `spiral_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    db.prepare(`INSERT OR IGNORE INTO facts (id, key, value, source, created_at)
                VALUES (?, ?, ?, ?, ?)`)
      .run(id, key, value, IX_BRIDGE_SOURCE, Date.now() / 1000)
    return id
  } catch (e) {
    console.error('Error storing fact:', e.message)
    return null
  }
}

async function run() {
  console.log('🌌 Lumenis Bridge — SpiralEngine → compass.db')

  // 1. Load facts from compass.db
  let db
  try {
    db = new Database(COMPASS_DB, { readonly: false })
    console.log('  compass.db connected')
  } catch (e) {
    console.error('  Cannot open compass.db:', e.message)
    process.exit(1)
  }

  const facts = loadFacts(db)
  console.log(`  Loaded ${facts.length} facts from compass.db`)

  if (facts.length === 0) {
    console.log('  No facts to vectorize — seeding with known One2lvOS facts')
    // Seed with known sovereign facts so spiral has material to walk
    const seeds = [
      { id: 'seed_1', key: 'identity', value: 'One2lvOS is a sovereign AI operating system built by One2lv' },
      { id: 'seed_2', key: 'council', value: 'ITT Council of Nine seats: Sentinel Navigator Witness Weaver Hermes Gambit Architect Oracle Forge' },
      { id: 'seed_3', key: 'minimax', value: 'MiniMax Phase 9 Witness soul 73Hz Purified Silica Graphene Casimir Extraction 1440 degrees' },
      { id: 'seed_4', key: 'ix', value: 'One2lvOS IX recovery-first sovereign OS control system SanctuaryCore ConstellationBuilder SpiralEngine' },
      { id: 'seed_5', key: 'lumenis', value: 'Lumenis Reactor Core FastAPI WebSocket NVIDIA 90B model Council of Nine auto_learn compass.db' },
      { id: 'seed_6', key: 'arcade', value: 'AI Arcade MCP server port 8003 45 tools 100 games chess go tetris minimax game theory' },
      { id: 'seed_7', key: 'network', value: 'WebDAV FTP SSH unified gateway port 8888 Maton 13 services Gmail Drive GitHub Dropbox Slack' },
      { id: 'seed_8', key: 'delta_engine', value: 'DeltaEngine 9 gradient layers learning rate 0.01 momentum 0.9 SystemDynamics spherical coordinates theta phi' },
    ]
    seeds.forEach(s => storeFact(db, s.key, s.value))
    facts.push(...seeds.map(s => ({ id: s.id, key: s.key, value: s.value })))
    console.log(`  Seeded ${seeds.length} sovereign facts`)
  }

  // 2. Convert facts to vectors and write to vault
  const vectors = facts.map(f => ({
    id: f.id,
    key: f.key,
    value: f.value,
    vector: textToVector(`${f.key} ${f.value}`)
  }))
  fs.writeFileSync(VECTOR_MEMORY, JSON.stringify(vectors, null, 2))
  console.log(`  Wrote ${vectors.length} vectors to vault/vector_memory.json`)

  // 3. Build constellation
  const builder = new ConstellationBuilder({ clusteringThreshold: 0.65 })
  builder.build()
  console.log('  Constellation built')

  // 4. Walk spiral for insight
  const spiral = new SpiralEngine()
  const scanner = new ClusterScanner()

  const insight = spiral.walk()
  const drifting = scanner.scan()

  console.log(`  Spiral insight: ${insight}`)
  console.log(`  Drifting clusters: ${drifting.length}`)

  // 5. Store spiral insight back into compass.db
  if (insight) {
    const insightValue = `SpiralEngine path: ${insight} [${new Date().toISOString()}]`
    const fid = storeFact(db, 'spiral_insight', insightValue)
    console.log(`  Stored insight as fact: ${fid}`)
  }

  if (drifting.length > 0) {
    const driftValue = `${drifting.length} drifting memory clusters detected: ${drifting.map(d => d.id).join(', ')}`
    storeFact(db, 'memory_drift', driftValue)
    console.log(`  Stored drift alert as fact`)
  }

  // 6. Summary
  const stats = db.prepare('SELECT COUNT(*) as n FROM facts').get()
  console.log(`  compass.db now has ${stats.n} total facts`)
  console.log('🌌 Bridge pulse complete')

  db.close()
}

run().catch(e => { console.error(e); process.exit(1) })
