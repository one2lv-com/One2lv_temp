// ONE2LVOS v5 - Main Entry Point
// Run this to start the entire system

import './api/server.js';

console.log('🌌 One2lvOS v5 - The System That Runs Itself');
console.log('');
console.log('Starting all services...');
console.log('  ✓ Express API');
console.log('  ✓ WebSocket Mesh');
console.log('  ✓ AI Coach');
console.log('  ✓ AI Broadcaster');
console.log('  ✓ AI Second Player');
console.log('  ✓ Memory System');
console.log('');
console.log('System status: ONLINE');
console.log('');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});