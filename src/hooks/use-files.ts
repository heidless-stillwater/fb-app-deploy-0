import { useCallback, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase/config";
import type { FileData, FirestoreFileData, FolderData, FirestoreFolderData } from "@/lib/types";
import { useAuth } from "./use-auth";


export function useFileManager(currentFolderId: string | null = null) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      setFolders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const filesQuery = query(
      collection(db, "files"),
      where("owner", "==", user.uid),
      where("folderId", "==", currentFolderId)
    );

    const foldersQuery = query(
        collection(db, "folders"),
        where("owner", "==", user.uid),
        where("parentId", "==", currentFolderId)
    );

    const unsubscribeFiles = onSnapshot(filesQuery, (querySnapshot) => {
      const userFiles: FileData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreFileData;
        userFiles.push({
          ...data,
          id: doc.id,
          uploadDate: data.uploadDate.toDate(),
        });
      });
      setFiles(userFiles.sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()));
      setLoading(false);
    });

    const unsubscribeFolders = onSnapshot(foldersQuery, (querySnapshot) => {
        const userFolders: FolderData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as FirestoreFolderData;
            userFolders.push({
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
            });
        });
        setFolders(userFolders.sort((a,b) => a.name.localeCompare(b.name)));
    });


    return () => {
        unsubscribeFiles();
        unsubscribeFolders();
    };
  }, [user, currentFolderId]);

  const addFile = useCallback(async (file: File) => {
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);

    const storagePath = `${user.uid}/${currentFolderId || 'root'}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          setUploading(false);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          let thumbnailUrl: string | undefined = undefined;

          if (file.type.startsWith("image/")) {
             thumbnailUrl = downloadURL;
          }

          const fileData: Omit<FirestoreFileData, 'uploadDate'> & { uploadDate: Date } = {
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadURL,
            thumbnail: thumbnailUrl,
            owner: user.uid,
            uploadDate: new Date(),
            folderId: currentFolderId,
          };

          try {
            await addDoc(collection(db, "files"), {
                ...fileData,
                uploadDate: Timestamp.fromDate(fileData.uploadDate)
            });
          } catch (error) {
            console.error("Error adding document: ", error);
          }
          
          setUploading(false);
          resolve();
        }
      );
    });
  }, [user, currentFolderId]);

  const deleteFile = useCallback(async (file: FileData) => {
    if (!user) return;

    try {
      const fileDocRef = doc(db, "files", file.id);
      await deleteDoc(fileDocRef);

      const storageRef = ref(storage, file.url);
      await deleteObject(storageRef);

    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }, [user]);

  const deleteFiles = useCallback(async (files: FileData[]) => {
    if (!user) return;

    const batch = writeBatch(db);

    for (const file of files) {
        const fileDocRef = doc(db, "files", file.id);
        batch.delete(fileDocRef);
        const storageRef = ref(storage, file.url);
        // We will not wait for each deletion to make it faster
        deleteObject(storageRef).catch(err => console.error("Failed to delete from storage", err));
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error bulk deleting files:", error);
    }
  }, [user]);

  const createFolder = useCallback(async (name: string) => {
    if (!user) return;
    try {
        const folderData: Omit<FirestoreFolderData, 'createdAt'|'id'> = {
            name,
            owner: user.uid,
            parentId: currentFolderId,
        };
        await addDoc(collection(db, 'folders'), {
            ...folderData,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error creating folder:", error);
    }
  }, [user, currentFolderId]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user) return;

    // A folder can contain files and subfolders. We need to delete all of them.
    // This needs to be a recursive function.
    const batch = writeBatch(db);

    async function recursiveDelete(folderIdToDelete: string) {
        // Delete files in the current folder
        const filesQuery = query(collection(db, "files"), where("folderId", "==", folderIdToDelete), where("owner", "==", user!.uid));
        const filesSnapshot = await getDocs(filesQuery);
        filesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // Delete subfolders
        const subfoldersQuery = query(collection(db, "folders"), where("parentId", "==", folderIdToDelete), where("owner", "==", user!.uid));
        const subfoldersSnapshot = await getDocs(subfoldersQuery);
        for (const folderDoc of subfoldersSnapshot.docs) {
            await recursiveDelete(folderDoc.id);
        }

        // Delete the folder itself
        const folderDocRef = doc(db, "folders", folderIdToDelete);
        batch.delete(folderDocRef);
    }

    try {
        await recursiveDelete(folderId);
        await batch.commit();

        // Also delete from storage
        const folderStorageRef = ref(storage, `${user.uid}/${folderId}`);

        const deleteStorageFolderContents = async (folderRef: any) => {
            const listResults = await listAll(folderRef);
        
            const deletePromises = listResults.items.map(itemRef => deleteObject(itemRef));
            await Promise.all(deletePromises);
        
            for (const prefix of listResults.prefixes) {
                await deleteStorageFolderContents(prefix);
            }
        }
        await deleteStorageFolderContents(folderStorageRef);

    } catch (error) {
        console.error("Error deleting folder and its contents:", error);
    }
  }, [user]);

  return { files, folders, createFolder, deleteFolder, addFile, deleteFile, deleteFiles, loading, uploading, uploadProgress };
}
