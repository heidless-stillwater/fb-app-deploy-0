'use client';

import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from '.';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  firestore: null,
});

export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseContextValue | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client-side
    const fb = initializeFirebase();
    setFirebase({ app: fb.app, auth: fb.auth, firestore: fb.firestore });
  }, []);

  // Render a loading state or null until Firebase is initialized
  if (!firebase) {
    return null; 
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

export const useFirebaseApp = () => {
  const { app } = useFirebase();
  if (!app) {
    throw new Error('Firebase app not available. Make sure you are within a FirebaseProvider.');
  }
  return app;
};

export const useAuth = () => {
  const { auth } = useFirebase();
   if (!auth) {
    throw new Error('Firebase Auth not available. Make sure you are within a FirebaseProvider.');
  }
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
   if (!firestore) {
    throw new Error('Firestore not available. Make sure you are within a FirebaseProvider.');
  }
  return firestore;
};
