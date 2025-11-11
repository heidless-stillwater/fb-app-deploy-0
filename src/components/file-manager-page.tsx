
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { FileList } from "@/components/file-list";
import { useFileManager } from "@/hooks/use-files";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { FolderList } from "@/components/folder-list";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { View } from "@/components/view-switcher";
import Link from "next/link";

export function FileManagerPage() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId") || null;
  const [view, setView] = useState<View>("extra-small");

  const { files, folders, addFile, deleteFile, deleteFiles, createFolder, deleteFolder, loading: filesLoading, uploading, uploadProgress } = useFileManager(folderId);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto max-w-5xl px-4 py-8 flex-grow">
        <Header 
          onFileUpload={addFile} 
          isUploading={uploading} 
          uploadProgress={uploadProgress} 
          onCreateFolder={createFolder}
          view={view}
          onViewChange={setView}
        />
        <div className="mt-8">
            <Breadcrumbs folderId={folderId} />
            <FolderList folders={folders} onFolderDelete={deleteFolder} isLoading={filesLoading} />
            <FileList 
              files={files} 
              onFileDelete={deleteFile} 
              onFilesDelete={deleteFiles}
              isLoading={filesLoading} 
              view={view} 
            />
        </div>
      </div>
    </div>
  );
}
