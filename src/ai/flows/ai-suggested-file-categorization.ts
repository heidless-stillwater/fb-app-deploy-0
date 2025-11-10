'use server';

/**
 * @fileOverview AI-powered file categorization suggestion flow.
 *
 * - aiSuggestFileCategorization - A function that suggests relevant file categories or tags based on a search query.
 * - AISuggestFileCategorizationInput - The input type for the aiSuggestFileCategorization function.
 * - AISuggestFileCategorizationOutput - The return type for the aiSuggestFileCategorization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AISuggestFileCategorizationInputSchema = z.object({
  query: z.string().describe('The user search query.'),
  availableFileTags: z.array(z.string()).describe('A list of file tags that can be used to categorize the files.'),
});
export type AISuggestFileCategorizationInput = z.infer<
  typeof AISuggestFileCategorizationInputSchema
>;

const AISuggestFileCategorizationOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe(
      'A list of suggested file categories or tags based on the search query.'
    ),
});
export type AISuggestFileCategorizationOutput = z.infer<
  typeof AISuggestFileCategorizationOutputSchema
>;

export async function aiSuggestFileCategorization(
  input: AISuggestFileCategorizationInput
): Promise<AISuggestFileCategorizationOutput> {
  return aiSuggestFileCategorizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSuggestFileCategorizationPrompt',
  input: {schema: AISuggestFileCategorizationInputSchema},
  output: {schema: AISuggestFileCategorizationOutputSchema},
  prompt: `You are an AI assistant helping users categorize their files based on their search query.

  The user is searching for files using the following query: {{{query}}}
  Here are the available file tags: {{#each availableFileTags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Based on the search query and available file tags, suggest relevant file categories or tags that the user can use to narrow down their search.
  Return a JSON object with a "suggestedCategories" field containing a list of suggested categories or tags.
  Do not suggest tags that are not in the availableFileTags parameter.
  Be concise.
  `,
});

const aiSuggestFileCategorizationFlow = ai.defineFlow(
  {
    name: 'aiSuggestFileCategorizationFlow',
    inputSchema: AISuggestFileCategorizationInputSchema,
    outputSchema: AISuggestFileCategorizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
