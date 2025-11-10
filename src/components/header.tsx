"use client";

import { useRef, useState } from "react";
import { FolderKanban, LogOut, Upload, FolderPlus } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "./ui/progress";
import { CreateFolderDialog } from "./create-folder-dialog";
import { ViewSwitcher, View } from "./view-switcher";

type HeaderProps = {
  onFileUpload: (file: File) => Promise<void>;
  onCreateFolder: (name: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  view: View;
  onViewChange: (view: View) => void;
};

export function Header({ onFileUpload, onCreateFolder, isUploading, uploadProgress, view, onViewChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isCreateFolderOpen, setCreateFolderOpen] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onFileUpload) {
      return;
    }

    const fileCount = files.length;
    let successfulUploads = 0;
    
    for (let i = 0; i < fileCount; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `"${file.name}" is larger than 10MB and was not uploaded.`,
        });
        continue;
      }
      try {
        await onFileUpload(file);
        successfulUploads++;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: `There was a problem uploading "${file.name}".`,
        });
      }
    }
    
    if (successfulUploads > 0) {
      toast({
        title: "Upload Complete",
        description: `${successfulUploads} of ${fileCount} file(s) have been successfully uploaded.`,
      });
    }

    // Reset the file input so the user can select the same file(s) again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
        await onCreateFolder(name);
        toast({
            title: "Folder Created",
            description: `Folder "${name}" has been created.`,
        });
        setCreateFolderOpen(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Creation Failed",
            description: "There was a problem creating your folder.",
        });
    }
  }

  return (
    <>
    <header className="py-8 md:py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <FolderKanban className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
              File Storage
            </h1>
            <p className="mt-1 text-muted-foreground truncate max-w-xs">
              {user ? `Signed in as ${user.email}`: "An elegant solution for managing your digital assets."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
              aria-hidden="true"
              multiple
            />
           {user && (
            <>
                <ViewSwitcher currentView={view} onSelectView={onViewChange} />
                <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Folder
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                </Button>
            </>
          )}
          <ThemeToggle />
          {user && (
             <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign out</span>
            </Button>
          )}
        </div>
      </div>
      {isUploading && (
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Progress value={uploadProgress} asCircle />
              <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
              </div>
            </div>
             <p className="text-sm font-medium text-muted-foreground">Uploading...</p>
        </div>
      )}
    </header>
    <CreateFolderDialog open={isCreateFolderOpen} onOpenChange={setCreateFolderOpen} onCreate={handleCreateFolder} />
    </>
  );
}
