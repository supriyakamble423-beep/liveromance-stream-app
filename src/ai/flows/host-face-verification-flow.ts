
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
  prompt: `You are an AI assistant specialized in facial verification for identity checks.
Your task is to analyze a provided image and determine if it contains a clear, well-lit human face suitable for verification.

CRITICAL ASSESSMENT:
1. LIGHTING: Is the face evenly lit? Harsh shadows, backlighting, or extreme darkness must set 'lightingIssue' to true.
2. ORIENTATION: Is the face looking directly at the camera?
3. CLARITY: Is the image sharp or blurry?
4. OBSTRUCTIONS: Are there hats, sunglasses, or hands covering the face?

Based on your analysis, set 'isVerified' to true only if ALL criteria are met. 
If the failure is primarily due to lighting (too dark, too bright, harsh shadows), set 'lightingIssue' to true.
Provide a concise 'message' explaining why if verification fails.

Image for analysis: {{media url=photoDataUri}}`,
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
