import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export function useCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
      setLoading(false);
    });
    return unsub;
  }, [collectionName]);

  return { data, loading };
}

// Hooks específicos para cada colección
export function useGallery() {
  // Featured items from galleryPage (shown in Home carousel)
  const result = useCollection<{
    id: string;
    title: string;
    image: string;
    category: string;
    description: string;
    order: number;
    featured: boolean;
    extraImages?: { url: string; publicId: string }[];
  }>("galleryPage", [where("featured", "==", true), orderBy("order", "asc")]);

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
  }>("galleryPage", [orderBy("order", "asc")]);

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
  return useCollection<{
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
  }>("blogPosts", [orderBy("date", "desc")]);
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
