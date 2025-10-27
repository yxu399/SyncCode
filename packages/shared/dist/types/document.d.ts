export interface Document {
    id: string;
    roomId: string;
    content: string[];
    lastModified: Date;
    version: number;
}
export interface LineEdit {
    lineNumber: number;
    content: string;
    userId: string;
    timestamp: number;
    clientVersion?: number;
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
//# sourceMappingURL=document.d.ts.map