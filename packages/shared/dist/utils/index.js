"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeContent = exports.isValidRoomId = exports.generateId = void 0;
// Utility functions we'll implement later
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
exports.generateId = generateId;
const isValidRoomId = (roomId) => {
    return typeof roomId === 'string' && roomId.length > 0;
};
exports.isValidRoomId = isValidRoomId;
const sanitizeContent = (content) => {
    return content.replace(/[<>]/g, '');
};
exports.sanitizeContent = sanitizeContent;
//# sourceMappingURL=index.js.map