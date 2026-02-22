import { config } from 'dotenv';
config();

import '@/ai/flows/admin-ai-error-reports.ts';
import '@/ai/flows/ai-guided-host-profile-optimization-flow.ts';
import '@/ai/flows/host-face-verification-flow.ts';
import '@/ai/flows/personalized-host-recommendations-flow.ts';
import '@/ai/flows/nsfw-moderation-flow.ts';
