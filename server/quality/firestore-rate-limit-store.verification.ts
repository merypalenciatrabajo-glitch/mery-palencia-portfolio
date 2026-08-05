import type { Firestore } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { FirestoreRateLimitStore } from "../firestore-rate-limit-store";

function createFakeFirestore() {
  const documents = new Map<string, Record<string, unknown>>();
  const reference = (id: string) => ({
    id,
    get: async () => ({ data: () => documents.get(id) }),
    delete: async () => {
      documents.delete(id);
    },
  });

  return {
    collection: () => ({ doc: reference }),
    runTransaction: async <T>(
      operation: (transaction: {
        get: (ref: ReturnType<typeof reference>) => Promise<{ data: () => Record<string, unknown> | undefined }>;
        set: (ref: ReturnType<typeof reference>, value: Record<string, unknown>) => void;
        update: (ref: ReturnType<typeof reference>, value: Record<string, unknown>) => void;
      }) => Promise<T>
    ) => {
      const transaction = {
        get: async (ref: ReturnType<typeof reference>) => ({
          data: () => documents.get(ref.id),
        }),
        set: (ref: ReturnType<typeof reference>, value: Record<string, unknown>) => {
          documents.set(ref.id, value);
        },
        update: (ref: ReturnType<typeof reference>, value: Record<string, unknown>) => {
          documents.set(ref.id, { ...documents.get(ref.id), ...value });
        },
      };
      return operation(transaction);
    },
  } as unknown as Firestore;
}

describe("Firestore rate-limit store", () => {
  it("shares atomic counters and supports decrement/reset", async () => {
    const firestore = createFakeFirestore();
    const firstInstance = new FirestoreRateLimitStore(
      60_000,
      "api",
      firestore
    );
    const secondInstance = new FirestoreRateLimitStore(
      60_000,
      "api",
      firestore
    );

    await expect(firstInstance.increment("client-ip")).resolves.toMatchObject({
      totalHits: 1,
    });
    await expect(secondInstance.increment("client-ip")).resolves.toMatchObject({
      totalHits: 2,
    });
    await secondInstance.decrement("client-ip");
    await expect(firstInstance.get("client-ip")).resolves.toMatchObject({
      totalHits: 1,
    });
    await firstInstance.resetKey("client-ip");
    await expect(secondInstance.get("client-ip")).resolves.toBeUndefined();
  });

  it("isolates counters with different prefixes", async () => {
    const firestore = createFakeFirestore();
    const api = new FirestoreRateLimitStore(60_000, "api", firestore);
    const auth = new FirestoreRateLimitStore(60_000, "auth", firestore);

    await api.increment("same-client");
    await expect(auth.get("same-client")).resolves.toBeUndefined();
  });
});
