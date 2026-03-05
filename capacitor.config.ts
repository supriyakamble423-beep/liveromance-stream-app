import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liveromance.app',
  appName: 'Global Love',
  webDir: 'out',
  server: {
    url: 'https://liveromance-stream-app.vercel.app', // ✅ LIVE URL
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true }
  }
};

export default config;