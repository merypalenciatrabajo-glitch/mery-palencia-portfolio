import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import path from 'node:path';
import { loadEnv } from 'vite';

const clientRoot = path.resolve('client');
const env = { ...loadEnv('production', clientRoot, ''), ...process.env };
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];
const missing = required.filter((key) => !env[key]?.trim());

if (missing.length > 0) {
  throw new Error(`Missing public Firebase variables: ${missing.join(', ')}`);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}, 'public-live-check');
const db = getFirestore(app);

const requests = [
  ...['gallery', 'commissions', 'processSteps'].map(async (name) => {
    const snapshot = await getDocs(collection(db, name));
    return [name, snapshot.size];
  }),
  (async () => {
    const snapshot = await getDocs(query(collection(db, 'blogPosts'), where('published', '==', true)));
    return ['publishedBlogPosts', snapshot.size];
  })(),
  (async () => {
    const snapshot = await getDoc(doc(db, 'settings', 'hero'));
    return ['heroSettings', snapshot.exists() ? 1 : 0];
  })(),
];
const results = await Promise.allSettled(requests);
const checks = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
const failures = results.flatMap((result, index) => result.status === 'rejected'
  ? [`${index < 3 ? ['gallery', 'commissions', 'processSteps'][index] : index === 3 ? 'publishedBlogPosts' : 'heroSettings'}: ${result.reason?.code ?? result.reason}`]
  : []);

console.log(Object.fromEntries(checks));
if (failures.length > 0) {
  throw new Error(`Public Firebase checks failed: ${failures.join('; ')}`);
}
