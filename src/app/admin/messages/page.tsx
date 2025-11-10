"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, MessageSquare, User, Calendar, Inbox, Paperclip } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import type { ContactMessage, FirestoreContactMessage } from '@/lib/types';

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const messagesQuery = query(collection(db, 'dth-contact-messages'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const fetchedMessages: ContactMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreContactMessage;
        fetchedMessages.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
        });
      });
      setMessages(fetchedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="absolute top-4 left-4">
        <Button asChild variant="ghost">
          <Link href="/">&larr; Back to Home</Link>
        </Button>
      </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <Inbox className="h-8 w-8" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Contact Messages</CardTitle>
                    <CardDescription>Here are the messages submitted through your contact form.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">You haven't received any messages yet.</p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 hover:bg-muted/50 transition-colors">
                     <div className="col-span-1 md:col-span-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-foreground">{message.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground"/>
                            <a href={`mailto:${message.email}`} className="text-sm text-primary hover:underline truncate">{message.email}</a>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground"/>
                            <span className="text-sm text-muted-foreground" title={format(message.createdAt, 'PPpp')}>
                                {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                            </span>
                        </div>
                        {message.attachmentUrl && (
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground"/>
                            <a 
                                href={message.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-primary hover:underline truncate"
                                download={message.attachmentName}
                            >
                                {message.attachmentName}
                            </a>
                          </div>
                        )}
                     </div>
                     <div className="col-span-1 md:col-span-3">
                        <p className="text-foreground">{message.message}</p>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
