# Version-Based Conflict Resolution Implementation

## Overview

This document describes the implementation of version-based concurrency control for real-time collaborative text editing with automatic conflict detection and last-write-wins merge strategy.

## Architecture

### Flow Diagram

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│  (Version   │                    │ (Document   │
│     N)      │                    │  Version N) │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ document:edit-line               │
       │ {lineNumber, content,            │
       │  clientVersion: N}               │
       ├─────────────────────────────────>│
       │                                  │
       │                                  │ ✓ Version Match
       │                                  │   (N == N)
       │                                  │
       │                                  │ Update Document
       │                                  │ Version N → N+1
       │                                  │
       │  document:line-updated           │
       │  {content, version: N+1}         │
       │<─────────────────────────────────┤
       │                                  │
```

### Conflict Detection Flow

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│  (Version   │                    │ (Document   │
│   OUTDATED) │                    │  Version N+1)│
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ document:edit-line               │
       │ {lineNumber, content,            │
       │  clientVersion: N}  (OUTDATED!)  │
       ├─────────────────────────────────>│
       │                                  │
       │                                  │ ✗ Version Conflict
       │                                  │   (N < N+1)
       │                                  │
       │                                  │ Reject Edit
       │                                  │
       │  document:conflict-detected      │
       │  {conflict: {...},               │
       │   currentDocument: {...}}        │
       │<─────────────────────────────────┤
       │                                  │
       │  document:sync-required          │
       │  {reason, currentVersion}        │
       │<─────────────────────────────────┤
       │                                  │
```

## Implementation Details

### 1. Data Structures

#### LineEdit Interface
```typescript
export interface LineEdit {
  lineNumber: number;
  content: string;
  userId: string;
  timestamp: number;
  clientVersion?: number; // NEW: Version the client thinks document is at
}
```

#### ConflictError Interface
```typescript
export interface ConflictError {
  type: 'version_conflict';
  message: string;
  clientVersion: number;
  serverVersion: number;
  conflictingEdit: LineEdit;
}
```

### 2. Socket.IO Events

#### Client → Server

**document:edit-line** (Updated)
```typescript
{
  roomId: string;
  lineNumber: number;
  content: string;
  clientVersion: number; // NEW: Client's current version
}
```

#### Server → Client

**document:conflict-detected** (NEW)
```typescript
{
  conflict: ConflictError;
  currentDocument: {
    content: string[];
    version: number;
  };
}
```

**document:sync-required** (NEW)
```typescript
{
  reason: string;
  currentVersion: number;
}
```

### 3. DocumentService Logic

**File:** `/packages/server/src/services/DocumentService.ts`

#### Conflict Detection Algorithm

```typescript
async updateLine(documentId: string, lineEdit: LineEdit): Promise<Document> {
  const document = await getDocumentFromCache(documentId);

  // VERSION-BASED CONFLICT DETECTION
  if (lineEdit.clientVersion !== undefined) {
    if (lineEdit.clientVersion < document.version) {
      // CLIENT IS BEHIND - CONFLICT!
      throw new DocumentConflictError(
        'Edit rejected: client version behind server',
        conflict,
        document
      );
    }

    if (lineEdit.clientVersion > document.version) {
      // CLIENT IS AHEAD - CORRUPTION!
      throw new Error('Invalid client version');
    }

    // VERSIONS MATCH - PROCEED
  }

  // Apply edit
  document.content[lineEdit.lineNumber] = lineEdit.content;
  document.version += 1;

  await saveDocumentToCache(documentId, document);
  return document;
}
```

### 4. SocketController Conflict Handling

**File:** `/packages/server/src/controllers/SocketController.ts`

```typescript
socket.on('document:edit-line', async (data) => {
  try {
    const updatedDoc = await documentService.updateLine(roomId, {
      lineNumber,
      content,
      userId,
      timestamp: Date.now(),
      clientVersion  // Pass client's version
    });

    // Success - broadcast to all clients
    io.to(roomId).emit('document:line-updated', {
      lineNumber,
      content,
      userId,
      version: updatedDoc.version
    });

  } catch (error) {
    if (error instanceof DocumentConflictError) {
      // CONFLICT - Send current state to client
      socket.emit('document:conflict-detected', {
        conflict: error.conflict,
        currentDocument: {
          content: error.currentDocument.content,
          version: error.currentDocument.version
        }
      });

      socket.emit('document:sync-required', {
        reason: 'Version conflict detected',
        currentVersion: error.currentDocument.version
      });
    }
  }
});
```

## Conflict Resolution Strategy

### Last-Write-Wins (LWW)

The current implementation uses a **last-write-wins** strategy with version checking:

1. **Prevention**: Client must send correct version with each edit
2. **Detection**: Server compares client version with document version
3. **Rejection**: If versions don't match, edit is rejected
4. **Notification**: Client receives conflict event with current document state
5. **Recovery**: Client must sync to latest version before retrying

### Advantages

✅ Simple to implement and understand
✅ No merge conflicts to resolve
✅ Predictable behavior
✅ Fast conflict detection (O(1))
✅ Works well for line-level editing

### Limitations

⚠️ Client must retry after sync
⚠️ Lost updates if client doesn't retry
⚠️ No automatic merge
⚠️ Requires client to track version

## Client Integration Guide

### Client-Side Requirements

1. **Track Document Version**
```typescript
let documentVersion: number = 1;

socket.on('document:initial-load', (data) => {
  documentVersion = data.version;
});

socket.on('document:line-updated', (data) => {
  documentVersion = data.version; // Update on every change
});
```

2. **Send Version with Edits**
```typescript
function editLine(lineNumber: number, content: string) {
  socket.emit('document:edit-line', {
    roomId,
    lineNumber,
    content,
    clientVersion: documentVersion  // Always send current version
  });
}
```

3. **Handle Conflicts**
```typescript
socket.on('document:conflict-detected', (data) => {
  // Conflict! Client is out of sync
  console.warn('Conflict detected:', data.conflict);

  // Sync to current document
  setDocument(data.currentDocument.content);
  documentVersion = data.currentDocument.version;

  // Optionally: retry the edit
  // editLine(originalLineNumber, originalContent);
});

socket.on('document:sync-required', (data) => {
  // Request full document sync
  socket.emit('document:request-sync', { roomId });
});
```

## Testing Scenarios

### Scenario 1: Normal Operation (No Conflict)

```
Time | Client A        | Client B        | Server
-----|-----------------|-----------------|--------
t0   | Version 1       | Version 1       | v1
t1   | Edit line 0     |                 |
t2   | (clientV=1) →   |                 | ✓ Accept
t3   | ← Updated (v2)  | ← Updated (v2)  | v2
t4   | Version 2       | Version 2       | v2
```

### Scenario 2: Conflict Detected

```
Time | Client A        | Client B        | Server
-----|-----------------|-----------------|--------
t0   | Version 1       | Version 1       | v1
t1   | Edit line 0     |                 |
t2   | (clientV=1) →   |                 | ✓ Accept
t3   | ← Updated (v2)  | [missed update] | v2
t4   | Version 2       | Version 1 (old!)| v2
t5   |                 | Edit line 1     |
t6   |                 | (clientV=1) →   | ✗ CONFLICT!
t7   |                 | ← Conflict!     | v2
t8   |                 | Sync to v2      |
t9   |                 | Retry edit      |
```

## Performance Characteristics

- **Conflict Detection**: O(1) - Simple version comparison
- **Memory**: O(1) per document - Only current version stored
- **Network**: +4 bytes per edit (int32 version number)
- **Latency**: No additional latency for successful edits

## Future Enhancements

### Potential Improvements

1. **Operational Transform (OT)**
   - Automatically merge concurrent edits
   - More complex but handles conflicts better
   - Requires transformation functions

2. **CRDT (Conflict-free Replicated Data Types)**
   - Automatic conflict resolution
   - No version checking needed
   - Higher memory overhead

3. **Change History**
   - Store edit history
   - Allow undo/redo
   - Enable time-travel debugging

4. **Automatic Retry**
   - Queue edits on conflict
   - Retry after sync
   - Transparent to user

5. **Optimistic UI Updates**
   - Apply edits immediately
   - Roll back on conflict
   - Better UX but more complex

## Logging and Monitoring

The implementation includes comprehensive logging:

```
✅ Version match (1) - applying edit to line 0
📝 Updated line 0 in document room-123 (v1 → v2)
⚠️ Conflict detected for line 1: { clientVersion: 1, serverVersion: 2 }
```

Monitor these metrics for production:
- **Conflict rate**: Number of conflicts / total edits
- **Retry success rate**: Successful retries / total conflicts
- **Average document version**: Indicates edit frequency
- **Version drift**: Max version difference among clients

## Conclusion

This implementation provides production-ready version-based conflict detection with:

✅ **Automatic conflict detection** - Server checks versions
✅ **Clear conflict notification** - Clients know when they're out of sync
✅ **Simple recovery** - Sync and retry
✅ **Last-write-wins strategy** - Predictable behavior
✅ **Low overhead** - Minimal performance impact

The system is ready for:
- Multi-user collaborative editing
- Real-time synchronization
- Concurrent edit detection
- Production deployment

Next steps for enhancement:
1. Implement automatic retry on client
2. Add conflict resolution UI
3. Consider OT/CRDT for better merging
4. Add edit history and undo/redo
