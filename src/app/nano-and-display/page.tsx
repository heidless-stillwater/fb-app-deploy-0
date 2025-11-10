
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, ImageIcon, Download } from "lucide-react";
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { transformImage, TransformImageInput } from "@/ai/flows/transform-image-flow";
import { useAuth } from "@/hooks/use-auth";
import { db, storage } from "@/lib/firebase/config";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NanoGallery } from "@/components/nano-gallery";
import type { NanoRecord } from "@/lib/types";

const styleOptions = [
    'gothic',
    'art deco',
    'minimalistic',
    'van gogh style',
    'rembrandt style',
    'cartoon',
    'pop',
    'cosy',
];

const formSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters.").max(500),
  image: z.instanceof(File).refine(file => file.size > 0, "An image is required."),
  testMode: z.boolean().default(true),
  style: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function NanoProcessor({ 
    setOriginalImage, 
    setTransformedImage 
}: { 
    setOriginalImage: (url: string | null) => void,
    setTransformedImage: (url: string | null) => void,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const originalImageRef = useRef<HTMLImageElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "art deco",
      testMode: true,
      style: "art deco",
    },
  });

  const imageFile = form.watch("image");

  useEffect(() => {
    // This effect ensures the button state is updated whenever the imageFile changes.
  }, [imageFile]);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadToStorage = async (file: File | Blob, fileName: string, type: 'original' | 'transformed'): Promise<string> => {
    if (!user) throw new Error("User not authenticated.");
    const timestamp = Date.now();
    const storagePath = `user-uploads/${user.uid}/${timestamp}-${type}-${fileName}`;
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const dataUriToBlob = (dataUri: string): Blob => {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  const createTestModeImage = (promptText: string): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const img = originalImageRef.current;
        if (img) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
        } else {
            canvas.width = 600;
            canvas.height = 400;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');

        // Solid light blue background
        ctx.fillStyle = '#ADD8E6'; // Light Blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text style
        ctx.fillStyle = '#000000'; // Black text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Responsive font size
        let fontSize = canvas.width / 15;
        ctx.font = `${fontSize}px Arial`;

        // Wrap text
        const words = promptText.split(' ');
        let line = '';
        const x = canvas.width / 2;
        let y = canvas.height / 2 - ( (Math.ceil(ctx.measureText(promptText).width / (canvas.width * 0.9))) * fontSize / 2);
        
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > canvas.width * 0.9 && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += fontSize * 1.2;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);

        resolve(canvas.toDataURL('image/png'));
    });
  }

  async function onSubmit(values: FormValues) {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
        return;
    }
    setIsLoading(true);
    setTransformedImage(null);

    try {
      const imageAsDataUri = await fileToDataUri(values.image);
      setOriginalImage(imageAsDataUri);

      const originalImageUrl = await uploadToStorage(values.image, values.image.name, 'original');

      let transformedImageUri: string;

      if (values.testMode) {
        transformedImageUri = await createTestModeImage(values.prompt);
      } else {
        const input: TransformImageInput = {
          prompt: `Assume image is of a room in a domestic house. Decorate & Furnish this room in a style specified by the following prompt: ${values.prompt}`,
          imageAsDataUri: imageAsDataUri,
        };
        const result = await transformImage(input);
        transformedImageUri = result.imageAsDataUri;
      }

      setTransformedImage(transformedImageUri);
      
      toast({
        title: "Image Transformed!",
        description: "Your new image has been generated. Saving record...",
      });

      const transformedImageBlob = dataUriToBlob(transformedImageUri);
      const transformedImageUrl = await uploadToStorage(transformedImageBlob, values.image.name, 'transformed');

      await addDoc(collection(db, 'nanoRecords'), {
        userId: user.uid,
        originalImageUrl,
        transformedImageUrl,
        originalFileName: values.image.name,
        timestamp: Timestamp.now(),
      });

      toast({
        title: "Record Saved",
        description: "The transformation record has been saved successfully.",
      });


    } catch (error: any) {
      console.error("Transformation error:", error);
      toast({
        variant: "destructive",
        title: "Transformation Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <Wand2 className="h-8 w-8" />
              </div>
              <div>
                  <CardTitle className="text-2xl font-bold">Image Transformer</CardTitle>
                  <CardDescription>Use AI to transform your images.</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file); // This updates the form state
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setOriginalImage(event.target?.result as string);
                                setTransformedImage(null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Style</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('prompt', value);
                        }} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a style" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {styleOptions.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transformation Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'make this a watercolor painting', 'add a cat wearing a hat'"
                        {...field}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Test Mode
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || !imageFile}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Upload Images
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}

function ResultsDisplay({ 
    originalImage, 
    transformedImage 
}: { 
    originalImage: string | null, 
    transformedImage: string | null 
}) {
    const originalImageRef = useRef<HTMLImageElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!transformedImage) return;
    
        try {
            toast({
                title: "Download Started",
                description: "Your transformed image is preparing to download.",
            });
    
            // Directly create a link with the data URI
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = transformedImage;
            a.download = "transformed-image.png"; 
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
    
        } catch (error) {
            console.error("Download error:", error);
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Could not download the transformed image.",
            });
        }
    };
    
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>Your original and transformed images.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-1 grid-rows-2 gap-4">
                <div className="relative border rounded-lg overflow-hidden bg-muted/20">
                {originalImage ? (
                    <Image src={originalImage} alt="Original" layout="fill" objectFit="contain" ref={originalImageRef}/>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p>Original Image</p>
                    </div>
                )}
                </div>
                <div className="relative border rounded-lg overflow-hidden bg-muted/20">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                )}
                {transformedImage ? (
                    <Image src={transformedImage} alt="Transformed" layout="fill" objectFit="contain" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p>Transformed Image</p>
                    </div>
                )}
                </div>
            </CardContent>
            {transformedImage && (
                <CardFooter>
                    <Button onClick={handleDownload} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Transformed Image
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

export default function NanoAndDisplayPage() {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [transformedImage, setTransformedImage] = useState<string | null>(null);

    const handleRecordSelect = (record: NanoRecord | null) => {
        if (record) {
            setOriginalImage(record.originalImageUrl);
            setTransformedImage(record.transformedImageUrl);
        } else {
            setOriginalImage(null);
            setTransformedImage(null);
        }
    }

  return (
    <div className="flex flex-col min-h-screen items-start justify-center bg-background px-4 py-8 gap-8">
      <div className="absolute top-4 left-4">
        <Button asChild variant="ghost">
          <Link href="/">&larr; Back to Home</Link>
        </Button>
      </div>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <NanoProcessor setOriginalImage={setOriginalImage} setTransformedImage={setTransformedImage} />
        <ResultsDisplay originalImage={originalImage} transformedImage={transformedImage} />
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <NanoGallery onRecordSelect={handleRecordSelect} />
      </div>
    </div>
  );
}

    