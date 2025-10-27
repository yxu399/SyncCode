export interface Document {
  id: string;
  roomId: string;
  content: string[];  // Array of lines
  lastModified: Date;
  version: number;
}

export interface LineEdit {
  lineNumber: number;
  content: string;
  userId: string;
  timestamp: number;
  clientVersion?: number; // Version the client thinks the document is at
}

export interface DocumentVersion {
  documentId: string;
  version: number;
  changes: LineEdit[];
  timestamp: Date;
}

export interface ConflictError {
  type: 'version_conflict';
  message: string;
  clientVersion: number;
  serverVersion: number;
  conflictingEdit: LineEdit;
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'manual';
  resolvedContent: string[];
  version: number;
}