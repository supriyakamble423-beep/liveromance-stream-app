'use server';
/**
 * @fileOverview AI flow for NSFW content detection and stream moderation.
 *
 * - nsfwModeration - Analyzes a stream frame for prohibited content.
 * - NSFWModerationInput - Data URI of the frame.
 * - NSFWModerationOutput - Verdict and confidence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NSFWModerationInputSchema = z.object({
  photoDataUri: z.string().describe("A frame from the live stream as a data URI."),
  streamType: z.enum(['public', 'private']).describe("The current stream visibility."),
});
export type NSFWModerationInput = z.infer<typeof NSFWModerationInputSchema>;

const NSFWModerationOutputSchema = z.object({
  isSafe: z.boolean().describe("True if the content complies with the stream type rules."),
  reason: z.string().describe("Brief explanation of the verdict."),
  verdict: z.enum(['SAFE', 'NSFW', 'RACY', 'VIOLENT']).describe("The detected category."),
});
export type NSFWModerationOutput = z.infer<typeof NSFWModerationOutputSchema>;

export async function nsfwModeration(input: NSFWModerationInput): Promise<NSFWModerationOutput> {
  return nsfwModerationFlow(input);
}

const nsfwModerationPrompt = ai.definePrompt({
  name: 'nsfwModerationPrompt',
  input: { schema: NSFWModerationInputSchema },
  output: { schema: NSFWModerationOutputSchema },
  prompt: `You are an AI Safety Officer for a social streaming app.
TASK: Analyze the image frame for nudity, sexual content, or violence.

RULES:
- If streamType is "public": STRICT NO NUDITY. Any exposed breasts, genitals, or explicit sexual acts must be marked isSafe: false.
- If streamType is "private": Adult content is allowed, but extreme violence is not.
- Be precise. If it's borderline and "public", mark as NSFW to be safe.

Image: {{media url=photoDataUri}}
Stream Type: {{{streamType}}}

Provide a structured verdict.`,
});

const nsfwModerationFlow = ai.defineFlow(
  {
    name: 'nsfwModerationFlow',
    inputSchema: NSFWModerationInputSchema,
    outputSchema: NSFWModerationOutputSchema,
  },
  async (input) => {
    const { output } = await nsfwModerationPrompt(input);
    if (!output) throw new Error("AI Moderation failed.");
    return output;
  }
);
