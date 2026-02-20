'use server';

/**
 * @fileOverview A Genkit flow for providing personalized host recommendations.
 *
 * - personalizedHostRecommendations - A function that generates personalized host recommendations.
 * - PersonalizedHostRecommendationsInput - The input type for the personalizedHostRecommendations function.
 * - PersonalizedHostRecommendationsOutput - The return type for the personalizedHostRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single host to be considered for recommendation
const AvailableHostSchema = z.object({
  id: z.string().describe("The unique ID of the host."),
  name: z.string().describe("The name of the host."),
  categories: z.array(z.string()).describe("Categories the host streams in (e.g., 'Music', 'Gaming')."),
  country: z.string().describe("The country of the host."),
  isLive: z.boolean().describe("Whether the host is currently live."),
  previewImage: z.string().url().describe("URL to a preview image of the host's stream."),
});
export type AvailableHost = z.infer<typeof AvailableHostSchema>;

// Define the input schema for the personalizedHostRecommendations flow
const PersonalizedHostRecommendationsInputSchema = z.object({
  userId: z.string().describe("The unique ID of the user requesting recommendations."),
  userInterests: z.array(z.string()).describe("A list of categories or topics the user is interested in."),
  viewingHistory: z.array(z.string()).describe("A list of host IDs or categories the user has recently viewed."),
  availableHosts: z.array(AvailableHostSchema).describe("A list of hosts currently available for recommendation."),
});
export type PersonalizedHostRecommendationsInput = z.infer<typeof PersonalizedHostRecommendationsInputSchema>;

// Define the schema for a single recommended host
const RecommendedHostSchema = z.object({
  hostId: z.string().describe("The unique ID of the recommended host."),
  hostName: z.string().describe("The name of the recommended host."),
  category: z.string().describe("The primary category of the recommended host."),
  reason: z.string().describe("A brief, compelling reason for this recommendation based on user data."),
  previewImageUrl: z.string().url().describe("URL to a preview image of the host's stream, matching the 'previewImage' from availableHosts."),
});

// Define the output schema for the personalizedHostRecommendations flow
const PersonalizedHostRecommendationsOutputSchema = z.object({
  recommendations: z.array(RecommendedHostSchema).describe("A list of personalized host recommendations."),
});
export type PersonalizedHostRecommendationsOutput = z.infer<typeof PersonalizedHostRecommendationsOutputSchema>;

export async function personalizedHostRecommendations(
  input: PersonalizedHostRecommendationsInput
): Promise<PersonalizedHostRecommendationsOutput> {
  return personalizedHostRecommendationsFlow(input);
}

const personalizedHostRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedHostRecommendationsPrompt',
  input: { schema: PersonalizedHostRecommendationsInputSchema },
  output: { schema: PersonalizedHostRecommendationsOutputSchema },
  prompt: `You are an AI assistant tasked with recommending live hosts to a user.
The user's ID is: "{{{userId}}}".
Their expressed interests are: {{{json userInterests}}}.
Their recent viewing history includes: {{{json viewingHistory}}}.

Here is a list of currently available hosts and their details. Each host object contains 'id', 'name', 'categories' (array of strings), 'country', 'isLive' (boolean), and 'previewImage' (URL).
{{{json availableHosts}}}

Based on the user's interests, viewing history, and the available hosts, provide a list of up to 3 personalized host recommendations. For each recommendation, include the host's 'hostId' (matching one of the 'id's from availableHosts), 'hostName', their primary 'category', a brief and compelling 'reason' why this host is a good match for the user (referencing user interests or viewing history), and 'previewImageUrl' (matching the 'previewImage' from availableHosts).

Ensure that all recommended hosts are selected *only* from the provided 'availableHosts' list. Prioritize recommending hosts who are currently live ('isLive: true'). If no suitable live hosts are found, you can recommend non-live hosts.

Output the recommendations in JSON format.`
});

const personalizedHostRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedHostRecommendationsFlow',
    inputSchema: PersonalizedHostRecommendationsInputSchema,
    outputSchema: PersonalizedHostRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedHostRecommendationsPrompt(input);
    if (!output) {
      throw new Error('No recommendations generated.');
    }
    return output;
  }
);
