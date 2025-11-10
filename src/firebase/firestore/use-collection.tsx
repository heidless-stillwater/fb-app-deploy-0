'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  type CollectionReference,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface UseCollectionOptions {
  idField?: string;
  snapshotListenOptions?: {
    includeMetadataChanges: boolean;
  };
}

export function useCollection<T>(
  collectionRef: CollectionReference<T> | Query<T> | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collectionRef,
      { includeMetadataChanges: options?.snapshotListenOptions?.includeMetadataChanges },
      (snapshot) => {
        const docs = snapshot.docs.map(doc => {
          const docData = doc.data();
          if (options?.idField) {
            (docData as any)[options.idField] = doc.id;
          }
          return docData;
        });
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionRef, options?.idField, options?.snapshotListenOptions]);

  return { data, loading, error };
}

export const useMemoFirebase = useMemo;
