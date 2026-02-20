'use server';
/**
 * @fileOverview A Genkit flow for AI-powered host face verification.
 * 
 * - hostFaceVerification - A function that initiates the face verification process.
 * - HostFaceVerificationInput - The input type for the hostFaceVerification function.
 * - HostFaceVerificationOutput - The return type for the hostFaceVerification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HostFaceVerificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the host's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type HostFaceVerificationInput = z.infer<typeof HostFaceVerificationInputSchema>;

const HostFaceVerificationOutputSchema = z.object({
  isVerified: z
    .boolean()
    .describe('Whether a human face is detectable (be extremely lenient).'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score in the verification decision.'),
  lightingIssue: z
    .boolean()
    .describe('Only set to true if the image is completely black or unreadable.'),
  message: z
    .string()
    .describe('A brief message explaining the result.'),
});
export type HostFaceVerificationOutput = z.infer<typeof HostFaceVerificationOutputSchema>;

export async function hostFaceVerification(
  input: HostFaceVerificationInput
): Promise<HostFaceVerificationOutput> {
  return hostFaceVerificationFlow(input);
}

const hostFaceVerificationPrompt = ai.definePrompt({
  name: 'hostFaceVerificationPrompt',
  input: { schema: HostFaceVerificationInputSchema },
  output: { schema: HostFaceVerificationOutputSchema },
  prompt: `You are a lenient identity assistant. Your goal is to verify that a human face is present in the image so the user can start streaming.

CRITERIA:
1. Is there a human face? (Be extremely lenient. Even if there are shadows, grain, or low light, if you can see a nose, eyes, or a face shape, mark as verified).
2. Only fail if the image is pure black, extremely blurry (no shapes), or clearly NOT a human.

If you can see a person at all, set 'isVerified' to true. Set 'lightingIssue' to false unless it's literally pitch black.

Image: {{media url=photoDataUri}}`,
});

const hostFaceVerificationFlow = ai.defineFlow(
  {
    name: 'hostFaceVerificationFlow',
    inputSchema: HostFaceVerificationInputSchema,
    outputSchema: HostFaceVerificationOutputSchema,
  },
  async (input) => {
    const { output } = await hostFaceVerificationPrompt(input);
    if (!output) {
      throw new Error('Failed to get output from host face verification prompt.');
    }
    return output;
  }
);
