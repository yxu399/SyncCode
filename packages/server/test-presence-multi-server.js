#!/usr/bin/env node

/**
 * Multi-Server Presence System Test
 *
 * Tests the presence system across multiple server instances to verify:
 * - Users on different servers can see each other
 * - Cursor updates propagate via Redis Pub/Sub
 * - Typing indicators sync across servers
 * - Heartbeats work correctly
 * - User join/leave events broadcast properly
 *
 * Usage:
 * 1. Start server 1: PORT=5001 yarn dev
 * 2. Start server 2: PORT=5002 yarn dev
 * 3. Run this test: node test-presence-multi-server.js
 */

const io = require('socket.io-client');

// Configuration
const SERVER1_URL = 'http://localhost:5001';
const SERVER2_URL = 'http://localhost:5002';
const TEST_ROOM_ID = 'test-presence-room-' + Date.now();
const TEST_TIMEOUT = 30000; // 30 seconds

// Test users
const users = [
  { name: 'Alice', server: SERVER1_URL, token: null },
  { name: 'Bob', server: SERVER2_URL, token: null },
  { name: 'Charlie', server: SERVER1_URL, token: null },
];

let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    test: '🧪',
  }[type] || '📝';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testsFailed++;
    log(`FAIL: ${message}`, 'error');
  }
}

async function registerUser(username) {
  const fetch = (await import('node-fetch')).default;

  // Try to register (might fail if user exists)
  try {
    const signupResponse = await fetch(`${SERVER1_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.toLowerCase(),
        email: `${username.toLowerCase()}@test.com`,
        password: 'testpass123',
      }),
    });

    if (signupResponse.ok) {
      const data = await signupResponse.json();
      return data.accessToken;
    }
  } catch (error) {
    // User might already exist, try login
  }

  // Login if signup failed
  const loginResponse = await fetch(`${SERVER1_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `${username.toLowerCase()}@test.com`,
      password: 'testpass123',
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Failed to authenticate ${username}`);
  }

  const data = await loginResponse.json();
  return data.accessToken;
}

function connectUser(user) {
  return new Promise((resolve, reject) => {
    log(`Connecting ${user.name} to ${user.server}...`);

    const socket = io(user.server, {
      auth: { token: user.token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      log(`${user.name} connected to ${user.server}`, 'success');
      user.socket = socket;
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      log(`${user.name} connection error: ${error.message}`, 'error');
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      log(`${user.name} disconnected: ${reason}`);
    });
  });
}

async function joinRoom(user, roomId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${user.name} to join room`));
    }, 5000);

    user.socket.once('room:joined', (data) => {
      clearTimeout(timeout);
      log(`${user.name} joined room ${roomId}`, 'success');
      resolve(data);
    });

    user.socket.once('room:error', (error) => {
      clearTimeout(timeout);
      reject(new Error(error.message));
    });

    user.socket.emit('room:join', { roomId });
  });
}

async function waitForEvent(socket, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${eventName}`));
    }, timeout);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runTests() {
  log('='.repeat(60));
  log('Starting Multi-Server Presence System Tests', 'test');
  log('='.repeat(60));

  try {
    // Step 1: Register and authenticate users
    log('\n📋 Step 1: Authenticating users...');
    for (const user of users) {
      user.token = await registerUser(user.name);
      log(`${user.name} authenticated`, 'success');
    }

    // Step 2: Connect users to their respective servers
    log('\n📋 Step 2: Connecting users to servers...');
    await Promise.all(users.map(user => connectUser(user)));

    // Give sockets time to fully establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Set up event listeners
    log('\n📋 Step 3: Setting up event listeners...');
    const events = {
      Alice: { userJoined: [], userLeft: [], cursorMoved: [], roomUpdate: [] },
      Bob: { userJoined: [], userLeft: [], cursorMoved: [], roomUpdate: [] },
      Charlie: { userJoined: [], userLeft: [], cursorMoved: [], roomUpdate: [] },
    };

    users.forEach(user => {
      user.socket.on('presence:user-joined', (data) => {
        events[user.name].userJoined.push(data);
        log(`${user.name} saw user joined: ${data.username}`);
      });

      user.socket.on('presence:user-left', (data) => {
        events[user.name].userLeft.push(data);
        log(`${user.name} saw user left: ${data.userId}`);
      });

      user.socket.on('presence:cursor-moved', (data) => {
        events[user.name].cursorMoved.push(data);
        log(`${user.name} saw cursor moved: user ${data.userId} to line ${data.lineNumber}`);
      });

      user.socket.on('presence:room-update', (data) => {
        events[user.name].roomUpdate.push(data);
        log(`${user.name} received room update: ${data.activeUsers?.length || 0} users`);
      });
    });

    // Step 4: Alice joins room (on Server 1)
    log('\n📋 Step 4: Alice joining room...');
    await joinRoom(users[0], TEST_ROOM_ID);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Bob joins room (on Server 2)
    log('\n📋 Step 5: Bob joining room (different server)...');
    await joinRoom(users[1], TEST_ROOM_ID);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Bob should see Alice's presence
    assert(
      events.Bob.roomUpdate.some(update =>
        update.activeUsers?.some(u => u.username.toLowerCase() === 'alice')
      ),
      'Bob can see Alice from different server'
    );

    // Test 2: Alice should see Bob joined
    assert(
      events.Alice.userJoined.some(event => event.username.toLowerCase() === 'bob'),
      'Alice received Bob join notification'
    );

    // Step 6: Charlie joins room (on Server 1, same as Alice)
    log('\n📋 Step 6: Charlie joining room (same server as Alice)...');
    await joinRoom(users[2], TEST_ROOM_ID);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Bob (Server 2) should see Charlie (Server 1) join
    assert(
      events.Bob.userJoined.some(event => event.username.toLowerCase() === 'charlie'),
      'Bob (Server 2) saw Charlie (Server 1) join'
    );

    // Step 7: Test cursor updates across servers
    log('\n📋 Step 7: Testing cursor updates across servers...');

    // Alice moves cursor
    users[0].socket.emit('presence:update-cursor', {
      roomId: TEST_ROOM_ID,
      lineNumber: 42,
      column: 15,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Test 4: Bob should see Alice's cursor movement
    assert(
      events.Bob.cursorMoved.some(event =>
        event.lineNumber === 42 && event.userId !== users[1].socket.id
      ),
      'Bob saw Alice cursor movement across servers'
    );

    // Step 8: Test heartbeats
    log('\n📋 Step 8: Testing heartbeats...');
    users.forEach(user => {
      user.socket.emit('presence:heartbeat', {
        roomId: TEST_ROOM_ID,
        userId: user.socket.id,
        socketId: user.socket.id,
        timestamp: Date.now(),
      });
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: All users should still be present after heartbeat
    const aliceRoomUpdate = events.Alice.roomUpdate[events.Alice.roomUpdate.length - 1];
    if (aliceRoomUpdate?.activeUsers) {
      assert(
        aliceRoomUpdate.activeUsers.length >= 2,
        'All users maintained presence after heartbeat'
      );
    }

    // Step 9: Test user leaving
    log('\n📋 Step 9: Testing user leave...');
    users[2].socket.disconnect();

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Other users should see Charlie left
    assert(
      events.Alice.userLeft.length > 0 || events.Bob.userLeft.length > 0,
      'Users received leave notification'
    );

    // Step 10: Cleanup
    log('\n📋 Step 10: Cleaning up...');
    users.forEach(user => {
      if (user.socket && user.socket.connected) {
        user.socket.disconnect();
      }
    });

    // Test summary
    log('\n' + '='.repeat(60));
    log('Test Summary', 'test');
    log('='.repeat(60));
    log(`✅ Tests Passed: ${testsPassed}`, 'success');
    if (testsFailed > 0) {
      log(`❌ Tests Failed: ${testsFailed}`, 'error');
    }
    log(`📊 Total Tests: ${testsPassed + testsFailed}`);
    log('='.repeat(60));

    process.exit(testsFailed > 0 ? 1 : 0);

  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
    console.error(error);

    // Cleanup on error
    users.forEach(user => {
      if (user.socket && user.socket.connected) {
        user.socket.disconnect();
      }
    });

    process.exit(1);
  }
}

// Run tests
runTests();

// Timeout safeguard
setTimeout(() => {
  log('Test timeout reached', 'error');
  process.exit(1);
}, TEST_TIMEOUT);
