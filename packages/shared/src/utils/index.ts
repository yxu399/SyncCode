// Utility functions we'll implement later
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const isValidRoomId = (roomId: string): boolean => {
  return typeof roomId === 'string' && roomId.length > 0;
};

export const sanitizeContent = (content: string): string => {
  return content.replace(/[<>]/g, '');
};