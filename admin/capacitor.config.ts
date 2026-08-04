import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merypalencia.admin',
  appName: 'Mery Palencia Admin',
  webDir: 'dist',
  backgroundColor: '#050a0f',
  loggingBehavior: 'none',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    EdgeToEdge: {
      backgroundColor: '#00000000',
    },
  },
};

export default config;
