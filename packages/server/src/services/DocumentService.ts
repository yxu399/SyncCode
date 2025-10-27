import { injectable, inject } from 'inversify';
import { Document, LineEdit, generateId, ConflictError } from '@collab/shared';
import { TYPES } from '../container/types';
import { ICacheRepository } from '../repositories/interfaces/ICacheRepository';
import { IDocumentService } from './interfaces/IDocumentService';

export class DocumentConflictError extends Error {
  constructor(
    message: string,
    public conflict: ConflictError,
    public currentDocument: Document
  ) {
    super(message);
    this.name = 'DocumentConflictError';
  }
}

@injectable()
export class DocumentService implements IDocumentService {
  constructor(
    @inject(TYPES.CacheRepository) private cacheRepo: ICacheRepository
  ) {}

  private getCacheKey(roomId: string): string {
    return `doc:${roomId}`;
  }

  async getOrCreateDocument(roomId: string): Promise<Document> {
    const cacheKey = this.getCacheKey(roomId);
    const cached = await this.cacheRepo.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Create new document
    const document: Document = {
      id: generateId(),
      roomId,
      content: ['// Welcome to the collaborative editor!', '// Start typing...'],
      lastModified: new Date(),
      version: 1
    };
    
    await this.cacheRepo.set(cacheKey, JSON.stringify(document));
    console.log(`Created new document for room: ${roomId}`);
    return document;
  }

  async updateLine(documentId: string, lineEdit: LineEdit): Promise<Document> {
    // Find document by ID - we need to search by the roomId that was used to create it
    // For now, let's assume documentId is the roomId (we'll improve this later)
    const cacheKey = this.getCacheKey(documentId);
    const cached = await this.cacheRepo.get(cacheKey);

    if (!cached) {
      throw new Error(`Document ${documentId} not found`);
    }

    const document: Document = JSON.parse(cached);

    // VERSION-BASED CONFLICT DETECTION
    // If client provides their version, check for conflicts
    if (lineEdit.clientVersion !== undefined) {
      if (lineEdit.clientVersion < document.version) {
        // Client is behind - conflict detected!
        const conflict: ConflictError = {
          type: 'version_conflict',
          message: `Edit rejected: client version (${lineEdit.clientVersion}) is behind server version (${document.version})`,
          clientVersion: lineEdit.clientVersion,
          serverVersion: document.version,
          conflictingEdit: lineEdit
        };

        console.warn(`⚠️ Conflict detected for line ${lineEdit.lineNumber}:`, {
          clientVersion: lineEdit.clientVersion,
          serverVersion: document.version,
          userId: lineEdit.userId
        });

        throw new DocumentConflictError(conflict.message, conflict, document);
      }

      if (lineEdit.clientVersion > document.version) {
        // Client is ahead - this shouldn't happen, but handle gracefully
        console.error(`❌ Client version (${lineEdit.clientVersion}) is ahead of server (${document.version}). Possible data corruption.`);
        throw new Error(`Invalid client version: ${lineEdit.clientVersion} > ${document.version}`);
      }

      // Versions match - proceed with update
      console.log(`✅ Version match (${lineEdit.clientVersion}) - applying edit to line ${lineEdit.lineNumber}`);
    }

    // Update the specific line
    if (lineEdit.lineNumber >= 0 && lineEdit.lineNumber < document.content.length) {
      document.content[lineEdit.lineNumber] = lineEdit.content;
    } else if (lineEdit.lineNumber === document.content.length) {
      // Adding new line
      document.content.push(lineEdit.content);
    } else {
      throw new Error(`Invalid line number: ${lineEdit.lineNumber} (document has ${document.content.length} lines)`);
    }

    document.lastModified = new Date();
    document.version += 1;

    await this.cacheRepo.set(cacheKey, JSON.stringify(document));
    console.log(`📝 Updated line ${lineEdit.lineNumber} in document ${documentId} (v${document.version - 1} → v${document.version})`);
    return document;
  }

  async getDocument(documentId: string): Promise<Document | null> {
    const cacheKey = this.getCacheKey(documentId);
    const cached = await this.cacheRepo.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
}