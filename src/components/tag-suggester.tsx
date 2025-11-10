"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as z from "zod";

import { suggestFileTags } from "@/ai/flows/suggest-file-tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fileDescription: z
    .string()
    .min(5, "Please provide a more detailed description.")
    .max(500),
});

type TagSuggesterProps = {
  fileName: string;
};

export function TagSuggester({ fileName }: TagSuggesterProps) {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileDescription: fileName,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestedTags([]);
    try {
      const result = await suggestFileTags(values);
      setSuggestedTags(result.tags);
    } catch (error) {
      console.error("Error suggesting tags:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate tags. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4 pt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fileDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., A marketing report for Q3 2023"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a brief description of the file's content.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Tags
          </Button>
        </form>
      </Form>

      {(isLoading || suggestedTags.length > 0) && (
        <Separator className="my-2" />
      )}

      {suggestedTags.length > 0 && (
        <div>
          <h4 className="mb-3 font-medium text-foreground">Suggested Tags:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer transition-colors hover:bg-primary/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
