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
    .describe('Whether the photo contains a clear, verifiable human face.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score (0-1) in the verification decision.'),
  lightingIssue: z
    .boolean()
    .describe('Whether the verification failed specifically due to lighting issues.'),
  message: z
    .string()
    .describe('A message explaining the verification result or any issues.'),
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
  prompt: `You are an AI identity assistant. Analyze the image to confirm if it is a REAL HUMAN FACE.

CRITERIA:
1. Is it a human face? (Not an object, animal, or screen photo).
2. Is the lighting sufficient to see features?
3. Is the face clear and centered?

If there is a person present but it's too dark or blurry, set 'lightingIssue' to true and 'isVerified' to false. 
Provide a friendly message like "Face detected but please move to a brighter area" or "Verification successful".

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
