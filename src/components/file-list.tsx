"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Download,
  File as FileIcon,
  FolderX,
  MoreVertical,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

import type { FileData } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TagSuggester } from "./tag-suggester";
import { useToast } from "@/hooks/use-toast";
import type { View } from "./view-switcher";
import { cn } from "@/lib/utils";
import { BulkActionBar } from "./bulk-action-bar";

type FileListProps = {
  files: FileData[];
  onFileDelete: (file: FileData) => void;
  onFilesDelete: (files: FileData[]) => void;
  isLoading: boolean;
  view: View;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function FileList({ files, onFileDelete, onFilesDelete, isLoading, view }: FileListProps) {
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
  const [filesToDelete, setFilesToDelete] = useState<FileData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    // Clear selection when files change (e.g. folder navigation)
    setSelectedFiles([]);
  }, [files]);

  const handleSingleDownload = async (file: FileData) => {
    try {
      toast({
        title: "Download Started",
        description: `Your file "${file.name}" is preparing to download.`,
      });
      const response = await fetch(`/api/download?fileUrl=${encodeURIComponent(file.url)}`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the file. Please try again.",
      });
    }
  };

  const handleBulkDownload = () => {
    const selected = files.filter(f => selectedFiles.includes(f.id));
    toast({
      title: "Download Started",
      description: `Preparing to download ${selected.length} files.`,
    });
    selected.forEach(handleSingleDownload);
  };


  const confirmSingleDelete = () => {
    if (fileToDelete) {
      onFileDelete(fileToDelete);
      toast({
        title: "File deleted",
        description: `"${fileToDelete.name}" has been successfully deleted.`,
      });
      setFileToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    if (filesToDelete.length > 0) {
      onFilesDelete(filesToDelete);
      toast({
        title: `${filesToDelete.length} Files Deleted`,
        description: `The selected files have been successfully deleted.`,
      });
      setFilesToDelete([]);
      setSelectedFiles([]);
    }
  }

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  const toggleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectedFileObjects = useMemo(() => files.filter(f => selectedFiles.includes(f.id)), [files, selectedFiles]);


  if (isLoading) {
    return (
       <Card className="shadow-sm mt-4">
        <CardContent className="p-12 text-center">
           <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Loading files...
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please wait a moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (files.length === 0) {
    return (
      <Card className="shadow-sm border-dashed mt-4">
        <CardContent className="p-12 text-center">
          <FolderX className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No files in this folder
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a file to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isAllSelected = selectedFiles.length > 0 && selectedFiles.length === files.length;
  const isIndeterminate = selectedFiles.length > 0 && selectedFiles.length < files.length;

  if (view === "detail") {
    return (
      <>
        <Card className="shadow-sm mt-4">
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        data-state={isIndeterminate ? "indeterminate" : (isAllSelected ? "checked" : "unchecked")}
                      />
                    </TableHead>
                    <TableHead className="w-[50%]">File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id} data-state={selectedFiles.includes(file.id) ? 'selected' : 'unselected'}>
                       <TableCell className="font-medium">
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={() => toggleSelectFile(file.id)}
                            aria-label={`Select ${file.name}`}
                          />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-secondary flex items-center justify-center">
                            {file.thumbnail ? (
                              <Image
                                src={file.thumbnail}
                                alt={file.name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover rounded-md"
                              />
                            ) : (
                              <FileIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="truncate" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell>{format(file.uploadDate, "PP")}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">File actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => handleSingleDownload(file)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DialogTrigger asChild>
                                <DropdownMenuItem>
                                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                                  Suggest Tags
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setFileToDelete(file)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>AI Tag Suggester</DialogTitle>
                            </DialogHeader>
                            <TagSuggester fileName={file.name} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {selectedFiles.length > 0 && (
          <BulkActionBar 
            selectedCount={selectedFiles.length}
            onClear={() => setSelectedFiles([])}
            onDelete={() => setFilesToDelete(selectedFileObjects)}
            onDownload={handleBulkDownload}
          />
        )}

        <AlertDialog
          open={!!fileToDelete}
          onOpenChange={(open) => !open && setFileToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{fileToDelete?.name}". This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmSingleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={filesToDelete.length > 0}
          onOpenChange={(open) => !open && setFilesToDelete([])}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {filesToDelete.length} file(s). This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFilesToDelete([])}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
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

  const gridClasses = {
    'extra-small': 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12',
    'small': 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
    'medium': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6',
    'large': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5',
  };

  return (
    <>
      <Card className="mt-4 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Files</CardTitle>
          <div className="flex items-center gap-2">
            <label htmlFor="selectAllGrid" className="text-sm font-medium">Select all</label>
            <Checkbox
              id="selectAllGrid"
              checked={isAllSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
              data-state={isIndeterminate ? "indeterminate" : (isAllSelected ? "checked" : "unchecked")}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("grid gap-4", gridClasses[view] || gridClasses.medium)}>
            {files.map((file) => (
              <Dialog key={file.id}>
                <Card 
                  className={cn(
                    "group relative overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md",
                    selectedFiles.includes(file.id) && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => toggleSelectFile(file.id)}
                >
                  <CardContent className="p-0 cursor-pointer">
                    <div className="relative aspect-square w-full">
                      {file.thumbnail ? (
                        <Image
                          src={file.thumbnail}
                          alt={file.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary">
                          <FileIcon className="h-1/3 w-1/3 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 w-full p-2 text-white">
                      <p className="truncate text-xs font-semibold">{file.name}</p>
                  </div>
                  <div className="absolute top-1 left-1 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={() => toggleSelectFile(file.id)}
                      aria-label={`Select ${file.name}`}
                      className="bg-background/50 hover:bg-background/75 border-white/50 data-[state=checked]:bg-primary"
                    />
                  </div>
                  <div className="absolute top-1 right-1 z-10" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white opacity-80 hover:opacity-100 hover:bg-black/20">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleSingleDownload(file)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DialogTrigger asChild>
                              <DropdownMenuItem>
                                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                                Suggest Tags
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setFileToDelete(file)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </Card>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>AI Tag Suggester</DialogTitle>
                  </DialogHeader>
                  <TagSuggester fileName={file.name} />
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>
       {selectedFiles.length > 0 && (
          <BulkActionBar 
            selectedCount={selectedFiles.length}
            onClear={() => setSelectedFiles([])}
            onDelete={() => setFilesToDelete(selectedFileObjects)}
            onDownload={handleBulkDownload}
          />
        )}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{fileToDelete?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSingleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog
          open={filesToDelete.length > 0}
          onOpenChange={(open) => !open && setFilesToDelete([])}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {filesToDelete.length} file(s). This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFilesToDelete([])}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
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
