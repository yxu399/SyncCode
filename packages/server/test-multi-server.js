/**
 * Test script for Redis Pub/Sub multi-server coordination
 *
 * This script tests that multiple server instances can coordinate
 * WebSocket events via Redis pub/sub messaging.
 *
 * Setup:
 * 1. Start Server 1 on port 5001: PORT=5001 npm run dev
 * 2. Start Server 2 on port 5002: PORT=5002 npm run dev
 * 3. Run this test: node test-multi-server.js
 *
 * Expected behavior:
 * - Client A connects to Server 1
 * - Client B connects to Server 2
 * - Both clients join the same room
 * - When Client A sends an edit, Client B receives it (via Redis pub/sub)
 */

const io = require('socket.io-client');

const SERVER_1 = 'http://localhost:5001';
const SERVER_2 = 'http://localhost:5002';
const ROOM_ID = 'multi-server-test-room';

console.log('🧪 Testing Multi-Server Coordination with Redis Pub/Sub\n');
console.log('📋 Test Setup:');
console.log(`   Server 1: ${SERVER_1}`);
console.log(`   Server 2: ${SERVER_2}`);
console.log(`   Room ID: ${ROOM_ID}\n`);

// Create two clients connected to different servers
const clientA = io(SERVER_1, {
  transports: ['websocket'],
  reconnection: false
});

const clientB = io(SERVER_2, {
  transports: ['websocket'],
  reconnection: false
});

let testsPassed = 0;
let testsFailed = 0;

// Track document state
let documentVersion = 1;
let clientAReceivedUpdate = false;
let clientBReceivedUpdate = false;

// Client A setup
clientA.on('connect', () => {
  console.log(`✅ Client A connected to Server 1 (${clientA.id})`);

  clientA.emit('room:join', {
    roomId: ROOM_ID,
    userId: 'client-a',
    username: 'Alice'
  });
});

clientA.on('document:initial-load', (data) => {
  console.log(`\n📄 Client A received initial document (v${data.version})`);
  documentVersion = data.version;

  // Wait a bit, then Client A will edit
  setTimeout(() => {
    console.log(`\n📝 Client A (Server 1) editing line 0 with version ${documentVersion}`);
    clientA.emit('document:edit-line', {
      roomId: ROOM_ID,
      lineNumber: 0,
      content: '// Alice edited from Server 1',
      clientVersion: documentVersion
    });
  }, 1500);
});

clientA.on('document:line-updated', (data) => {
  clientAReceivedUpdate = true;
  documentVersion = data.version;

  console.log(`\n✅ Client A received update from ${data.userId}:`);
  console.log(`   Line: ${data.lineNumber}`);
  console.log(`   Content: "${data.content}"`);
  console.log(`   Version: ${data.version}`);

  if (data.userId === 'client-b') {
    console.log(`\n🎉 SUCCESS: Client A (Server 1) received edit from Client B (Server 2)!`);
    console.log(`   ✓ Redis Pub/Sub is working correctly!`);
    testsPassed++;
  }
});

// Client B setup
clientB.on('connect', () => {
  console.log(`✅ Client B connected to Server 2 (${clientB.id})`);

  setTimeout(() => {
    clientB.emit('room:join', {
      roomId: ROOM_ID,
      userId: 'client-b',
      username: 'Bob'
    });
  }, 500);
});

clientB.on('document:initial-load', (data) => {
  console.log(`\n📄 Client B received initial document (v${data.version})`);
  documentVersion = data.version;

  // Wait for Client A's edit, then Client B will edit
  setTimeout(() => {
    console.log(`\n📝 Client B (Server 2) editing line 1 with version ${documentVersion}`);
    clientB.emit('document:edit-line', {
      roomId: ROOM_ID,
      lineNumber: 1,
      content: '// Bob edited from Server 2',
      clientVersion: documentVersion
    });
  }, 3000);
});

clientB.on('document:line-updated', (data) => {
  clientBReceivedUpdate = true;
  documentVersion = data.version;

  console.log(`\n✅ Client B received update from ${data.userId}:`);
  console.log(`   Line: ${data.lineNumber}`);
  console.log(`   Content: "${data.content}"`);
  console.log(`   Version: ${data.version}`);

  if (data.userId === 'client-a') {
    console.log(`\n🎉 SUCCESS: Client B (Server 2) received edit from Client A (Server 1)!`);
    console.log(`   ✓ Redis Pub/Sub is working correctly!`);
    testsPassed++;
  }
});

// Error handlers
clientA.on('connect_error', (error) => {
  console.error(`❌ Client A connection error: ${error.message}`);
  console.error(`   Make sure Server 1 is running on port 5001`);
  testsFailed++;
});

clientB.on('connect_error', (error) => {
  console.error(`❌ Client B connection error: ${error.message}`);
  console.error(`   Make sure Server 2 is running on port 5002`);
  testsFailed++;
});

clientA.on('room:error', (data) => {
  console.error(`❌ Client A room error: ${data.message}`);
  testsFailed++;
});

clientB.on('room:error', (data) => {
  console.error(`❌ Client B room error: ${data.message}`);
  testsFailed++;
});

// Test summary after 8 seconds (give more time for cross-server updates)
setTimeout(() => {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  if (testsPassed === 2) {
    console.log(`\n✅ ALL TESTS PASSED (${testsPassed}/2)`);
    console.log('\n🎉 Multi-server coordination is working!');
    console.log('   ✓ Redis Pub/Sub is properly configured');
    console.log('   ✓ Server instances can coordinate WebSocket events');
    console.log('   ✓ Clients on different servers can collaborate in real-time');
  } else {
    console.log(`\n⚠️  SOME TESTS FAILED (${testsPassed}/2 passed)`);

    if (!clientAReceivedUpdate) {
      console.log('   ✗ Client A did not receive updates');
    }
    if (!clientBReceivedUpdate) {
      console.log('   ✗ Client B did not receive updates');
    }

    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Ensure both servers are running:');
    console.log('      Terminal 1: PORT=5001 npm run dev');
    console.log('      Terminal 2: PORT=5002 npm run dev');
    console.log('   2. Verify Redis is running: docker ps | grep redis');
    console.log('   3. Check server logs for Redis connection errors');
  }

  console.log('\n🏁 Disconnecting clients...\n');
  clientA.disconnect();
  clientB.disconnect();

  process.exit(testsPassed === 2 ? 0 : 1);
}, 8000);
