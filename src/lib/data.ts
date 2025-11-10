import type { ManagedFile } from './types';

export const AVAILABLE_TAGS: ManagedFile['type'][] = [
  'image',
  'document',
  'video',
  'audio',
  'archive',
  'code',
  'other',
];

export const initialFiles: ManagedFile[] = [];
