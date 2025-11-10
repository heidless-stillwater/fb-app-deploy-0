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

export const initialFiles: ManagedFile[] = [
  {
    id: '1',
    name: 'Project_Alpha_Specification.docx',
    type: 'document',
    size: 204800,
    uploadedAt: new Date('2023-10-26T10:00:00Z'),
  },
  {
    id: '2',
    name: 'team-photo-2023.jpg',
    type: 'image',
    size: 2097152,
    uploadedAt: new Date('2023-10-25T15:30:00Z'),
  },
  {
    id: '3',
    name: 'quarterly-report-q3.pdf',
    type: 'document',
    size: 5242880,
    uploadedAt: new Date('2023-10-22T09:00:00Z'),
  },
  {
    id: '4',
    name: 'website-backup.zip',
    type: 'archive',
    size: 15728640,
    uploadedAt: new Date('2023-10-20T18:45:00Z'),
  },
  {
    id: '5',
    name: 'App.tsx',
    type: 'code',
    size: 5120,
    uploadedAt: new Date('2023-10-19T11:20:00Z'),
  },
  {
    id: '6',
    name: 'product-demo.mp4',
    type: 'video',
    size: 52428800,
    uploadedAt: new Date('2023-10-18T14:00:00Z'),
  },
  {
    id: '7',
    name: 'meeting-notes-oct.txt',
    type: 'document',
    size: 10240,
    uploadedAt: new Date('2023-10-17T16:00:00Z'),
  },
    {
    id: '8',
    name: 'user-avatars.tar.gz',
    type: 'archive',
    size: 8388608,
    uploadedAt: new Date('2023-10-15T12:10:00Z'),
  },
  {
    id: '9',
    name: 'podcast-episode-5.mp3',
    type: 'audio',
    size: 26214400,
    uploadedAt: new Date('2023-10-14T08:00:00Z'),
  },
    {
    id: '10',
    name: 'Logo-final-final.png',
    type: 'image',
    size: 76800,
    uploadedAt: new Date('2023-10-12T13:45:00Z'),
  },
];
