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
}

export interface DocumentVersion {
  documentId: string;
  version: number;
  changes: LineEdit[];
  timestamp: Date;
}