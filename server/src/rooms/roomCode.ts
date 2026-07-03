import { ROOM_CODE_LENGTH } from '@focussync/shared';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[index] ?? 'A';
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  return [...code.toUpperCase()].every((char) => CODE_CHARS.includes(char));
}
