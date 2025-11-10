'use server';

/**
 * @fileOverview A flow that suggests categorization tags for uploaded files using AI.
 *
 * - suggestFileTags - A function that handles the tag suggestion process.
 * - SuggestFileTagsInput - The input type for the suggestFileTags function.
 * - SuggestFileTagsOutput - The return type for the suggestFileTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFileTagsInputSchema = z.object({
  fileDescription: z
    .string()
    .describe('A description of the file content.'),
});
export type SuggestFileTagsInput = z.infer<typeof SuggestFileTagsInputSchema>;

const SuggestFileTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of suggested tags for the file.'),
});
export type SuggestFileTagsOutput = z.infer<typeof SuggestFileTagsOutputSchema>;

export async function suggestFileTags(input: SuggestFileTagsInput): Promise<SuggestFileTagsOutput> {
  return suggestFileTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFileTagsPrompt',
  input: {schema: SuggestFileTagsInputSchema},
  output: {schema: SuggestFileTagsOutputSchema},
  prompt: `You are an AI assistant that suggests categorization tags for files based on their content description.

  Given the following file description, suggest 5 relevant tags that can be used to categorize the file.
  Description: {{{fileDescription}}}

  Return the tags as a JSON array of strings.
  `,
});

const suggestFileTagsFlow = ai.defineFlow(
  {
    name: 'suggestFileTagsFlow',
    inputSchema: SuggestFileTagsInputSchema,
    outputSchema: SuggestFileTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
