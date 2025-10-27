import { io, Socket } from 'socket.io-client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents,
  generateId 
} from '@collab/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  private userId: string = generateId();
  private username: string = `User-${this.userId.slice(0, 6)}`;
  private documentVersion: number = 1;

  connect(serverUrl: string = 'http://localhost:5000'): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log('Attempting to connect to server at:', serverUrl);
    this.socket = io(serverUrl, {
      timeout: 5000,
      transports: ['websocket', 'polling']
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
    });

    // Document events - update version when received
    this.socket.on('document:initial-load', (data) => {
      console.log('📄 Received initial document:', data);
      this.documentVersion = data.version;
    });

    this.socket.on('document:line-updated', (data) => {
      console.log('✏️ Line updated:', data);
      this.documentVersion = data.version;
    });

    // Room events
    this.socket.on('room:error', (data) => {
      console.error('🚨 Room error:', data);
    });

    // Presence events
    this.socket.on('presence:user-joined', (data) => {
      console.log('👋 User joined:', data);
    });

    this.socket.on('presence:user-left', (data) => {
      console.log('👋 User left:', data);
    });

    return this.socket;
  }

  joinRoom(roomId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    console.log('🏠 Joining room:', roomId, 'as user:', this.username);
    this.socket.emit('room:join', {
      roomId,
      userId: this.userId,
      username: this.username
    });
  }

  editLine(roomId: string, lineNumber: number, content: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    console.log('✏️ Editing line', lineNumber, 'in room', roomId, ':', content, 'with version', this.documentVersion);
    this.socket.emit('document:edit-line', {
      roomId,
      lineNumber,
      content,
      clientVersion: this.documentVersion
    });

    // Optimistically increment version (will be corrected if server sends different version)
    this.documentVersion++;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  getUserInfo() {
    return {
      userId: this.userId,
      username: this.username
    };
  }
}

export const socketService = new SocketService();