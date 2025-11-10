import { FileText, ImageIcon, VideoIcon, Voicemail as AudioIcon, ArchiveIcon, Code2Icon, File } from 'lucide-react';
import type { ManagedFile } from '@/lib/types';

type FileIconProps = {
  type: ManagedFile['type'];
  className?: string;
};

export function FileIcon({ type, className }: FileIconProps) {
  switch (type) {
    case 'image':
      return <ImageIcon className={className} />;
    case 'document':
      return <FileText className={className} />;
    case 'video':
      return <VideoIcon className={className} />;
    case 'audio':
      return <AudioIcon className={className} />;
    case 'archive':
      return <ArchiveIcon className={className} />;
    case 'code':
      return <Code2Icon className={className} />;
    default:
      return <File className={className} />;
  }
}
