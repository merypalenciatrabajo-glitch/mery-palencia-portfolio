import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const projectId = "demo-mery-portfolio";
let testEnv: RulesTestEnvironment;

const validGalleryItem = {
  title: "Public item",
  image: "https://res.cloudinary.com/demo/image/upload/item.jpg",
  category: "ilustracion-digital",
  description: "Public description",
  order: 0,
  featured: true,
  extraImages: [],
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
    storage: {
      rules: readFileSync("storage.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "gallery", "public-item"), validGalleryItem);
    await setDoc(doc(context.firestore(), "blogPosts", "published-post"), {
      title: "Published",
      published: true,
      date: "2026-07-31",
    });
    await setDoc(doc(context.firestore(), "blogPosts", "draft-post"), {
      title: "Draft",
      published: false,
      date: "2026-08-01",
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore rules", () => {
  it("allows public portfolio reads and denies anonymous writes", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(db, "gallery", "public-item")));
    await assertFails(
      setDoc(doc(db, "gallery", "anonymous-write"), { title: "Denied" })
    );
  });

  it("only allows public blog queries constrained to published posts", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const publishedPosts = query(
      collection(db, "blogPosts"),
      where("published", "==", true),
      orderBy("date", "desc")
    );

    await assertSucceeds(getDocs(publishedPosts));
    await assertFails(getDocs(collection(db, "blogPosts")));
    await assertFails(getDoc(doc(db, "blogPosts", "draft-post")));
  });

  it("allows admin and editor roles to read drafts and write content", async () => {
    const adminDb = testEnv
      .authenticatedContext("admin-user", { role: "admin" })
      .firestore();
    const editorDb = testEnv
      .authenticatedContext("editor-user", { role: "editor" })
      .firestore();

    await assertSucceeds(getDoc(doc(adminDb, "blogPosts", "draft-post")));
    await assertSucceeds(
      setDoc(doc(adminDb, "gallery", "admin-write"), validGalleryItem)
    );
    await assertSucceeds(
      setDoc(doc(adminDb, "gallery", "tagged-write"), {
        ...validGalleryItem,
        hashtags: [
          { tag: "infantil", platforms: ["instagram", "facebook"] },
          { tag: "retrato-familiar", platforms: ["x"] },
        ],
      })
    );
    await assertFails(
      setDoc(doc(adminDb, "gallery", "too-many-tags"), {
        ...validGalleryItem,
        hashtags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
      })
    );
    await assertSucceeds(
      setDoc(doc(editorDb, "commissions", "editor-write"), {
        name: "Editor",
        price: "A convenir",
        description: "Servicio editorial",
        includes: ["Entrega digital"],
        featured: false,
        order: 0,
      })
    );
  });

  it("rejects unexpected fields in publicly readable documents", async () => {
    const adminDb = testEnv
      .authenticatedContext("admin-user", { role: "admin" })
      .firestore();

    await assertFails(
      setDoc(doc(adminDb, "gallery", "leaky-write"), {
        ...validGalleryItem,
        internalNotes: "must never become public",
      })
    );
    await assertFails(
      setDoc(doc(adminDb, "settings", "hero"), {
        imageUrl: "https://example.com/hero.webp",
        position: { x: 50, y: 50 },
        privateToken: "must never become public",
      })
    );
  });

  it("denies authenticated users without a content role and unknown collections", async () => {
    const userDb = testEnv.authenticatedContext("regular-user").firestore();
    const publicDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(userDb, "gallery", "regular-user-write"), {
        title: "Denied",
      })
    );
    await assertFails(getDoc(doc(publicDb, "private", "unknown")));
  });

  it("protects checksummed Android release metadata", async () => {
    const publicDb = testEnv.unauthenticatedContext().firestore();
    const adminDb = testEnv
      .authenticatedContext("release-admin", { role: "admin" })
      .firestore();
    const release = {
      version: "1.9.1",
      apkUrl: "https://github.com/mery/repo/releases/download/v1.9.1/admin.apk",
      sha256: "a".repeat(64),
      changelog: "Security fixes",
      updatedAt: "2026-07-31T00:00:00.000Z",
    };

    await assertFails(getDoc(doc(publicDb, "settings", "appVersion")));
    await assertSucceeds(setDoc(doc(adminDb, "settings", "appVersion"), release));
    await assertFails(setDoc(doc(adminDb, "settings", "appVersion"), {
      ...release,
      sha256: "unverified",
    }));
  });
});

describe("Storage rules", () => {
  it("rejects anonymous uploads and accepts content roles", async () => {
    const anonymousFile = ref(
      testEnv.unauthenticatedContext().storage(),
      "quality-checks/anonymous.txt"
    );
    const adminImage = ref(
      testEnv
        .authenticatedContext("storage-admin", { admin: true })
        .storage(),
      "quality-checks/admin.png"
    );
    const adminText = ref(
      testEnv
        .authenticatedContext("storage-admin", { admin: true })
        .storage(),
      "quality-checks/admin.txt"
    );

    await assertFails(uploadString(anonymousFile, "denied"));
    await assertSucceeds(
      uploadString(adminImage, "allowed", "raw", { contentType: "image/png" })
    );
    await assertFails(
      uploadString(adminText, "denied", "raw", { contentType: "text/plain" })
    );
  });
});
