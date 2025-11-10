
"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryVertical, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import type { NanoRecord, FirestoreNanoRecord } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export function NanoGallery() {
  const [records, setRecords] = useState<NanoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const recordsQuery = query(
      collection(db, 'nanoRecords'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(recordsQuery, (querySnapshot) => {
      const fetchedRecords: NanoRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreNanoRecord;
        fetchedRecords.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate(),
        });
      });
      // Sort on the client-side
      fetchedRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
        console.error("NanoGallery snapshot error: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Card className="w-full max-w-4xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg">
                    <GalleryVertical className="h-8 w-8" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Image Gallery</CardTitle>
                    <CardDescription>
                        Previously transformed images are displayed here.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
            ) : records.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Your gallery is currently empty. Transform an image to add it here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {records.map((record) => (
                        <Card key={record.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-2">
                                     <div className="relative aspect-square">
                                        <Image src={record.originalImageUrl} alt="Original" fill objectFit="cover" />
                                        <div className="absolute bottom-0 w-full bg-black/50 p-1 text-center text-xs text-white">Original</div>
                                     </div>
                                      <div className="relative aspect-square">
                                        <Image src={record.transformedImageUrl} alt="Transformed" fill objectFit="cover" />
                                        <div className="absolute bottom-0 w-full bg-black/50 p-1 text-center text-xs text-white">Transformed</div>
                                     </div>
                                </div>
                                <div className="p-2 border-t">
                                    <p className="text-xs text-muted-foreground truncate" title={record.originalFileName}>{record.originalFileName}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(record.timestamp, { addSuffix: true })}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );
}
