"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FolderData } from '@/lib/types';

type Breadcrumb = {
  id: string;
  name: string;
};

type BreadcrumbsProps = {
  folderId: string | null;
};

export function Breadcrumbs({ folderId }: BreadcrumbsProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreadcrumbs = async () => {
      if (!folderId) {
        setBreadcrumbs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const newBreadcrumbs: Breadcrumb[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const folderDocRef = doc(db, 'folders', currentId);
        const folderDoc = await getDoc(folderDocRef);
        if (folderDoc.exists()) {
          const folderData = folderDoc.data() as Omit<FolderData, 'id'>;
          newBreadcrumbs.unshift({ id: folderDoc.id, name: folderData.name });
          currentId = folderData.parentId;
        } else {
          currentId = null;
        }
      }
      setBreadcrumbs(newBreadcrumbs);
      setLoading(false);
    };

    fetchBreadcrumbs();
  }, [folderId]);

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
        <Home className="h-4 w-4" />
        Home
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.name}</span>
          ) : (
            <Link href={`/?folderId=${crumb.id}`} className="hover:text-primary transition-colors">
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
