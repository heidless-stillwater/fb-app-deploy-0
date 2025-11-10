"use client";

import { Download, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

type BulkActionBarProps = {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onDownload: () => void;
};

export function BulkActionBar({ selectedCount, onClear, onDelete, onDownload }: BulkActionBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto z-50">
      <div className="flex items-center gap-4 bg-background border rounded-lg shadow-2xl p-2 animate-in slide-in-from-bottom-5 fade-in-25">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Clear selection</span>
            </Button>
            <p className="text-sm font-medium">{selectedCount} selected</p>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
