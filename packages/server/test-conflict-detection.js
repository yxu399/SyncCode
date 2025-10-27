/**
 * Test script for version-based conflict detection
 * Simulates two clients editing the same document with version conflicts
 */

const io = require('socket.io-client');

// Create two client connections
const client1 = io('http://localhost:5000');
const client2 = io('http://localhost:5000');

const roomId = 'test-conflict-room';
let documentVersion = 1; // Track document version

console.log('🧪 Starting conflict detection test...\n');

// Client 1 joins room
client1.on('connect', () => {
  console.log('✅ Client 1 connected');

  client1.emit('room:join', {
    roomId: roomId,
    userId: 'user-1',
    username: 'Alice'
  });
});

// Client 2 joins room
client2.on('connect', () => {
  console.log('✅ Client 2 connected');

  setTimeout(() => {
    client2.emit('room:join', {
      roomId: roomId,
      userId: 'user-2',
      username: 'Bob'
    });
  }, 500);
});

// Client 1 receives initial document
client1.on('document:initial-load', (data) => {
  console.log(`\n📄 Client 1 received initial document (version ${data.version})`);
  console.log(`   Content: ${JSON.stringify(data.content)}`);
  documentVersion = data.version;

  // Client 1 edits line 0 with correct version
  setTimeout(() => {
    console.log(`\n📝 Client 1 editing line 0 with version ${documentVersion}`);
    client1.emit('document:edit-line', {
      roomId: roomId,
      lineNumber: 0,
      content: '// Alice was here!',
      clientVersion: documentVersion
    });
  }, 1000);
});

// Client 2 receives initial document
client2.on('document:initial-load', (data) => {
  console.log(`\n📄 Client 2 received initial document (version ${data.version})`);
  console.log(`   Content: ${JSON.stringify(data.content)}`);

  // Client 2 tries to edit with OLD version (will cause conflict)
  setTimeout(() => {
    const oldVersion = data.version; // This will be outdated after Client 1's edit
    console.log(`\n📝 Client 2 editing line 1 with OLD version ${oldVersion} (should conflict!)`);
    client2.emit('document:edit-line', {
      roomId: roomId,
      lineNumber: 1,
      content: '// Bob tried to edit with old version',
      clientVersion: oldVersion
    });
  }, 2000);

  // Client 2 then tries again with correct version
  setTimeout(() => {
    console.log(`\n📝 Client 2 retrying with CURRENT version ${documentVersion + 1}`);
    client2.emit('document:edit-line', {
      roomId: roomId,
      lineNumber: 1,
      content: '// Bob edited after sync!',
      clientVersion: documentVersion + 1
    });
  }, 3500);
});

// Both clients listen for successful updates
client1.on('document:line-updated', (data) => {
  console.log(`\n✅ Client 1 received update: line ${data.lineNumber} (v${data.version})`);
  console.log(`   Content: "${data.content}"`);
  console.log(`   By: ${data.userId}`);
  documentVersion = data.version;
});

client2.on('document:line-updated', (data) => {
  console.log(`\n✅ Client 2 received update: line ${data.lineNumber} (v${data.version})`);
  console.log(`   Content: "${data.content}"`);
  console.log(`   By: ${data.userId}`);
  documentVersion = data.version;
});

// Client 2 listens for conflicts
client2.on('document:conflict-detected', (data) => {
  console.log(`\n⚠️  CONFLICT DETECTED for Client 2!`);
  console.log(`   Client version: ${data.conflict.clientVersion}`);
  console.log(`   Server version: ${data.conflict.serverVersion}`);
  console.log(`   Message: ${data.conflict.message}`);
  console.log(`   Current document version: ${data.currentDocument.version}`);
  console.log(`   Current content: ${JSON.stringify(data.currentDocument.content)}`);
});

client2.on('document:sync-required', (data) => {
  console.log(`\n🔄 SYNC REQUIRED for Client 2`);
  console.log(`   Reason: ${data.reason}`);
  console.log(`   Current version: ${data.currentVersion}`);
});

// Error handlers
client1.on('room:error', (data) => {
  console.error(`❌ Client 1 error: ${data.message} (${data.code})`);
});

client2.on('room:error', (data) => {
  console.error(`❌ Client 2 error: ${data.message} (${data.code})`);
});

// Cleanup after 5 seconds
setTimeout(() => {
  console.log('\n\n🏁 Test complete! Disconnecting...');
  client1.disconnect();
  client2.disconnect();
  process.exit(0);
}, 5000);
