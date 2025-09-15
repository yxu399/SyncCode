"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const inversify_1 = require("inversify");
const shared_1 = require("@collab/shared");
const types_1 = require("../container/types");
let DocumentService = class DocumentService {
    cacheRepo;
    constructor(cacheRepo) {
        this.cacheRepo = cacheRepo;
    }
    getCacheKey(roomId) {
        return `doc:${roomId}`;
    }
    async getOrCreateDocument(roomId) {
        const cacheKey = this.getCacheKey(roomId);
        const cached = await this.cacheRepo.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // Create new document
        const document = {
            id: (0, shared_1.generateId)(),
            roomId,
            content: ['// Welcome to the collaborative editor!', '// Start typing...'],
            lastModified: new Date(),
            version: 1
        };
        await this.cacheRepo.set(cacheKey, JSON.stringify(document));
        console.log(`Created new document for room: ${roomId}`);
        return document;
    }
    async updateLine(documentId, lineEdit) {
        // Find document by ID - we need to search by the roomId that was used to create it
        // For now, let's assume documentId is the roomId (we'll improve this later)
        const cacheKey = this.getCacheKey(documentId);
        const cached = await this.cacheRepo.get(cacheKey);
        if (!cached) {
            throw new Error(`Document ${documentId} not found`);
        }
        const document = JSON.parse(cached);
        // Update the specific line
        if (lineEdit.lineNumber >= 0 && lineEdit.lineNumber < document.content.length) {
            document.content[lineEdit.lineNumber] = lineEdit.content;
        }
        else if (lineEdit.lineNumber === document.content.length) {
            // Adding new line
            document.content.push(lineEdit.content);
        }
        document.lastModified = new Date();
        document.version += 1;
        await this.cacheRepo.set(cacheKey, JSON.stringify(document));
        console.log(`Updated line ${lineEdit.lineNumber} in document ${documentId}`);
        return document;
    }
    async getDocument(documentId) {
        const cacheKey = this.getCacheKey(documentId);
        const cached = await this.cacheRepo.get(cacheKey);
        return cached ? JSON.parse(cached) : null;
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.CacheRepository)),
    __metadata("design:paramtypes", [Object])
], DocumentService);
//# sourceMappingURL=DocumentService.js.map