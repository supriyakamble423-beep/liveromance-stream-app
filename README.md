# Global Love - Live Romance Grid

Global Love is a professional social discovery and live-streaming marketplace built with Next.js, Firebase, Genkit AI, and Capacitor.

## 🚀 App Summary
A high-engagement platform where hosts broadcast live signals and users interact via a diamond-based gifting economy. It features AI-powered moderation and a viral 1% lifetime referral engine.

## 📂 Project Structure & Key Files
- **Marketplace** (`src/app/global/`): The main landing page for users to discover live hosts.
- **Host Control** (`src/app/host-p/`): Personal dashboard for hosts to go live and manage profiles.
- **Streaming Engine** (`src/app/stream/[id]/`): Real-time video/audio broadcast node.
- **Wallet & Earn** (`src/app/wallet/`): Monetization hub featuring Adsterra Smartlinks for earning diamonds.
- **Identity Scan** (`src/app/host-f/`): AI-guided face verification for host onboarding.
- **Admin Sentinel** (`src/app/admin/`): Oversight control room for managing payouts and network health.
- **AI Flows** (`src/ai/flows/`): Genkit-powered flows for NSFW moderation and recommendations.

## 🧠 Core Logic
- **Economy**: Users earn 5 Diamonds per ad watch (Adsterra). Hosts receive tips and can withdraw earnings at a rate of 1000 Diamonds = ₹20 (post-platform commission).
- **Security**: Mandatory AI identity lock for all hosts. Real-time NSFW scanning on public nodes.
- **Growth**: Viral referral system giving architects a 1% residual income from their network's lifetime revenue.

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, ShadCN UI.
- **Backend**: Firebase (Firestore, Auth, Storage).
- **AI**: Genkit with Google Gemini 2.5.
- **Mobile**: Capacitor 7 for Android/iOS APK builds.
- **Ads**: Adsterra Global Social Bar and Smartlinks.

## 🔑 Environment Setup
Ensure your `.env` file contains valid Firebase credentials:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ...etc.
