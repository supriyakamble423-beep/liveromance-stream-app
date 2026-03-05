# Testing liveromance-stream-app (Global Love)

## Dev Server Setup

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev` (runs on port 9003 by default)
3. Access at `http://localhost:9003`

If port 9003 is already in use, kill the existing process first:
```bash
ss -tlnp | grep 9003  # find the PID
kill -9 <PID>
```

## Key Routes

| Route | Page | What to test |
|---|---|---|
| `/global` | Global Marketplace | AdBanner, category tabs, stream grid |
| `/wallet` | Vault/Wallet | Diamond balance, Watch & Earn flow |
| `/host-p` | Host Profile | Settings gear → Identity Tunnel (login dialog) |
| `/stream/simulate_host` | Stream/Broadcast | Camera permissions, Firebase init guard |
| `/stream/<id>` | Stream viewer | Chat, viewer experience |

## Testing Without Firebase Env Vars

When `NEXT_PUBLIC_FIREBASE_*` env vars are not set:
- Firebase will fail to initialize
- `areServicesAvailable` will be `false` in the useFirebase hook
- Pages using Firebase will show a loading spinner for 10 seconds, then a timeout fallback with "Connection Failed" message and "Retry Connection" button
- The Wallet page renders but with disabled functionality (no Firestore writes)
- The Login dialog (Identity Tunnel) renders but "Connect Google" won't work
- AdBanner shows "Ad Slot Available" placeholder with config hint

This is useful for testing the timeout/fallback UI without needing real Firebase credentials.

## Testing With Firebase

To fully test Firebase-dependent features, set these env vars in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Testing Adsterra Ads

Ads require these env vars:
- `NEXT_PUBLIC_ADSTERRA_SCRIPT_URL` — Adsterra banner script URL
- `NEXT_PUBLIC_ADSTERRA_OPTIONS_KEY` — Adsterra ad container options key
- `NEXT_PUBLIC_ADSTERRA_DIRECT_LINK` — Direct link for wallet Watch & Earn rewards

Without these, AdBanner shows a placeholder with "Configure NEXT_PUBLIC_ADSTERRA_SCRIPT_URL" hint.

## Age Verification Gate

The `/global` page shows an "Identity Check" age verification dialog on first visit. Click "I AM 18+ / ENTER" to dismiss it.

## Common Issues

- **Port already in use**: Kill existing Node process on port 9003 before starting dev server
- **Vercel login redirect**: If browser shows Vercel login instead of the app, clear browser cache/cookies
- **ESLint circular reference**: Running `npm run lint` may trigger ESLint setup that creates a `.eslintrc.json` with circular reference — this is a pre-existing issue
- **Console warnings**: Missing `icon-192.png` (404), Next.js image `sizes` prop warnings, and `aria-describedby` warnings on DialogContent are all pre-existing and not related to app functionality

## Devin Secrets Needed

- Firebase env vars (listed above) — needed for full Firebase testing
- Adsterra credentials (listed above) — needed for ad integration testing
