
"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from "firebase/storage";
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { GalleryVertical, Loader2, MoreVertical, Eye, Trash2 } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase/config';
import type { NanoRecord, FirestoreNanoRecord } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NanoGalleryProps = {
    onRecordSelect: (record: NanoRecord | null) => void;
};

export function NanoGallery({ onRecordSelect }: NanoGalleryProps) {
  const [records, setRecords] = useState<NanoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<NanoRecord | null>(null);
  const { toast } = useToast();

  const selectedRecord = records.find(r => r.id === selectedRecordId) || null;

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

  const handleSelect = (recordId: string) => {
    const newSelectedId = selectedRecordId === recordId ? null : recordId;
    setSelectedRecordId(newSelectedId);
    const record = records.find(r => r.id === newSelectedId) || null;
    onRecordSelect(record);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
        // Delete Firestore document
        await deleteDoc(doc(db, "nanoRecords", recordToDelete.id));

        // Delete files from storage
        const originalImageRef = ref(storage, recordToDelete.originalImageUrl);
        const transformedImageRef = ref(storage, recordToDelete.transformedImageUrl);
        
        await deleteObject(originalImageRef);
        await deleteObject(transformedImageRef);

        toast({
            title: "Record Deleted",
            description: "The image record and its files have been removed."
        });
        
        if (selectedRecordId === recordToDelete.id) {
            setSelectedRecordId(null);
            onRecordSelect(null);
        }
    } catch (error: any) {
        console.error("Error deleting record:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message || "Could not delete the record."
        });
    } finally {
        setRecordToDelete(null);
    }
  };


  return (
    <>
    <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg">
                    <GalleryVertical className="h-8 w-8" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Image Gallery</CardTitle>
                    <CardDescription>
                        Select an image to view or manage it.
                    </CardDescription>
                </div>
            </div>
             <Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" disabled={!selectedRecord}>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Image Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DialogTrigger asChild>
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Show
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem
                            onSelect={() => setRecordToDelete(selectedRecord)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                {selectedRecord && (
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Transformed Image</DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video w-full mt-4">
                            <Image src={selectedRecord.transformedImageUrl} alt="Transformed image" layout="fill" objectFit="contain" />
                        </div>
                    </DialogContent>
                )}
            </Dialog>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {records.map((record) => (
                        <Card 
                            key={record.id} 
                            className={cn(
                                "overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer",
                                selectedRecordId === record.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                            onClick={() => handleSelect(record.id)}
                        >
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
     <AlertDialog
        open={!!recordToDelete}
        onOpenChange={(open) => !open && setRecordToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for "{recordToDelete?.originalFileName}" and its associated images from storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    