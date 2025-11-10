'use server';

/**
 * @fileOverview An AI flow to transform an image based on a text prompt.
 *
 * - transformImage - A function that handles the image transformation process.
 * - TransformImageInput - The input type for the transformImage function.
 * - TransformImageOutput - The return type for the transformImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransformImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the desired transformation.'),
  imageAsDataUri: z
    .string()
    .describe(
      "The source image as a data URI, including MIME type and Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type TransformImageInput = z.infer<typeof TransformImageInputSchema>;

const TransformImageOutputSchema = z.object({
  imageAsDataUri: z.string().describe('The transformed image as a data URI.'),
});
export type TransformImageOutput = z.infer<typeof TransformImageOutputSchema>;

export async function transformImage(input: TransformImageInput): Promise<TransformImageOutput> {
  return transformImageFlow(input);
}

const transformImageFlow = ai.defineFlow(
  {
    name: 'transformImageFlow',
    inputSchema: TransformImageInputSchema,
    outputSchema: TransformImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: input.imageAsDataUri } },
        { text: input.prompt },
      ],
      config: {
        // MUST provide both TEXT and IMAGE, IMAGE only won't work
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('The AI model did not return an image. Please try a different prompt.');
    }
    
    return { imageAsDataUri: media.url };
  }
);
