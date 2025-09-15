import React, { useState } from 'react';
import Editor from './components/Editor';

function App() {
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const joinRoom = () => {
    if (roomId.trim()) {
      setCurrentRoom(roomId.trim());
    }
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setRoomId('');
  };

  if (currentRoom) {
    return (
      <div>
        <button 
          onClick={leaveRoom}
          style={{ margin: '20px', padding: '10px 20px' }}
        >
          Leave Room
        </button>
        <Editor roomId={currentRoom} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Collaborative Code Editor</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>Join a Room</h3>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter room ID (e.g., test-room)"
          style={{ padding: '10px', marginRight: '10px', width: '200px' }}
          onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
        />
        <button 
          onClick={joinRoom}
          style={{ padding: '10px 20px' }}
          disabled={!roomId.trim()}
        >
          Join Room
        </button>
      </div>
      
      <div style={{ color: '#666', fontSize: '14px' }}>
        <p>Instructions:</p>
        <ul>
          <li>Enter a room ID and click "Join Room"</li>
          <li>Open multiple browser tabs with the same room ID to test collaboration</li>
          <li>Make sure the server is running on http://localhost:5000</li>
        </ul>
      </div>
    </div>
  );
}

export default App;