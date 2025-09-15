import { injectable, inject } from 'inversify';
import { Document, LineEdit, generateId } from '@collab/shared';
import { TYPES } from '../container/types';
import { ICacheRepository } from '../repositories/interfaces/ICacheRepository';
import { IDocumentService } from './interfaces/IDocumentService';

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
    
    // Update the specific line
    if (lineEdit.lineNumber >= 0 && lineEdit.lineNumber < document.content.length) {
      document.content[lineEdit.lineNumber] = lineEdit.content;
    } else if (lineEdit.lineNumber === document.content.length) {
      // Adding new line
      document.content.push(lineEdit.content);
    }
    
    document.lastModified = new Date();
    document.version += 1;
    
    await this.cacheRepo.set(cacheKey, JSON.stringify(document));
    console.log(`Updated line ${lineEdit.lineNumber} in document ${documentId}`);
    return document;
  }

  async getDocument(documentId: string): Promise<Document | null> {
    const cacheKey = this.getCacheKey(documentId);
    const cached = await this.cacheRepo.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
}