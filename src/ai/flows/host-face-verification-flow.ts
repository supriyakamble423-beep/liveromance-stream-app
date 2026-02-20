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
    .describe('Whether the photo contains a detectable human face.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score (0-1) in the verification decision.'),
  lightingIssue: z
    .boolean()
    .describe('Whether the lighting is extremely poor, making face detection impossible.'),
  message: z
    .string()
    .describe('A message explaining the verification result.'),
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
  prompt: `You are an AI identity assistant. Your primary task is to detect if there is a human face in the image.

CRITERIA:
1. Is there a human face visible?
2. Is the person identifiable (even if lighting isn't perfect)?

Be lenient with lighting. Only set 'lightingIssue' to true if it is pitch black or so blurry that no facial features are visible at all. If you can see a face, set 'isVerified' to true.

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
