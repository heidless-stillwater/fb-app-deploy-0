import type { Timestamp } from 'firebase/firestore';

export type ManagedFile = {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  size: number;
  uploadedAt: Date | Timestamp;
  storagePath: string;
  url?: string;
};
