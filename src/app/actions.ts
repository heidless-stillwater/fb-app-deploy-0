
'use server';

import { aiSuggestFileCategorization } from '@/ai/flows/ai-suggested-file-categorization';
import { AVAILABLE_TAGS } from '@/lib/data';

/**
 * Server action to get AI-suggested file categories.
 * @param query The user's search query.
 * @returns A promise that resolves to an array of suggested category strings.
 */
export async function getSuggestedCategories(query: string) {
  if (!query) {
    return [];
  }
  
  try {
    const result = await aiSuggestFileCategorization({ query, availableFileTags: AVAILABLE_TAGS });
    return result.suggestedCategories;
  } catch (error) {
    console.error("AI suggestion failed:", error);
    // In case of an error, return an empty array to prevent crashing the client.
    return [];
  }
}
