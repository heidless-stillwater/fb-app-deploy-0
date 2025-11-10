import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseConfig } from './config';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { useCollection, useMemoFirebase } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { FirebaseClientProvider } from './client-provider';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
  const firebaseConfig = getFirebaseConfig();
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  
  return { app, auth, firestore, storage };
}

const useStorage = () => {
  const { storage } = useFirebase();
  if (!storage) {
    throw new Error('Firebase Storage not available. Make sure you are within a FirebaseProvider.');
  }
  return storage;
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useStorage,
  useCollection,
  useDoc,
  useUser,
  useMemoFirebase,
};
