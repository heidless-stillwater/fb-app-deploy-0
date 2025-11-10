import type { Timestamp } from "firebase/firestore";

export type FileData = {
  id: string;
  name: string;
  size: number; // in bytes
  type: string;
  uploadDate: Date;
  thumbnail?: string;
  url: string;
  owner: string;
  folderId: string | null;
};

export type FirestoreFileData = Omit<FileData, 'uploadDate' | 'id'> & {
  uploadDate: Timestamp;
};

export type FolderData = {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  parentId: string | null;
}

export type FirestoreFolderData = Omit<FolderData, 'createdAt' | 'id'> & {
    createdAt: Timestamp;
};

export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: Date;
    attachmentUrl?: string;
    attachmentName?: string;
}

export type FirestoreContactMessage = Omit<ContactMessage, 'createdAt' | 'id'> & {
    createdAt: Timestamp;
}

export type TransformImageInput = {
    prompt: string;
    imageAsDataUri: string;
};

export type TransformImageOutput = {
    imageAsDataUri: string;
};

export type NanoRecord = {
    id: string;
    userId: string;
    originalImageUrl: string;
    transformedImageUrl: string;
    originalFileName: string;
    timestamp: Date;
};

export type FirestoreNanoRecord = Omit<NanoRecord, 'id' | 'timestamp'> & {
    timestamp: Timestamp;
};
