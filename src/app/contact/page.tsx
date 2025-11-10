"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Send, Paperclip } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendContactMessage, SendContactMessageInput } from "@/ai/flows/send-contact-message";
import { storage } from "@/lib/firebase/config";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000),
  attachment: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const uploadFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `dth-contact-messages-attachments/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(new Error("File upload failed. Please try again."));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setUploadProgress(0);

    let contactMessageData: SendContactMessageInput = {
      name: values.name,
      email: values.email,
      message: values.message,
    };

    try {
      if (values.attachment) {
        const attachmentUrl = await uploadFile(values.attachment);
        contactMessageData.attachmentUrl = attachmentUrl;
        contactMessageData.attachmentName = values.attachment.name;
      }
      
      const response = await sendContactMessage(contactMessageData);
      toast({
        title: "Message Sent!",
        description: response.message,
      });
      form.reset();
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
       <div className="absolute top-4 left-4">
        <Button asChild variant="ghost">
          <Link href="/">&larr; Back to Home</Link>
        </Button>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>
            Have a question or feedback? Drop us a line!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your message..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="attachment"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Attachment (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);
                          }}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isLoading && uploadProgress > 0 && (
                    <div className="space-y-2">
                        <Label>Upload Progress</Label>
                        <Progress value={uploadProgress} />
                    </div>
                )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Message
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
