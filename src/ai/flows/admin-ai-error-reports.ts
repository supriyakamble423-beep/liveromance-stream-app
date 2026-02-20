'use server';
/**
 * @fileOverview An AI agent for generating administrative error reports.
 *
 * - adminAIErrorReports - A function that analyzes system logs and host verification issues to create auto-reports.
 * - AdminAIErrorReportsInput - The input type for the adminAIErrorReports function.
 * - AdminAIErrorReportsOutput - The return type for the adminAIErrorReports function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminAIErrorReportsInputSchema = z.object({
  systemLogs: z
    .string()
    .describe('A compilation of recent system logs and operational data.'),
  hostVerificationIssues: z
    .array(z.string())
    .describe('A list of descriptions for recent host verification failures or flags.'),
});
export type AdminAIErrorReportsInput = z.infer<typeof AdminAIErrorReportsInputSchema>;

const ReportSchema = z.object({
  reportType: z
    .enum(['System Anomaly', 'Host Verification Issue', 'Network Alert', 'Database Error', 'Security Breach', 'Other'])
    .describe('The type of operational problem identified.'),
  description: z
    .string()
    .describe('A concise summary of the critical operational problem.'),
  severity: z
    .enum(['Low', 'Medium', 'High', 'Critical'])
    .describe('The urgency and impact level of the identified problem.'),
});

const AdminAIErrorReportsOutputSchema = z.object({
  autoReports: z
    .array(ReportSchema)
    .describe('A list of concise auto-reports generated from the input data.'),
});
export type AdminAIErrorReportsOutput = z.infer<typeof AdminAIErrorReportsOutputSchema>;

export async function adminAIErrorReports(
  input: AdminAIErrorReportsInput
): Promise<AdminAIErrorReportsOutput> {
  return adminAIErrorReportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminAIErrorReportsPrompt',
  input: {schema: AdminAIErrorReportsInputSchema},
  output: {schema: AdminAIErrorReportsOutputSchema},
  prompt: `You are an AI Error Manager for a social discovery app. Your task is to analyze system logs and host verification issues to generate concise auto-reports. Focus only on critical operational problems.

Instructions:
1. Review the provided 'systemLogs' and 'hostVerificationIssues'.
2. Identify key operational problems that require administrative attention.
3. For each problem, generate a structured report including 'reportType', 'description', and 'severity'.
4. Be concise and prioritize the most important issues.
5. If there are no critical issues, return an empty 'autoReports' array.

System Logs:
{{{systemLogs}}}

Host Verification Issues:
{{#each hostVerificationIssues}}
- {{{this}}}
{{/each}}

Generate the auto-reports in JSON format according to the output schema.`,
});

const adminAIErrorReportsFlow = ai.defineFlow(
  {
    name: 'adminAIErrorReportsFlow',
    inputSchema: AdminAIErrorReportsInputSchema,
    outputSchema: AdminAIErrorReportsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
