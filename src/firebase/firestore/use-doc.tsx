'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface UseDocOptions {
  idField?: string;
  snapshotListenOptions?: {
    includeMetadataChanges: boolean;
  };
}

export function useDoc<T>(
  docRef: DocumentReference<T> | null,
  options?: UseDocOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: options?.snapshotListenOptions?.includeMetadataChanges },
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
           if (options?.idField) {
            (docData as any)[options.idField] = snapshot.id;
          }
          setData(docData);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef, options?.idField, options?.snapshotListenOptions]);

  return { data, loading, error };
}
