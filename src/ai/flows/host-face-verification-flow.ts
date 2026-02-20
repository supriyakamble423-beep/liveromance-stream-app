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
  prompt: `You are an AI assistant specialized in facial verification for identity checks during host onboarding.
Your task is to analyze a provided image and determine if it contains a clear, well-lit human face suitable for verification.

Critically assess the quality of the image for facial recognition. Consider factors like:
- Is a face clearly visible and centered?
- Is the lighting sufficient and even, without harsh shadows or overexposure?
- Are there any obstructions (e.g., hats, sunglasses, hands) covering the face?
- Does the image appear to be of a real person, not a photo of a photo or a screen?
- Is the face oriented correctly (e.g., looking straight at the camera)?

Based on your analysis, set 'isVerified' to true if the face meets high-quality standards for verification, otherwise set it to false.
Provide a 'confidence' score (0-1) reflecting your certainty in the 'isVerified' decision. A score closer to 1 indicates higher confidence.
Write a concise 'message' explaining the outcome, highlighting any issues found if 'isVerified' is false.

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
