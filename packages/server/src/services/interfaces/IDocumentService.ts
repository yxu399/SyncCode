import { Document, LineEdit } from '@collab/shared';

export interface IDocumentService {
  getOrCreateDocument(roomId: string): Promise<Document>;
  updateLine(documentId: string, lineEdit: LineEdit): Promise<Document>;
  getDocument(documentId: string): Promise<Document | null>;
}