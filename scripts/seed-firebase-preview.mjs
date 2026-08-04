import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = "demo-mery-portfolio";
process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const app = getApps()[0] ?? initializeApp({ projectId });
const auth = getAuth(app);
const db = getFirestore(app);
const email = "preview-admin@local.test";
const password = "offline-preview-only";

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, password, emailVerified: true });
}

await auth.setCustomUserClaims(user.uid, { admin: true, role: "admin" });

const previewDocuments = [
  ["gallery/preview-featured", {
    title: "Destacada de vista previa",
    image: "",
    publicId: "",
    category: "Vista previa local",
    description: "Contenido aislado del emulador; no se publica.",
    order: 1,
    featured: true,
    extraImages: [],
  }],
  ["galleryPage/preview-gallery", {
    title: "Obra de vista previa",
    image: "",
    publicId: "",
    category: "Vista previa local",
    description: "Registro temporal para validar la interfaz Android.",
    order: 1,
    featured: false,
    extraImages: [],
  }],
  ["blogPosts/preview-post", {
    title: "Artículo de vista previa local",
    excerpt: "Este artículo existe únicamente en el emulador.",
    content: "Contenido temporal para verificar el panel sin conexión a producción.",
    date: "2026-08-01",
    scheduledAt: null,
    category: "Vista previa local",
    image: "",
    publicId: "",
    author: "Entorno local",
    published: false,
    views: 0,
    videoUrl: null,
  }],
  ["commissions/preview-tier", {
    name: "Comisión de vista previa",
    price: "Solo prueba local",
    description: "No representa una oferta publicada.",
    includes: ["Validación visual"],
    featured: true,
    order: 1,
  }],
  ["processSteps/preview-step", {
    number: "01",
    title: "Paso de vista previa",
    description: "Dato temporal del emulador local.",
    order: 1,
  }],
  ["settings/hero", {
    imageUrl: null,
    position: { x: 50, y: 50 },
  }],
];

const batch = db.batch();
for (const [path, data] of previewDocuments) {
  batch.set(db.doc(path), data);
}
await batch.commit();

console.log("Offline preview seeded for the debug Android application.");
