"use client";

import { useState } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Folder as FolderIcon,
  MoreVertical,
  Trash2,
  FolderX,
} from "lucide-react";
import { format } from "date-fns";

import type { FolderData } from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@/hooks/use-toast";

type FolderListProps = {
  folders: FolderData[];
  onFolderDelete: (folderId: string) => void;
  isLoading: boolean;
};

export function FolderList({ folders, onFolderDelete, isLoading }: FolderListProps) {
  const [folderToDelete, setFolderToDelete] = useState<FolderData | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmDelete = () => {
    if (folderToDelete) {
      onFolderDelete(folderToDelete.id);
      toast({
        title: "Folder deleted",
        description: `"${folderToDelete.name}" and all its contents have been deleted.`,
      });
      setFolderToDelete(null);
    }
  };

  const handleRowClick = (folderId: string) => {
    router.push(`/?folderId=${folderId}`);
  };

  if (isLoading || folders.length === 0) {
    return null;
  }
  
  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70%]">Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders.map((folder) => (
                  <TableRow key={folder.id} onClick={() => handleRowClick(folder.id)} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <FolderIcon className="h-5 w-5 text-primary" />
                        <span className="truncate" title={folder.name}>
                          {folder.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{format(folder.createdAt, "PP")}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Folder actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => setFolderToDelete(folder)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!folderToDelete}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder "{folderToDelete?.name}" and ALL its contents (including subfolders and files). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
