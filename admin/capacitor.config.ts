import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merypalencia.admin',
  appName: 'Mery Palencia Admin',
  webDir: 'dist',
  plugins: {
    EdgeToEdge: {
      backgroundColor: '#00000000',
    },
  },
};

export default config;
