import React, { useState, useEffect } from 'react';
import { socketService } from '../services/SocketService';

interface EditorProps {
  roomId: string;
}

const Editor: React.FC<EditorProps> = ({ roomId }) => {
  const [lines, setLines] = useState<string[]>(['']);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket server
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      setIsConnected(true);
      socketService.joinRoom(roomId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('document:initial-load', (data) => {
      setLines(data.content);
    });

    socket.on('document:line-updated', (data) => {
      setLines(prevLines => {
        const newLines = [...prevLines];
        newLines[data.lineNumber] = data.content;
        return newLines;
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, [roomId]);

  const handleLineChange = (lineNumber: number, content: string) => {
    // Update local state immediately
    setLines(prevLines => {
      const newLines = [...prevLines];
      newLines[lineNumber] = content;
      return newLines;
    });

    // Send to server
    socketService.editLine(roomId, lineNumber, content);
  };

  const addLine = () => {
    setLines(prevLines => [...prevLines, '']);
  };

  const userInfo = socketService.getUserInfo();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>Room: {roomId}</h2>
        <p>User: {userInfo.username}</p>
        <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={addLine}>Add Line</button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px' }}>
        {lines.map((line, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <span style={{ marginRight: '10px', color: '#666' }}>{index}:</span>
            <input
              type="text"
              value={line}
              onChange={(e) => handleLineChange(index, e.target.value)}
              style={{ width: '400px', fontFamily: 'monospace' }}
              placeholder="Type code here..."
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;