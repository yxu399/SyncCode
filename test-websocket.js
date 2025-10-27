const io = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  socket.emit('room:join', {
    roomId: 'test-room-123',
    userId: 'test-user-1',
    username: 'TestUser1'
  });
});

socket.on('document:initial-load', (data) => {
  console.log('✅ Received initial document:', JSON.stringify(data));
  
  socket.emit('document:edit-line', {
    roomId: 'test-room-123',
    lineNumber: 0,
    content: 'Hello from test!',
    clientVersion: data.version
  });
});

socket.on('document:line-updated', (data) => {
  console.log('✅ Document updated:', JSON.stringify(data));
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ Test completed successfully!');
    process.exit(0);
  }, 1000);
});

socket.on('room:error', (error) => {
  console.error('❌ Room error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

setTimeout(() => {
  console.log('⏱️ Timeout - test taking too long');
  process.exit(1);
}, 10000);
