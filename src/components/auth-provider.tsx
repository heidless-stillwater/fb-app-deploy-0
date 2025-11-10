"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { app } from "@/lib/firebase/config";
import { getAuth } from "firebase/auth";

type Props = { children: React.ReactNode };

export const FirebaseAuthProvider = ({ children }: Props) => {
  const auth = getAuth(app);
  return <AuthProvider auth={auth}>{children}</AuthProvider>;
};
