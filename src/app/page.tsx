
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

import { getSuggestedCategories } from '@/app/actions';
import { initialFiles, AVAILABLE_TAGS } from '@/lib/data';
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

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Home() {
  const [files, setFiles] = useState<ManagedFile[]>(initialFiles);
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

  const filteredFiles = useMemo(() => {
    let filtered = files;

    if (activeTag) {
      filtered = filtered.filter(file => file.type === activeTag);
    }

    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
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
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newFile: ManagedFile = {
      id: (Math.random() * 1000).toString(),
      name: file.name,
      size: file.size,
      type: (AVAILABLE_TAGS.find(tag => file.type.startsWith(tag)) || 'other'),
      uploadedAt: new Date(),
    };

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setFiles(prev => [newFile, ...prev]);
        setIsUploading(false);
        toast({
          title: "File Uploaded",
          description: `"${file.name}" has been successfully added.`,
        });
      }, 500);
    }, 2500);
  };
  
  const handleDownload = (file: ManagedFile) => {
    const blob = new Blob([`This is a dummy file representing ${file.name}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Started",
      description: `Downloading "${file.name}".`,
    });
  };

  const handleDelete = (file: ManagedFile) => {
    setFileToDelete(file);
  };
  
  const confirmDelete = () => {
    if (fileToDelete) {
      setFiles(files.filter(f => f.id !== fileToDelete.id));
      toast({
        title: "File Deleted",
        description: `"${fileToDelete.name}" has been removed.`,
        variant: "destructive"
      });
      setFileToDelete(null);
    }
  };

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
                <Button onClick={handleUploadClick}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
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
                  {filteredFiles.length > 0 ? (
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
                           {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
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
