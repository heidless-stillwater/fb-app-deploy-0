
'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ChangeEvent,
} from 'react';
import Image from 'next/image';
import {
  Search,
  UploadCloud,
  Download,
  Trash2,
  MoreVertical,
  Loader2,
  File as FileIconDefault,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

import { useFirestore, useStorage, useAuth, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { getSuggestedCategories } from '@/app/actions';
import { AVAILABLE_TAGS } from '@/lib/data';
import type { ManagedFile } from '@/lib/types';
import { FileIcon } from '@/components/file-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Home() {
  const firestore = useFirestore();
  const storage = useStorage();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();

  const filesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'files') : null, [firestore]);
  const { data: files, loading: filesLoading } = useCollection<ManagedFile>(filesCollection, { idField: 'id' });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ManagedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !userLoading) {
      signInAnonymously(auth);
    }
  }, [user, userLoading, auth]);

  const filteredFiles = useMemo(() => {
    if (!files) return [];
    let filtered = files;

    if (activeTag) {
      filtered = filtered.filter(file => file.type === activeTag);
    }

    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        const dateA = a.uploadedAt instanceof Timestamp ? a.uploadedAt.toDate() : a.uploadedAt;
        const dateB = b.uploadedAt instanceof Timestamp ? b.uploadedAt.toDate() : b.uploadedAt;
        return dateB.getTime() - dateA.getTime();
    });
  }, [files, searchQuery, activeTag]);

  const fetchSuggestions = useCallback(async (query: string) => {
    setIsAISuggesting(true);
    const suggestions = await getSuggestedCategories(query);
    setSuggestedCategories(suggestions);
    setIsAISuggesting(false);
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (searchQuery.length > 2) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 500);
    } else {
      setSuggestedCategories([]);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchSuggestions]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveTag(null);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(currentTag => (currentTag === tag ? null : tag));
    setSearchQuery('');
  };

  const handleUploadClick = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be signed in to upload files.",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    const storagePath = `files/${user.uid}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setIsUploading(false);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload the file. Please try again.",
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          const fileData = {
            name: file.name,
            size: file.size,
            type: (AVAILABLE_TAGS.find(tag => file.type.startsWith(tag)) || 'other'),
            uploadedAt: serverTimestamp(),
            storagePath: storagePath,
            userId: user.uid,
          };

          addDoc(collection(firestore, 'files'), fileData)
            .then(() => {
              setIsUploading(false);
              toast({
                title: "File Uploaded",
                description: `"${file.name}" has been successfully added.`,
              });
            })
            .catch(async (serverError) => {
               const permissionError = new FirestorePermissionError({
                  path: `files`,
                  operation: 'create',
                  requestResourceData: fileData
               });
               errorEmitter.emit('permission-error', permissionError);
            });
        });
      }
    );
  };
  
  const handleDownload = async (file: ManagedFile) => {
    try {
      const url = await getDownloadURL(ref(storage, file.storagePath));
      const a = document.createElement('a');
      a.href = url;
      // This will open the file in a new tab, from where the user can download it.
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Opening File",
        description: `Your file "${file.name}" is opening in a new tab.`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not get the download URL.",
      });
    }
  };

  const handleDelete = (file: ManagedFile) => {
    setFileToDelete(file);
  };
  
  const confirmDelete = async () => {
    if (fileToDelete && firestore) {
      const fileRef = doc(firestore, 'files', fileToDelete.id);
      const storageRef = ref(storage, fileToDelete.storagePath);
      
      try {
        await deleteObject(storageRef);
        await deleteDoc(fileRef);
        
        toast({
          title: "File Deleted",
          description: `"${fileToDelete.name}" has been removed.`,
        });
      } catch (error: any) {
         if (error.code && error.code.includes('permission-denied')){
             const permissionError = new FirestorePermissionError({
                  path: fileRef.path,
                  operation: 'delete',
               });
             errorEmitter.emit('permission-error', permissionError);
         } else {
            toast({
              variant: "destructive",
              title: "Error Deleting File",
              description: "An unexpected error occurred.",
            });
         }
      } finally {
        setFileToDelete(null);
      }
    }
  };

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-background text-foreground w-full">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center gap-2">
          <Image src="/logo.svg" alt="FileWise Logo" width={32} height={32} />
          <h1 className="text-2xl font-bold font-headline text-primary">FileWise</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-2xl">My Files</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search files..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <Button onClick={handleUploadClick} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
            {(suggestedCategories.length > 0 || isAISuggesting) && (
              <div className="flex items-center gap-2 pt-4 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">AI Suggestions:</span>
                {isAISuggesting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  suggestedCategories.map(cat => (
                    <Badge
                      key={cat}
                      variant={activeTag === cat ? 'default' : 'secondary'}
                      onClick={() => handleTagClick(cat)}
                      className="cursor-pointer transition-transform hover:scale-105"
                      style={{backgroundColor: activeTag === cat ? 'hsl(var(--accent))' : 'hsl(var(--secondary))', color: activeTag === cat ? 'hsl(var(--accent-foreground))' : 'hsl(var(--secondary-foreground))'}}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Badge>
                  ))
                )}
              </div>
            )}
            {isUploading && <Progress value={uploadProgress} className="w-full mt-4" />}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Size</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filesLoading ? (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                           <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                     </TableRow>
                  ) : filteredFiles.length > 0 ? (
                    filteredFiles.map(file => (
                      <TableRow key={file.id}>
                        <TableCell className="hidden sm:table-cell">
                          <FileIcon type={file.type} className="h-6 w-6 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{formatBytes(file.size)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                           <Badge variant="outline">{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                           {file.uploadedAt && formatDistanceToNow(file.uploadedAt instanceof Timestamp ? file.uploadedAt.toDate() : file.uploadedAt, { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(file)}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(file)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                         <div className="flex flex-col items-center justify-center gap-2">
                            <FileIconDefault className="w-12 h-12 text-muted-foreground/50"/>
                            <p className="text-muted-foreground">No files found.</p>
                            <p className="text-sm text-muted-foreground/80">
                              {searchQuery ? "Try a different search term." : "Upload a file to get started."}
                            </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file
              <span className="font-semibold text-foreground"> "{fileToDelete?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={cn(buttonVariants({variant: 'destructive'}))}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const buttonVariants = cn;

    