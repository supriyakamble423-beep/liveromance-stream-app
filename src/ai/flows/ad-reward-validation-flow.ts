
/**
 * @fileOverview AI Flow to validate ad engagement and reward delivery.
 *
 * - validateAdReward - Simulates AI analysis of ad engagement to prevent bot abuse.
 * - AdRewardInput - User context for validation.
 * - AdRewardOutput - Verdict and reward status.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdRewardInputSchema = z.object({
  userId: z.string(),
  adId: z.string(),
  timeSpent: z.number().describe('Seconds spent on the ad page.'),
});
export type AdRewardInput = z.infer<typeof AdRewardInputSchema>;

const AdRewardOutputSchema = z.object({
  isValid: z.boolean().describe('True if engagement is validated by AI.'),
  rewardAmount: z.number(),
  message: z.string(),
});
export type AdRewardOutput = z.infer<typeof AdRewardOutputSchema>;

export async function validateAdReward(input: AdRewardInput): Promise<AdRewardOutput> {
  return adRewardFlow(input);
}

const adRewardPrompt = ai.definePrompt({
  name: 'adRewardPrompt',
  input: {schema: AdRewardInputSchema},
  output: {schema: AdRewardOutputSchema},
  prompt: `You are an AI Ad Auditor. 
Analyze the user interaction:
- User ID: {{{userId}}}
- Ad ID: {{{adId}}}
- Time Spent: {{timeSpent}} seconds

If timeSpent is > 5 seconds, mark isValid as true and set rewardAmount to 2.
Otherwise, mark isValid as false and ask the user to engage longer for diamonds.`,
});

const adRewardFlow = ai.defineFlow(
  {
    name: 'adRewardFlow',
    inputSchema: AdRewardInputSchema,
    outputSchema: AdRewardOutputSchema,
  },
  async input => {
    const {output} = await adRewardPrompt(input);
    return output!;
  }
);
