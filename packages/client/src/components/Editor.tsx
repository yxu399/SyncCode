import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/SocketService';
import { PresenceProvider } from '../contexts/PresenceContext';
import PresenceSidebar from './Presence/PresenceSidebar';
import PresenceToastContainer from './Presence/PresenceToastContainer';
import { usePresence } from '../hooks/usePresence';

interface EditorProps {
  roomId: string;
}

/**
 * EditorContent Component
 * Contains the actual editor logic with presence integration
 */
const EditorContent: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [lines, setLines] = useState<string[]>(['']);
  const [isConnected, setIsConnected] = useState(false);
  const [focusedLine, setFocusedLine] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const { updateCursor, setTypingStatus } = usePresence();

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

    socket.on('document:initial-load', data => {
      setLines(data.content);
    });

    socket.on('document:line-updated', data => {
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

    // Update cursor position
    updateCursor(lineNumber, content.length);

    // Set typing status
    setTypingStatus(true, lineNumber);
  };

  const handleLineFocus = (lineNumber: number) => {
    setFocusedLine(lineNumber);
    updateCursor(lineNumber, lines[lineNumber]?.length || 0);
  };

  const handleLineBlur = () => {
    setFocusedLine(null);
    setTypingStatus(false);
  };

  const addLine = () => {
    setLines(prevLines => [...prevLines, '']);
  };

  const userInfo = socketService.getUserInfo();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>Room: {roomId}</h2>
          <p style={{ margin: '0 0 5px 0' }}>User: {userInfo.username}</p>
          <p style={{ margin: 0 }}>
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '10px' }}>
            <button onClick={addLine} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Add Line
            </button>
          </div>

          <div
            ref={editorRef}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '4px',
              position: 'relative',
            }}
          >
            {lines.map((line, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: focusedLine === index ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <span
                  style={{
                    marginRight: '10px',
                    color: '#666',
                    minWidth: '30px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                  }}
                >
                  {index}:
                </span>
                <input
                  type="text"
                  value={line}
                  onChange={e => handleLineChange(index, e.target.value)}
                  onFocus={() => handleLineFocus(index)}
                  onBlur={handleLineBlur}
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                  placeholder="Type code here..."
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Presence Sidebar */}
      <PresenceSidebar defaultOpen={true} collapsible={true} />

      {/* Toast Notifications */}
      <PresenceToastContainer position="bottom-right" maxToasts={3} />
    </div>
  );
};

/**
 * Editor Component
 * Wraps EditorContent with PresenceProvider
 */
const Editor: React.FC<EditorProps> = ({ roomId }) => {
  return (
    <PresenceProvider roomId={roomId}>
      <EditorContent roomId={roomId} />
    </PresenceProvider>
  );
};

export default Editor;
