'use server';
/**
 * @fileOverview This file implements a Genkit flow that provides AI-guided suggestions
 * for host profile optimization, including descriptions, stream titles, and content strategy.
 *
 * - aiGuidedHostProfileOptimization - A function to get AI suggestions for host profile optimization.
 * - HostProfileOptimizationInput - The input type for the optimization function.
 * - HostProfileOptimizationOutput - The return type for the optimization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HostProfileOptimizationInputSchema = z.object({
  profileDescription: z
    .string()
    .describe('The current description of the host profile.'),
  streamTitles: z
    .array(z.string())
    .describe('A list of typical stream titles the host uses.'),
  contentStrategy: z
    .string()
    .describe(
      'A description of the host\'s current content strategy or type of content they create.'
    ),
});
export type HostProfileOptimizationInput = z.infer<
  typeof HostProfileOptimizationInputSchema
>;

const HostProfileOptimizationOutputSchema = z.object({
  profileDescriptionSuggestions: z
    .string()
    .describe(
      'Suggested improvements for the host profile description to attract more viewers and optimize earning potential.'
    ),
  streamTitleSuggestions: z
    .array(z.string())
    .describe(
      'A list of suggested stream titles optimized for engagement and discoverability.'
    ),
  contentStrategySuggestions: z
    .string()
    .describe(
      'Suggested improvements for the host\'s content strategy to enhance viewer attraction and earning potential.'
    ),
});
export type HostProfileOptimizationOutput = z.infer<
  typeof HostProfileOptimizationOutputSchema
>;

export async function aiGuidedHostProfileOptimization(
  input: HostProfileOptimizationInput
): Promise<HostProfileOptimizationOutput> {
  return aiGuidedHostProfileOptimizationFlow(input);
}

const aiGuidedHostProfileOptimizationPrompt = ai.definePrompt({
  name: 'aiGuidedHostProfileOptimizationPrompt',
  input: {schema: HostProfileOptimizationInputSchema},
  output: {schema: HostProfileOptimizationOutputSchema},
  prompt: `You are an AI assistant specialized in optimizing online streaming profiles to attract more viewers and maximize earning potential.
Your goal is to provide constructive and actionable suggestions for a new host based on their current profile description, stream titles, and content strategy.

Analyze the following information and suggest improvements for each category. Be specific, creative, and focus on engagement, discoverability, and monetization.

---

## Current Host Profile Details:

Profile Description: {{{profileDescription}}}

Stream Titles: 
{{#each streamTitles}}- {{{this}}}
{{/each}}

Content Strategy: {{{contentStrategy}}}

---

Provide your suggestions in the following JSON format, directly mapping to the output schema. Ensure all fields are populated.
`,
});

const aiGuidedHostProfileOptimizationFlow = ai.defineFlow(
  {
    name: 'aiGuidedHostProfileOptimizationFlow',
    inputSchema: HostProfileOptimizationInputSchema,
    outputSchema: HostProfileOptimizationOutputSchema,
  },
  async (input) => {
    const {output} = await aiGuidedHostProfileOptimizationPrompt(input);
    return output!;
  }
);
