import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export function useCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [revision, setRevision] = useState(0);

  const retry = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!isFirebaseConfigured) {
      setError(new Error("Firebase no está configurado"));
      setLoading(false);
      return;
    }

    const q = query(collection(db, collectionName), ...constraints);
    const timeout = window.setTimeout(() => {
      setError(new Error(`La carga de ${collectionName} agotó el tiempo de espera`));
      setLoading(false);
    }, 12000);
    const unsub = onSnapshot(
      q,
      (snap) => {
        window.clearTimeout(timeout);
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
        setError(null);
        setLoading(false);
      },
      () => {
        window.clearTimeout(timeout);
        setError(new Error(`No se pudo cargar ${collectionName}`));
        setLoading(false);
      }
    );
    return () => {
      window.clearTimeout(timeout);
      unsub();
    };
  }, [collectionName, revision]);

  return { data, loading, error, retry };
}

// Hooks específicos para cada colección
export function useGallery() {
  // Featured items from gallery (shown in Home carousel)
  const result = useCollection<{
    id: string;
    title: string;
    image: string;
    category: string;
    description: string;
    order: number;
    featured: boolean;
    extraImages?: { url: string; publicId: string }[];
  }>("gallery", [where("featured", "==", true), orderBy("order", "asc")]);

  return {
    ...result,
    data: result.data.map((item) => ({
      ...item,
      extraImages: item.extraImages ?? [],
    })),
  };
}

export function useGalleryPage() {
  const result = useCollection<{
    id: string;
    title: string;
    image: string;
    category: string;
    description: string;
    order: number;
    extraImages?: { url: string; publicId: string }[];
  }>("gallery", [orderBy("order", "asc")]);

  // Normalize legacy items that have no extraImages field
  return {
    ...result,
    data: result.data.map((item) => ({
      ...item,
      extraImages: item.extraImages ?? [],
    })),
  };
}

export function useBlogPosts() {
  const result = useCollection<{
    id: string;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    category: string;
    readTime: number;
    image: string;
    author: string;
    published: boolean;
  }>("blogPosts", [where("published", "==", true)]);

  return {
    ...result,
    data: [...result.data].sort((left, right) => right.date.localeCompare(left.date)),
  };
}

export function useCommissions() {
  return useCollection<{
    id: string;
    name: string;
    price: string;
    description: string;
    includes: string[];
    featured: boolean;
    order: number;
  }>("commissions", [orderBy("order", "asc")]);
}

export function useProcessSteps() {
  return useCollection<{
    id: string;
    number: string;
    title: string;
    description: string;
    order: number;
  }>("processSteps", [orderBy("order", "asc")]);
}

export function useHeroImage() {
  const [data, setData] = useState<{ imageUrl: string | null; position: { x: number; y: number }; loading: boolean }>({
    imageUrl: null,
    position: { x: 50, y: 50 },
    loading: true,
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "hero"), (snap) => {
      setData({
        imageUrl: snap.exists() ? (snap.data().imageUrl ?? null) : null,
        position: snap.exists() ? (snap.data().position ?? { x: 50, y: 50 }) : { x: 50, y: 50 },
        loading: false,
      });
    });
    return unsub;
  }, []);

  return data;
}
