'use server';

/**
 * @fileOverview A flow to handle contact form submissions.
 *
 * - sendContactMessage - A function that processes the contact message.
 * - SendContactMessageInput - The input type for the sendContactMessage function.
 * - SendContactMessageOutput - The return type for the sendContactMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const SendContactMessageInputSchema = z.object({
  name: z.string().describe('The name of the person sending the message.'),
  email: z.string().email().describe('The email of the person.'),
  message: z.string().describe('The content of the message.'),
  attachmentUrl: z.string().optional().describe('The URL of the uploaded attachment.'),
  attachmentName: z.string().optional().describe('The name of the uploaded attachment file.'),
});
export type SendContactMessageInput = z.infer<typeof SendContactMessageInputSchema>;

const SendContactMessageOutputSchema = z.object({
  message: z.string().describe('A confirmation message to the user.'),
});
export type SendContactMessageOutput = z.infer<typeof SendContactMessageOutputSchema>;

export async function sendContactMessage(input: SendContactMessageInput): Promise<SendContactMessageOutput> {
  return sendContactMessageFlow(input);
}

const sendContactMessageFlow = ai.defineFlow(
  {
    name: 'sendContactMessageFlow',
    inputSchema: SendContactMessageInputSchema,
    outputSchema: SendContactMessageOutputSchema,
  },
  async (input) => {
    try {
        await addDoc(collection(db, 'dth-contact-messages'), {
            ...input,
            createdAt: Timestamp.now(),
        });

        return {
            message: `Thanks for reaching out, ${input.name}! We've received your message and will get back to you soon.`,
        };
    } catch (error) {
        console.error('Error saving contact message to Firestore:', error);
        throw new Error('Failed to save your message. Please try again later.');
    }
  }
);
