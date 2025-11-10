'use client';

import { createContext, useContext, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { FirebaseClientProvider } from './client-provider';
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
  app,
  auth,
  firestore,
}: {
  children: React.ReactNode;
  app?: FirebaseApp;
  auth?: Auth;
  firestore?: Firestore;
}) {
  const contextValue = useMemo(() => {
    if (app && auth && firestore) {
      return { app, auth, firestore };
    }
    const fb = initializeFirebase();
    return { app: fb.app, auth: fb.auth, firestore: fb.firestore };
  }, [app, auth, firestore]);

  if (!contextValue.app) {
     return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
  }
  
  return (
    <FirebaseContext.Provider value={contextValue}>
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
